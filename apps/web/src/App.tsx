import "./index.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { RemoteCursor } from "./components/ui/RemoteCursor";

interface websocketType extends WebSocket {
  connectionID?: string;
}

type mousePositionType = {
  x: number;
  y: number;
};

const COLORS = ["blue", "red", "green", "purple", "pink", "yellow"] as const;

type CursorState = {
  userId: string;

  color: string;

  animatedPosition: {
    x: number;
    y: number;
  };

  targetPosition: {
    x: number;
    y: number;
  };

  isVisible: boolean;
};

export function App() {
  const [cursors, setCursors] = useState<Record<string, CursorState>>({});
  const cursorsRef = useRef<Record<string, CursorState>>({});
  const [msg, setMsg] = useState<string>("");
  const [msgInput, setMsgInput] = useState<string>("");
  const webSocket = useRef<websocketType | null>(null);
  const positionQueueRef = useRef<mousePositionType[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  const getRandomColor = () => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  // const [mousePositions, setMousePositions] = useState<mousePositionType[]>([]);

  useEffect(() => {
    const animate = () => {
      let changed = false;

      const nextCursors = {
        ...cursorsRef.current,
      };

      Object.keys(nextCursors).forEach((userId) => {
        const cursor = nextCursors[userId]!;

        const dx = cursor.targetPosition.x - cursor.animatedPosition.x;

        const dy = cursor.targetPosition.y - cursor.animatedPosition.y;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          changed = true;

          // cursor.animatedPosition = {
          //   x: cursor.animatedPosition.x + dx * 0.15,
          //   y: cursor.animatedPosition.y + dy * 0.15,
          // };
          nextCursors[userId] = {
            ...cursor,
            animatedPosition: {
              x: cursor.animatedPosition.x + dx * 0.15,
              y: cursor.animatedPosition.y + dy * 0.15,
            },
          };
        }
      });

      if (changed) {
        cursorsRef.current = nextCursors;
        setCursors(nextCursors);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
    });

    wss.addEventListener("close", (e) => {
      wss.send(JSON.stringify({ type: "connection", message: "Close" }));
    });

    wss.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "mousePosition") {
        setCursors((prev) => {
          const existing = prev[msg.userId];

          const next = {
            ...prev,

            [msg.userId]: {
              userId: msg.userId,

              color: existing?.color ?? getRandomColor(),

              animatedPosition: existing?.animatedPosition ?? msg.mousePosition,

              targetPosition: msg.mousePosition,

              isVisible: true,
            },
          };

          cursorsRef.current = next;

          return next;
        });

        // animateNextPosition();
      } else if (msg.type === "chat") {
        setMsg(msg.message);
      } else if (msg.type === "userDisconnected") {
        setCursors((prev) => {
          const next = { ...prev };

          delete next[msg.userId];

          cursorsRef.current = next;

          return next;
        });
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
      {/* <RemoteCursor
        x={animatedPosition.x}
        y={animatedPosition.y}
        userName="Remote User"
        color="blue"
        isVisible={isCursorVisible}
      /> */}

      {Object.entries(cursors).map(([userId, cursor]) => (
        <RemoteCursor
          key={userId}
          x={cursor.animatedPosition.x}
          y={cursor.animatedPosition.y}
          userName={userId}
          isVisible={cursor.isVisible}
          color={cursor.color}
        />
      ))}
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
