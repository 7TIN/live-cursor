import { Hono } from "hono";


const app = new Hono();


const webSocket = {

    open(ws: WebSocket) {
        console.log("connected");
    },

    close(ws: WebSocket) {
        console.log("Closed")
    }

}


app.get("/health", (c) => {
    return c.json({
        status : 200,
        Message : "server is running",
    })
})

Bun.serve({
    fetch : app.fetch,
    port : 3001,
    // websocket : webSocket
})

console.log(`server is running on http://localhost:3001`);