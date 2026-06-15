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
import { Pointer } from "lucide-react";
import { RemoteCursor } from "./components/ui/RemoteCursor";

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
  const [animatedPosition, setAnimatedPosition] = useState({
    x: 0,
    y: 0,
  });

  const positionQueueRef = useRef<mousePositionType[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef({
    isAnimating: false,
    startPosition: { x: 0, y: 0 },
    targetPosition: { x: 0, y: 0 },
    startTime: 0,
    duration: 120, // 120ms smooth animation between positions
  });

  const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
  };
  const animateNextPosition = useCallback(() => {
    const state = animationStateRef.current;

    if (state.isAnimating) {
      const now = Date.now();
      const elapsed = now - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);

      const newX = lerp(
        state.startPosition.x,
        state.targetPosition.x,
        progress,
      );
      const newY = lerp(
        state.startPosition.y,
        state.targetPosition.y,
        progress,
      );

      setAnimatedPosition({ x: newX, y: newY });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateNextPosition);
      } else {
        // Animation complete, move to next position in queue
        state.isAnimating = false;
        if (positionQueueRef.current.length > 0) {
          const nextTarget = positionQueueRef.current.shift()!;
          state.startPosition = { x: newX, y: newY };
          state.targetPosition = nextTarget;
          state.startTime = Date.now();
          state.isAnimating = true;
          animationFrameRef.current =
            requestAnimationFrame(animateNextPosition);
        }
      }
    } else if (positionQueueRef.current.length > 0) {
      // Start new animation
      const nextTarget = positionQueueRef.current.shift()!;
      state.startPosition = { ...animatedPosition };
      state.targetPosition = nextTarget;
      state.startTime = Date.now();
      state.isAnimating = true;
      animationFrameRef.current = requestAnimationFrame(animateNextPosition);
    }
  }, [animatedPosition]);

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
    }, 50);

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
    webSocket.current?.send(
      JSON.stringify({ type: "chat", message: msgInput }),
    );
  };

  useEffect(() => {
    const wss = new WebSocket("ws://localhost:3001/ws") as websocketType;

    webSocket.current = wss;

    wss.addEventListener("open", (e) => {
      console.log("connected");
      // wss.send("connected from client");
    });

    wss.addEventListener("close", (e) => {
      wss.send(JSON.stringify({ type: "connection", message: "Close" }));
    });

    wss.addEventListener("message", (e) => {
      // console.log(e.data);
      // const msg = JSON.stringify(e.data)
      // console.log(msg)
      const msg = JSON.parse(e.data);
      if (msg.type === "mousePosition") {
        // setMousePositions((mp) => [...mp, msg.mousePosition]);

        positionQueueRef.current.push(msg.mousePosition);
        animateNextPosition();
      } else if (msg.type === "chat") {
        setMsg(msg.message);
      }
    });

    wss.addEventListener("error", (e) => {});

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      wss.close();
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center mx-auto p-8 z-10 font-mono">
      {/* <div
        className="fixed pointer-events-none transition-none"
        style={{
          left: animatedPosition.x,
          top: animatedPosition.y,
          transform: "translate(-12px, -12px)",
        }}
      >
        <Pointer className="w-6 h-6 text-blue-500" />
      </div> */}
      <RemoteCursor
        x={animatedPosition.x}
        y={animatedPosition.y}
        userName="Remote User"
        color="blue"
        isVisible={true}
      />
    </div>
  );
}

export default App;

// <div className="absolute">
//   <p>All the positions</p>
//   {mousePositions.map((pos, key) => (
//     <div
//       key={key}
//       className="fixed pointer-events-none"
//       style={{
//         left: pos.x,
//         top: pos.y,
//       }}
//     >
//       {/* <p>{pos.x}</p>
//       <p>{pos.y}</p> */}
//       <Pointer />
//     </div>
//   ))}
// </div>
