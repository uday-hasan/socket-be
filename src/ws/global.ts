import { type WebSocketServer, WebSocket } from "ws";
function notifyAll(
  payload: { type: string; payload: any },
  wss: WebSocketServer,
) {
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

export { notifyAll };
