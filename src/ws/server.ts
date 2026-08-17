import { WebSocketServer, WebSocket } from "ws";
import type { Server, IncomingMessage } from "http";
import { verifyAccessToken } from "../utils/jwt.js";
import { MessageService } from "../module/message/message.service.js";

const wss = new WebSocketServer({ noServer: true, path: "/ws" });

const sendJson = (socket: WebSocket, data: unknown) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
};

// Back to a real Map now — this is the same reverse-lookup structure from
// before: channel name -> set of sockets subscribed to it.
const subscriptions = new Map<string, Set<WebSocket>>();

// A socket with our own bookkeeping attached: userId is null for guests
// (no cookie, or an invalid/expired one) — connection is still allowed.
interface AuthedSocket extends WebSocket {
  userId: string | null;
  channels: Set<string>;
}

// Manually parses the raw Cookie header string. We're NOT inside Express
// here — this is the raw http.IncomingMessage during the upgrade, so
// cookie-parser's middleware never runs on it. req.headers.cookie is just
// a plain string like "accessToken=abc123; refreshToken=xyz789".
function extractCookie(req: IncomingMessage, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function subscribe(channel: string, socket: AuthedSocket): void {
  if (!subscriptions.has(channel)) {
    subscriptions.set(channel, new Set());
  }
  subscriptions.get(channel)!.add(socket);
  socket.channels.add(channel);
}

function unsubscribe(channel: string, socket: AuthedSocket): void {
  const subs = subscriptions.get(channel);
  if (!subs) return;
  subs.delete(socket);
  socket.channels.delete(channel);
  if (subs.size === 0) subscriptions.delete(channel);
}

const createWebSocketServer = (server: Server) => {
  server.on("upgrade", (req, socket, head) => {
    // OPTIONAL AUTH — mirrors your optionalAuthenticate REST middleware.
    // We try to identify the user if a cookie is present, but we NEVER
    // reject the connection just because one is missing. This is what
    // lets unauthenticated visitors still receive global broadcasts
    // (notifications), while personal/chat features simply won't apply
    // to them since they'll have no userId to auto-subscribe with.
    const token = extractCookie(req, "accessToken");
    let userId: string | null = null;

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        userId = decoded.userId;
      } catch {
        // Invalid or expired token — NOT an error worth rejecting the
        // connection over. Just proceed as a guest, same as
        // optionalAuthenticate does for regular requests.
        console.log(
          "WS connection: invalid/expired token, continuing as guest",
        );
      }
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, userId);
    });
  });

  wss.on(
    "connection",
    (socket: WebSocket, req: IncomingMessage, userId: string | null) => {
      const client = socket as AuthedSocket;
      client.userId = userId;
      client.channels = new Set();

      console.log(`A client connected — userId=${userId ?? "guest"}`);

      sendJson(socket, {
        type: "welcome",
        payload: "Welcome to the WebSocket server!",
      });

      // Only auto-subscribe to a personal channel if we actually know who
      // this is. Guests simply don't get one — they can still receive
      // anything broadcast globally (via wss.clients, e.g. your existing
      // notifyAll), just nothing addressed to a specific userId.
      if (client.userId) {
        subscribe(`user:${client.userId}`, client);
      }

      socket.on("error", (error) => {
        sendJson(socket, {
          type: "error",
          payload: "An error occured: " + error.message,
        });
        return socket.terminate();
      });

      socket.on("close", () => {
        console.log(`A client disconnected — userId=${userId ?? "guest"}`);
        // Clean up EVERY channel this socket was in, including its personal
        // one — same pattern as before, just generalized to whatever
        // channels ended up in the Set
        for (const channel of client.channels) {
          unsubscribe(channel, client);
        }
      });

      socket.on("message", async (buffer: Buffer) => {
        let message: {
          type: string;
          channel?: string;
          to?: string;
          text?: string;
          payload?: unknown;
        };

        try {
          message = JSON.parse(buffer.toString());
        } catch {
          sendJson(socket, { type: "error", payload: "Invalid JSON" });
          return;
        }

        // Explicit subscribe/unsubscribe still exist for OTHER channels the
        // client asks for on top of their automatic personal one — e.g. a
        // specific conversation:<id> channel once a chat is opened
        if (
          message.type === "subscribe" &&
          typeof message.channel === "string"
        ) {
          subscribe(message.channel, client);
          sendJson(socket, { type: "subscribed", channel: message.channel });
          return;
        }

        if (
          message.type === "unsubscribe" &&
          typeof message.channel === "string"
        ) {
          unsubscribe(message.channel, client);
          sendJson(socket, { type: "unsubscribed", channel: message.channel });
        }

        if (message.type === "dm") {
          if (!client.userId) {
            sendJson(socket, {
              type: "error",
              payload: "Login required to send messages",
            });
            return;
          }
          if (
            typeof message.to !== "string" ||
            typeof message.text !== "string" ||
            !message.text.trim()
          ) {
            sendJson(socket, { type: "error", payload: "Invalid dm payload" });
            return;
          }

          try {
            const saved = await MessageService.createMessage(
              client.userId,
              message.to,
              message.text.trim(),
            );

            // Deliver to recipient (all their open tabs/devices, if online)
            broadcastToChannel(`user:${message.to}`, {
              kind: "dm",
              message: saved,
            });

            // Echo back to sender too — covers their OTHER open tabs, and
            // confirms delivery/gives them the saved record (with real id/createdAt)
            broadcastToChannel(`user:${client.userId}`, {
              kind: "dm",
              message: saved,
            });
          } catch (err) {
            sendJson(socket, {
              type: "error",
              payload: "Failed to send message",
            });
          }
          return;
        }
      });
    },
  );

  // Same shape as your earlier broadcastToChannel — the function anything
  // else in your backend (controllers, services) calls to push a realtime
  // event to whoever's subscribed to a given channel, personal or not.
  function broadcastToChannel(channel: string, payload: unknown): void {
    const subs = subscriptions.get(channel);
    if (!subs) return;
    for (const client of subs) {
      sendJson(client, { type: "event", channel, payload });
    }
  }

  // Reaches EVERY connected client — guests included, since this loops
  // wss.clients directly rather than any channel subscription. This is
  // the actual mechanism your global, unprotected notifications should
  // use — no subscribe step required at all.
  function broadcastToAll(payload: unknown): void {
    console.log("broadcastToAll → client count:", wss.clients.size);
    for (const client of wss.clients) {
      sendJson(client, { type: "notification", payload });
    }
  }

  return { wss, broadcastToChannel, broadcastToAll };
};

export { createWebSocketServer };
