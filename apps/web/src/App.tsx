import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { APITester } from "./APITester";
import "./index.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import type { ServerWebSocket } from "bun";

interface websocketType extends WebSocket {
  connectionID?: string;
}

type mousePositionType = {
  x: number;
  y: number;
};

export function App() {
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  const useThrottle = <T extends (...args: globalThis.MouseEvent[]) => void>(
    callback: T,
    delay: number,
  ) => {
    let lastcall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastcall >= delay) {
        lastcall = now;
        callback(...args);
      }
    };
  };

  useEffect(() => {
    // use the DOM MouseEvent type to match window.addEventListener signature
    // const handleMouseEvent = (e: globalThis.MouseEvent) => {
    //   setMousePosition({
    //     x: e.clientX,
    //     y: e.clientY,
    //   });
    // };
    // function Throttle < T extends (...args : []) => void>(callback : T, delay : number) {}

    const handleMouseEvent = useThrottle((e: globalThis.MouseEvent) => {
      const position = {
        x: e.clientX,
        y: e.clientY,
      };
      setMousePosition(position);
      if (webSocket.current?.readyState === WebSocket.OPEN) {
        webSocket.current?.send(
          JSON.stringify({ type: "mousePosition", mousePosition: position }),
        );
      }
    }, 100);

    window.addEventListener("mousemove", handleMouseEvent);

    return () => {
      window.removeEventListener("mousemove", handleMouseEvent);
    };
  }, []);

  const [msg, setMsg] = useState<string>("");
  const [msgInput, setMsgInput] = useState<string>("");
  const [mousePositions, setMousePositions] = useState<mousePositionType[]>([]);

  const webSocket = useRef<websocketType | null>(null);

  const handleInputMsgChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMsgInput(e.target.value);
  };

  const handleMessage = (e: Event) => {};

  const HandleSendMsg = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    webSocket.current?.send(JSON.stringify({type : "chat", message: msgInput}));
  };

  useEffect(() => {
    const wss = new WebSocket("ws://localhost:3001/ws") as websocketType;

    webSocket.current = wss;

    wss.addEventListener("open", (e) => {
      console.log("connected");
      // wss.send("connected from client");
    });

    wss.addEventListener("close", (e) => {
      wss.send(JSON.stringify({type : "connection", message : "Close"}));
    });

    wss.addEventListener("message", (e) => {
      // console.log(e.data);
      // const msg = JSON.stringify(e.data)
      // console.log(msg)
      const msg = JSON.parse(e.data);
      if (msg.type === "mousePosition") {
        setMousePositions((mp) => [...mp, msg.mousePosition]);
      } else if (msg.type === "chat") {
        setMsg(msg.message);
      }
    });

    wss.addEventListener("error", (e) => {});

    return () => {
      wss.close();
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center mx-auto p-8 z-10 font-mono">
      Hello
      <p>{msg}</p>
      <div className="flex p-4 gap-x-4">
        <input
          type="text"
          className="border-2 px-2 rounded-md border-neutral-500 text-neutral-700 font-mono placeholder:text-neutral-300"
          placeholder="enter msg here"
          onChange={handleInputMsgChange}
        />
        <button
          className="rounded-md py-1 px-4 border-2 active:bg-neutral-700 bg-neutral-900 text-white"
          onClick={HandleSendMsg}
        >
          Send
        </button>
      </div>
      <div>
        <p>x : {mousePosition.x}</p>
        <p>y : {mousePosition.y}</p>
      </div>
      <div>
        <p>All the positions</p>
        {mousePositions.map((pos, key) => (
          <div key={key}>
            <p>{pos.x}</p>
            <p>{pos.y}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
