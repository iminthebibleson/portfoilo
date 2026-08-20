"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, Music2, Tv, Radio, Circle } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// SETUP
// Set your Discord user ID (right-click your profile in Discord
// with Developer Mode on → "Copy User ID"). Defaults to the ID
// already used elsewhere on the site.
//
//   NEXT_PUBLIC_DISCORD_USER_ID=842366854697189447
//
// Lanyard needs you to be a member of its Discord server for your
// presence to be tracked: https://discord.gg/lanyard
// ─────────────────────────────────────────────────────────────

const DISCORD_USER_ID = process.env.NEXT_PUBLIC_DISCORD_USER_ID ?? "842366854697189447";
const LANYARD_WS_URL = "wss://api.lanyard.rest/socket";

// How often we recompute the elapsed-time display locally. Lanyard
// pushes updates over the socket itself (no polling needed for the
// data), this just keeps the "12:34 elapsed" counter ticking smoothly.
const ELAPSED_TICK_MS = 300;

const tokens = {
  bg: "#121016",
  surface: "rgba(255,255,255,0.055)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  textPrimary: "#ECE6F0",
  textSecondary: "#9C96A5",
  lime: "#C6FF6B",
  limeDark: "#1B2A0E",
  lavender: "#CBB8FF",
  lavenderDark: "#211A33",
};

function Squircle({
  children,
  size = 56,
  style = {},
}: {
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "30% 70% 62% 38% / 44% 33% 67% 56%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Activity type numbers from Discord's gateway
const ACTIVITY_TYPE = {
  PLAYING: 0,
  STREAMING: 1,
  LISTENING: 2,
  WATCHING: 3,
  CUSTOM: 4,
  COMPETING: 5,
};

type LanyardActivity = {
  id: string;
  name: string;
  type: number;
  state?: string;
  details?: string;
  application_id?: string;
  timestamps?: { start?: number; end?: number };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  emoji?: { name: string; id?: string; animated?: boolean };
};

type LanyardData = {
  discord_status: "online" | "idle" | "dnd" | "offline";
  discord_user: { id: string; username: string; avatar: string | null };
  activities: LanyardActivity[];
  listening_to_spotify?: boolean;
  spotify?: {
    song: string;
    artist: string;
    album: string;
    album_art_url: string;
    timestamps: { start: number; end: number };
  } | null;
};

function resolveImageUrl(activity: LanyardActivity | null): string {
  if (!activity?.assets?.large_image) return "";
  const img = activity.assets.large_image;

  if (img.startsWith("mp:external/")) {
    return `https://media.discordapp.net/${img.replace("mp:", "")}`;
  }
  if (img.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${img.replace("spotify:", "")}`;
  }
  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`;
  }
  return "";
}

function formatElapsed(startMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - startMs);
  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function activityIcon(type: number) {
  switch (type) {
    case ACTIVITY_TYPE.LISTENING:
      return Music2;
    case ACTIVITY_TYPE.WATCHING:
      return Tv;
    case ACTIVITY_TYPE.STREAMING:
      return Radio;
    default:
      return Gamepad2;
  }
}

function activityLabel(type: number): string {
  switch (type) {
    case ACTIVITY_TYPE.LISTENING:
      return "Listening to";
    case ACTIVITY_TYPE.WATCHING:
      return "Watching";
    case ACTIVITY_TYPE.STREAMING:
      return "Streaming";
    case ACTIVITY_TYPE.COMPETING:
      return "Competing in";
    default:
      return "Playing";
  }
}

export default function DiscordActivityWidget() {
  const [data, setData] = useState<LanyardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);

  // Local 300ms tick just to keep elapsed-time text smooth
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ELAPSED_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;

      const ws = new WebSocket(LANYARD_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        switch (msg.op) {
          case 1: {
            // Hello — start heartbeating, then subscribe
            const interval = msg.d?.heartbeat_interval ?? 30000;
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            heartbeatRef.current = setInterval(() => {
              ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ op: 3 }));
            }, interval);

            ws.send(
              JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_USER_ID },
              })
            );
            break;
          }
          case 0: {
            // Event — INIT_STATE or PRESENCE_UPDATE
            if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") {
              if (!cancelled) {
                setData(msg.d);
                setConnected(true);
              }
            }
            break;
          }
          default:
            break;
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);

        // Reconnect with gentle backoff, capped at 10s
        const delay = Math.min(10000, 1000 * 2 ** reconnectAttempt.current);
        reconnectAttempt.current += 1;
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  const customStatus = data?.activities?.find((a) => a.type === ACTIVITY_TYPE.CUSTOM);
  // Ignoring "Listening to" activities (Spotify included) entirely —
  // only surface Playing / Watching / Streaming / Competing.
  const primaryActivity =
    data?.activities?.find(
      (a) => a.type !== ACTIVITY_TYPE.CUSTOM && a.type !== ACTIVITY_TYPE.LISTENING
    ) ?? null;

  const displayImage = resolveImageUrl(primaryActivity);

  const Icon = primaryActivity ? activityIcon(primaryActivity.type) : Gamepad2;

  const startTs = primaryActivity?.timestamps?.start;

  return (
    <div
      className="p-6 card-hover rise-2 relative overflow-hidden"
      style={{
        borderRadius: 28,
        background: tokens.surface,
        border: `1px solid ${tokens.surfaceBorder}`,
        backdropFilter: "blur(20px)",
      }}
    >
      <style>{`
        @keyframes activityBgFadeIn {
          from { opacity: 0; transform: scale(1.08); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes activityBgBreathe {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .activity-bg {
          animation: activityBgFadeIn 0.7s cubic-bezier(.2,.8,.2,1) both,
                     activityBgBreathe 10s ease-in-out infinite 0.7s;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .live-dot { animation: livePulse 1.4s ease-in-out infinite; }
      `}</style>

      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <h2 className="display-font text-2xl" style={{ fontWeight: 600 }}>
            Doing now
          </h2>

        </div>
      </div>

      {primaryActivity ? (
        <div
          className="relative flex items-center gap-4 p-4 overflow-hidden"
          style={{
            borderRadius: 20,
            border: `1px solid ${tokens.surfaceBorder}`,
          }}
        >
          <div
            key={displayImage || primaryActivity.name}
            className="activity-bg absolute inset-0"
            style={{
              backgroundImage: displayImage
                ? `linear-gradient(135deg, rgba(33,26,51,0.82) 0%, rgba(27,42,14,0.82) 120%), url(${displayImage})`
                : `linear-gradient(135deg, ${tokens.lavenderDark} 0%, ${tokens.limeDark} 120%)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(18px) saturate(1.2)",
              transform: "scale(1.15)",
            }}
          />

          <div className="relative z-10 flex items-center gap-4 w-full">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImage}
                alt={primaryActivity.name}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  objectFit: "cover",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                }}
              />
            ) : (
              <Squircle size={56} style={{ background: tokens.limeDark }}>
                <Icon size={24} color={tokens.lavender} />
              </Squircle>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: tokens.lavender }}>
                <Icon size={13} />
                {activityLabel(primaryActivity.type)}
              </div>
              <div className="font-medium truncate" style={{ color: tokens.textPrimary }}>
                {primaryActivity.details || primaryActivity.name}
              </div>
              <div className="text-sm truncate" style={{ color: tokens.textSecondary }}>
                {primaryActivity.state || primaryActivity.assets?.large_text || ""}
              </div>
            </div>

            {startTs && (
              <div
                className="text-xs flex-shrink-0 px-2.5 py-1"
                style={{
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.28)",
                  color: tokens.textPrimary,
                }}
              >
                {formatElapsed(startTs, now)}
              </div>
            )}
          </div>
        </div>
      ) : customStatus ? (
        <div
          className="flex items-center gap-3 p-4"
          style={{
            borderRadius: 20,
            background: tokens.surface,
            border: `1px solid ${tokens.surfaceBorder}`,
          }}
        >
          {customStatus.emoji?.id && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated ? "gif" : "png"
                }`}
              alt=""
              style={{ width: 24, height: 24 }}
            />
          )}
          <span style={{ color: tokens.textPrimary }}>{customStatus.state}</span>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 p-4"

        >
          <span className="text-sm" style={{ color: tokens.textSecondary }}>
            {connected ? "Not doing much right now check later maybe." : "Connecting to Lanyard..."}
          </span>
        </div>
      )}
    </div>
  );
}