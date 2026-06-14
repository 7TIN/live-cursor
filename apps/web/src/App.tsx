import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { APITester } from "./APITester";
import "./index.css";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import type { ServerWebSocket } from "bun";

interface websocketType extends WebSocket {
  connectionID?: string;
}

export function App() {
  const [msg, setMsg] = useState<string>("");
  const [msgInput, setMsgInput] = useState<string>("");

  const webSocket = useRef<websocketType | null>(null);

  const handleInputMsgChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMsgInput(e.target.value);
  }

  const handleMessage = (e: Event) => {};

  const HandleSendMsg = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    webSocket.current?.send(msgInput);
  };

  useEffect(() => {
    const wss = new WebSocket("ws://localhost:3001/ws") as websocketType;

    webSocket.current = wss;

    wss.addEventListener("open", (e) => {
      console.log("connected");
      wss.send("connected from client");
    });

    wss.addEventListener("close", (e) => {
      wss.send("connection close");
    });

    wss.addEventListener("message", (e) => {
      // console.log(e.data);
      // const msg = JSON.stringify(e.data)
      // console.log(msg)
      setMsg(e.data)
    });

    wss.addEventListener("error", (e) => {});

    return () => {
      wss.close();
    };
  }, []);

  return (
    <div className="container mx-auto p-8 text-center relative z-10 font-mono">
      Hello
      <p>
        {msg}
      </p>
      <div className="flex p-4 gap-x-4">
        <input type="text" className="border-2 px-2 rounded-md border-neutral-500 text-neutral-700 font-mono placeholder:text-neutral-300" placeholder="enter msg here" onChange={handleInputMsgChange} />
        <button className="rounded-md py-1 px-4 border-2 active:bg-neutral-700 bg-neutral-900 text-white" onClick={HandleSendMsg}>Send</button>
      </div>
    </div>
  );
}

export default App;
