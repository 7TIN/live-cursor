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
    close: (ws: websocketType) => {
      console.log("connection close");
      const temp = sockets.filter((s) => s.connectionID !== ws.connectionID);

      temp.forEach((s) => {
        s.send(
          JSON.stringify({
            type: "userDisconnected",
            userId: ws.connectionID,
          }),
        );
      });
    },
    message: (ws: websocketType, message) => {
    //   console.log(message);
      const parsed = JSON.parse(message.toString());

      if (parsed.type === "mousePosition") {
        sockets.map((w) => {
          if (w.connectionID !== ws.connectionID) {
            w.send(JSON.stringify({ ...parsed, userId: ws.connectionID }));
          }
        });
      } else if (parsed.type === "chat") {
        sockets.map((w) => {
          if (w.connectionID !== ws.connectionID) {
            w.send(JSON.stringify(parsed));
          }
        });
      } else if (parsed.type === "connection") {
        console.log(parsed.message);
      }
    },
  },
});

console.log(`server is running on http://localhost:3001`);
