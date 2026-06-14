// import type { WebSocket } from "bun";
import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import { websocket } from "hono/bun";

const app = new Hono();

// type WebSocket = {
//     send() : () => {}
// }

// const webSocket = {

//     open(ws: WebSocket) {
//         console.log("connected");
//     },

//     close(ws: WebSocket) {
//         console.log("Closed")
//     }

// }

interface websocketType extends ServerWebSocket {
  connectionID?: string;
}

app.get("/health", (c) => {
  return c.json({
    status: 200,
    Message: "server is running",
  });
});

const sockets: websocketType[] = [];

Bun.serve({
  port: 3001,

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) {
        return;
      }
    }
    return app.fetch(req);
  },

  // websocket : webSocket
  websocket: {
    open: (ws: websocketType) => {
      console.log("connection open");
      const connectionID = crypto.randomUUID();
      ws.connectionID = connectionID;
      sockets.push(ws);
    },
    close: (ws) => {
      console.log("connection close");
    },
    message: (ws: websocketType, message) => {
      console.log(message);
      sockets.map((w) => {
        if (w.connectionID !== ws.connectionID) {
          w.send(message);
        //   w.send(w.connectionID ?? "null");
        }
      });
    },
  },
});

console.log(`server is running on http://localhost:3001`);
