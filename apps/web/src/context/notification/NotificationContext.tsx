import type React from "react";
import { createContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { RetroStartedEvent } from "shared/model/notification/notification.events";
import { toast } from "sonner";
import { useUser } from "@/context/user/UserContext.hook";

export const NotificationContext = createContext<null>(null);

const isRetroStartedEvent = (value: unknown): value is RetroStartedEvent => {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;

  return (
    typeof event.retroId === "string" &&
    typeof event.teamId === "string" &&
    typeof event.teamName === "string" &&
    typeof event.startedAt === "string"
  );
};

const waitForRetry = (delay: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, delay);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });

interface NotificationContextProviderProps {
  children: React.ReactNode;
}

export const NotificationContextProvider: React.FC<
  NotificationContextProviderProps
> = ({ children }) => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = window.localStorage.getItem("Bearer");
    if (!user || !token) return;

    const controller = new AbortController();
    let retryDelay = 1_000;

    const handleEvent = (eventType: string, data: string) => {
      if (eventType !== "retro-started") return;

      try {
        const event: unknown = JSON.parse(data);
        if (!isRetroStartedEvent(event)) return;

        const retroPath = `/retro/${event.retroId}`;
        if (
          location.pathname === retroPath ||
          location.pathname.startsWith(`${retroPath}/`)
        ) {
          return;
        }

        toast.info(`Rozpoczęto retrospektywę zespołu ${event.teamName}`, {
          id: `retro-started-${event.retroId}`,
          action: {
            label: "Dołącz",
            onClick: () => navigate(retroPath),
          },
        });
      } catch {
        // Ignore malformed or unsupported server events.
      }
    };

    const consumeStream = async (response: Response) => {
      if (!response.body) throw new Error("SSE response has no body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        buffer += decoder
          .decode(value, { stream: !done })
          .replaceAll("\r\n", "\n");

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          let eventType = "message";
          const data: string[] = [];
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
          }
          if (data.length > 0) handleEvent(eventType, data.join("\n"));
          boundary = buffer.indexOf("\n\n");
        }

        if (done) return;
      }
    };

    const connect = async () => {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(
            `${process.env.RETRO_WEB_API_URL}notifications/events`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            },
          );

          if (response.status === 401) return;
          if (!response.ok) throw new Error(`SSE failed: ${response.status}`);

          retryDelay = 1_000;
          await consumeStream(response);
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error("Notification stream disconnected", error);
        }

        await waitForRetry(retryDelay, controller.signal);
        retryDelay = Math.min(retryDelay * 2, 8_000);
      }
    };

    void connect();
    return () => controller.abort();
  }, [location.pathname, navigate, user]);

  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  );
};
