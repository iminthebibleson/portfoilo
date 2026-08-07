"use client";

import { useEffect, useRef, useState } from "react";

const USER_ID = "842366854697189447";

const tokens = {
  surface: "rgba(255,255,255,0.055)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  textPrimary: "#ECE6F0",
  textSecondary: "#9C96A5",
  fallbackA: "#C6FF6B",
  fallbackB: "#CBB8FF",
};

const statusLabel = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
};

const statusColor = {
  online: "#C6FF6B",
  idle: "#FFD166",
  dnd: "#FF6B6B",
  offline: "#6E6878",
};

// pull a seed color from the avatar, then derive a Material-You-style
// two-tone palette from it (same idea Android uses on your wallpaper)
function extractPalette(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        let maxSat = -1;
        let vibrant = [0, 0, 0];

        for (let i = 0; i < data.length; i += 4) {
          const rr = data[i],
            gg = data[i + 1],
            bb = data[i + 2],
            aa = data[i + 3];
          if (aa < 125) continue;
          r += rr;
          g += gg;
          b += bb;
          count++;

          const max = Math.max(rr, gg, bb);
          const min = Math.min(rr, gg, bb);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat > maxSat && max > 40) {
            maxSat = sat;
            vibrant = [rr, gg, bb];
          }
        }

        if (count === 0) return resolve(null);

        const avg = [r / count, g / count, b / count];
        resolve({ avg, vibrant });
      } catch (e) {
        console.error("Palette extraction failed:", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imgUrl;
  });
}

function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToHex(h, s, l) {
  h /= 360;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildDynamicPalette(pixels) {
  if (!pixels) return { a: tokens.fallbackA, b: tokens.fallbackB };
  const seed =
    pixels.vibrant[0] + pixels.vibrant[1] + pixels.vibrant[2] > 0
      ? pixels.vibrant
      : pixels.avg;
  const [h] = rgbToHsl(seed);
  const colorA = hslToHex(h, 0.75, 0.68);
  const colorB = hslToHex((h + 45) % 360, 0.7, 0.72);
  return { a: colorA, b: colorB };
}

export default function Hero() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("offline");
  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState({
    a: tokens.fallbackA,
    b: tokens.fallbackB,
  });
  const wsRef = useRef(null);

  useEffect(() => {
    let heartbeatInterval;
    let reconnectTimeout;
    let closedByUs = false;

    function connect() {
      const ws = new WebSocket("wss://api.lanyard.rest/socket");
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.op === 1) {
          heartbeatInterval = setInterval(() => {
            ws.send(JSON.stringify({ op: 3 }));
          }, msg.d.heartbeat_interval);

          ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: USER_ID } }));
        }

        if (
          msg.op === 0 &&
          (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")
        ) {
          const data = msg.d;
          setStatus(data.discord_status || "offline");
          setUsername(
            data.discord_user.global_name || data.discord_user.username
          );
          setAvatarUrl(
            `https://cdn.discordapp.com/avatars/${USER_ID}/${data.discord_user.avatar}.png?size=512`
          );
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        if (!closedByUs) reconnectTimeout = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closedByUs = true;
      clearInterval(heartbeatInterval);
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (avatarUrl) {
      const t = setTimeout(() => setMounted(true), 30);
      extractPalette(avatarUrl).then((pixels) => {
        setPalette(buildDynamicPalette(pixels));
      });
      return () => clearTimeout(t);
    }
  }, [avatarUrl]);

  return (
    <div
      className="flex flex-col items-center gap-5 py-10"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .display-font { font-family: 'Space Grotesk', system-ui, sans-serif; }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 0.9;  transform: scale(1.06); }
        }
        @keyframes skeletonShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .rise-in { animation: riseIn 0.55s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      {!avatarUrl ? (
        <>
          <div style={{ position: "relative", width: 240, height: 240 }}>
            <div
              style={{
                position: "absolute",
                inset: -10,
                borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%",
                background: `conic-gradient(from 0deg, ${tokens.fallbackA}, ${tokens.fallbackB}, ${tokens.fallbackA})`,
                opacity: 0.5,
                filter: "blur(18px)",
                animation: "ringSpin 6s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%",
                backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 75%)`,
                backgroundSize: "200% 100%",
                animation: "skeletonShimmer 1.6s ease-in-out infinite",
                border: `1px solid ${tokens.surfaceBorder}`,
              }}
            />
          </div>

          <div
            className="px-4 py-1.5"
            style={{
              borderRadius: 9999,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              color: tokens.textSecondary,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Hang on tight!
          </div>
        </>
      ) : (
        <div
          className="rise-in flex flex-col items-center gap-5"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          <div style={{ position: "relative", width: 240, height: 240 }}>
            {/* ambient glow, colored from the avatar itself */}
            <div
              style={{
                position: "absolute",
                inset: -18,
                borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%",
                background: `linear-gradient(135deg, ${palette.a}, ${palette.b})`,
                opacity: 0.5,
                filter: "blur(26px)",
                animation: "pulseGlow 4s ease-in-out infinite",
                transition: "background 0.6s ease",
              }}
            />

            <img
              src={avatarUrl}
              className="aura aura-dual aura-md"
              alt="Discord Avatar"
              style={{
                color: `${palette.a}`,
                position: "relative",
                width: 240,
                height: 240,
                objectFit: "cover",
                borderRadius: "38% 62% 63% 37% / 41% 44% 56% 59%",
                border: `1px solid ${tokens.surfaceBorder}`,
                boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              }}
            />
          </div>

          {username && (
            <div className="flex flex-col items-center gap-2">
              <h2
                className="display-font text-2xl"
                style={{
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: tokens.textPrimary,
                }}
              >
                {username}
              </h2>

              <div
                className="px-3 py-1.5"
                style={{
                  borderRadius: 9999,
                  background: tokens.surface,
                  border: `1px solid ${tokens.surfaceBorder}`,
                  color: statusColor[status] || statusColor.offline,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "color 0.4s ease",
                }}
              >
                {statusLabel[status] || "Offline"}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
