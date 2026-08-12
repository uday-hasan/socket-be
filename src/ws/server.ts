import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

const wss = new WebSocketServer({ noServer: true, path: "/ws" });

const sendJson = (socket: WebSocket, data: unknown) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
};

// const subscriptions = new Map<string, Set<WebSocket>>();

const createWebSocketServer = (server: Server) => {
  server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  // const clients = new Set<string>();

  wss.on("connection", (socket) => {
    console.log("A client connected");
    sendJson(socket, {
      type: "welcome",
      payload: "Welcome to the WebSocket server!",
    });

    socket.on("error", (error) => {
      sendJson(socket, {
        type: "error",
        payload: "An error occured: " + error.message,
      });
      return socket.terminate();
    });

    socket.on("close", () => {
      console.log("A client disconnected");
    });

    socket.on("message", (buffer: Buffer) => {
      let message: { type: string; payload: any };

      try {
        message = JSON.parse(buffer.toString());
      } catch (error) {
        sendJson(socket, { type: "error", payload: "Invalid JSON" });
        return;
      }

      // if(message.type === "subscribe"){

      // }
    });
  });
  return { wss };
};

export { createWebSocketServer };
