"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, ExternalLink } from "lucide-react";

const USER_ID = "842366854697189447";
const LASTFM_USER = process.env.NEXT_PUBLIC_LASTFM_USER || "iminthebibleson";
const LASTFM_API_KEY =
  process.env.NEXT_PUBLIC_LASTFM_API_KEY || "ef31cf7df2fe00d992a0a16db1377355";
const LASTFM_POLL_MS = 15000;

const tokens = {
  surface: "rgba(255,255,255,0.055)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  textPrimary: "#ECE6F0",
  textSecondary: "#9C96A5",
  lime: "#C6FF6B",
  limeDark: "#1B2A0E",
  lavender: "#CBB8FF",
  lavenderDark: "#211A33",
  trackMuted: "rgba(255,255,255,0.14)",
};

function Squircle({ children, size = 56, style = {} }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "38% 62% 70% 30% / 55% 35% 65% 45%",
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

function extractPalette(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let maxSat = -1;
        let vibrant = [198, 255, 107];
        for (let i = 0; i < data.length; i += 4) {
          const rr = data[i],
            gg = data[i + 1],
            bb = data[i + 2],
            aa = data[i + 3];
          if (aa < 125) continue;
          const max = Math.max(rr, gg, bb);
          const min = Math.min(rr, gg, bb);
          const sat = max === 0 ? 0 : (max - min) / max;
          if (sat > maxSat && max > 40) {
            maxSat = sat;
            vibrant = [rr, gg, bb];
          }
        }
        resolve(vibrant);
      } catch {
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

function buildAccent(vibrant) {
  if (!vibrant) return { a: tokens.lime, b: tokens.lavender };
  const [h] = rgbToHsl(vibrant);
  return {
    a: hslToHex(h, 0.75, 0.68),
    b: hslToHex((h + 45) % 360, 0.7, 0.72),
  };
}

function buildWavePath(periods, tileWidth, amplitude, mid) {
  let d = `M0 ${mid}`;

  for (let i = 0; i < periods; i++) {
    const x = i * tileWidth;

    d += `
      Q
      ${x + tileWidth / 2}
      ${mid + (i % 2 === 0 ? -amplitude : amplitude)}
      ${x + tileWidth}
      ${mid}
    `;
  }

  return d;
}
function WaveTrack({ percent, accent, isPlaying }) {
  const TILE = 24;
  const PERIODS = 34;
  const AMP = 4;
  const MID = 10;
  const path = buildWavePath(PERIODS, TILE, AMP, MID);
  const fullWidth = TILE * PERIODS;
  const fillPercent = percent === null ? 100 : percent;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 20,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes waveScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-${fullWidth / 4}px); }
        }
        .wave-anim { animation: waveScroll 7s linear infinite; }
      `}</style>

      <svg
        viewBox={`0 0 ${fullWidth} 20`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "200%",
          height: "100%",
        }}
        className={isPlaying ? "wave-anim" : ""}
      >
        <path
          d={path}
          fill="none"
          stroke={tokens.trackMuted}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${fillPercent}%`,
          overflow: "hidden",
          transition: percent === null ? "none" : "width 0.9s linear",
        }}
      >
        <svg
          viewBox={`0 0 ${fullWidth} 20`}
          preserveAspectRatio="none"
          style={{
            width: `${(200 * 100) / Math.max(fillPercent, 0.001)}%`,
            height: "100%",
          }}
          className={isPlaying ? "wave-anim" : ""}
        >
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accent.a} />
              <stop offset="100%" stopColor={accent.b} />
            </linearGradient>
          </defs>
          <path
            d={path}
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function buildCookiePath(size, lobes = 12, outerFrac = 0.5, innerFrac = 0.41) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * outerFrac;
  const innerR = size * innerFrac;

  const pts = [];
  for (let i = 0; i < lobes * 2; i++) {
    const angle = (i * Math.PI) / lobes;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  const fmt = (n) => n.toFixed(2);
  const total = lobes * 2;
  let d = `M ${fmt(pts[1][0])},${fmt(pts[1][1])} `;
  for (let k = 1; k <= lobes; k++) {
    const peak = pts[(2 * k) % total];
    const valley = pts[(2 * k + 1) % total];
    d += `Q ${fmt(peak[0])},${fmt(peak[1])} ${fmt(valley[0])},${fmt(
      valley[1]
    )} `;
  }
  d += "Z";

  return `path('${d}')`;
}

const COOKIE_MASK_GLOW = buildCookiePath(96);
const COOKIE_MASK_IMG = buildCookiePath(76);

async function fetchLastFmNowPlaying() {
  if (!LASTFM_API_KEY || !LASTFM_USER) return null;

  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(
        LASTFM_USER
      )}&api_key=${LASTFM_API_KEY}&format=json&limit=1`,
      {
        cache: "no-store",
      }
    );

    const json = await res.json();
    const track = json?.recenttracks?.track?.[0];

    if (!track) return null;

    const isNowPlaying = track["@attr"]?.nowplaying === "true";

    const images = track.image || [];
    const art = images[images.length - 1]?.["#text"] || "";

    return {
      source: "lastfm",
      song: track.name,
      artist: track.artist?.["#text"] || track.artist?.name || "",
      album: track.album?.["#text"] || "",
      art,
      trackUrl: track.url,
      isNowPlaying,
      hasProgress: false,
    };
  } catch (e) {
    console.error("Last.fm fetch failed:", e);
    return null;
  }
}

export default function SpotifyCard() {
  const [spotify, setSpotify] = useState(null);
  const [lastfmTrack, setLastfmTrack] = useState(null);
  const [accent, setAccent] = useState({ a: tokens.lime, b: tokens.lavender });
  const [tick, setTick] = useState(0);
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
          setSpotify(data.listening_to_spotify ? data.spotify : null);
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
    let cancelled = false;
    let intervalId = null;

    async function poll() {
      const track = await fetchLastFmNowPlaying();
      if (!cancelled) setLastfmTrack(track);
    }

    function startPolling() {
      poll();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(poll, LASTFM_POLL_MS);
    }

    function stopPolling() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === "visible") startPolling();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", poll);

    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", poll);
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const np = spotify
    ? {
        source: "spotify",
        song: spotify.song,
        artist: spotify.artist,
        album: spotify.album,
        art: spotify.album_art_url,
        trackUrl: `https://open.spotify.com/track/${spotify.track_id}`,
        hasProgress: true,
        start: spotify.timestamps?.start,
        end: spotify.timestamps?.end,
        isNowPlaying: true,
      }
    : lastfmTrack;

  const hasTrack = !!np;

  const isPlaying = np?.isNowPlaying ?? false;

  useEffect(() => {
    if (np?.art) {
      extractPalette(np.art).then((vibrant) => {
        setAccent(buildAccent(vibrant));
      });
    }
  }, [np?.art]);

  const now = Date.now();
  const start = np?.start ?? now;
  const end = np?.end ?? now;
  const duration = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), duration);
  const percent = np?.hasProgress ? (elapsed / duration) * 100 : null;

  return (
    <div
      className="card-hover rise-2"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        background: tokens.surface,
        border: `1px solid ${tokens.surfaceBorder}`,
        backdropFilter: "blur(20px)",
      }}
    >
      <style>{`
        .card-hover { transition: transform 0.25s cubic-bezier(.2,.8,.2,1), border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); }
        @keyframes riseIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: translateY(0);} }
        .rise-2 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) 0.08s both; }
        @keyframes artPulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.05); } }
        @keyframes bgDrift { 0%,100% { transform: scale(1.15) translate(0,0); } 50% { transform: scale(1.22) translate(-1.5%, 1.5%); } }
      `}</style>

      {hasTrack && np.art && (
        <>
          <div
            style={{
              position: "absolute",
              inset: -20,
              backgroundImage: `url(${np.art})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(44px) saturate(1.3)",
              transform: "scale(1.15)",
              animation: "bgDrift 14s ease-in-out infinite",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(165deg, rgba(18,16,22,0.55) 0%, rgba(18,16,22,0.86) 100%)",
              zIndex: 0,
            }}
          />
        </>
      )}

      <div className="p-6" style={{ position: "relative", zIndex: 1 }}>
        {!hasTrack ? (
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="display-font text-2xl"
                style={{ fontWeight: 600, color: tokens.textPrimary }}
              >
                Nothing Playing
              </h2>
              <p
                className="mt-2 text-sm"
                style={{ color: tokens.textSecondary }}
              >
                Check back later
              </p>
            </div>

            <Squircle size={60} style={{ background: tokens.lavenderDark }}>
              <AudioLines size={26} color={tokens.lime} />
            </Squircle>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4">
              <div
                style={{
                  position: "relative",
                  width: 76,
                  height: 76,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: -10,
                    clipPath: COOKIE_MASK_GLOW,
                    background: `linear-gradient(135deg, ${accent.a}, ${accent.b})`,
                    filter: "blur(16px)",
                    animation: "artPulse 7s ease-in-out infinite",
                  }}
                />
                <img
                  src={np.art}
                  alt={np.album}
                  style={{
                    position: "relative",
                    width: 76,
                    height: 76,
                    objectFit: "cover",
                    clipPath: COOKIE_MASK_IMG,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  className="display-font text-xl truncate"
                  style={{ fontWeight: 600, color: tokens.textPrimary }}
                  title={np.song}
                >
                  {np.song}
                </h2>
                <p
                  className="text-sm truncate mt-0.5"
                  style={{ color: tokens.textSecondary }}
                  title={np.artist}
                >
                  {np.artist}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: tokens.textSecondary, opacity: 0.7 }}
                  title={np.album}
                >
                  {np.album}
                </p>
              </div>

              <a
                href={np.trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="m3-link-btn"
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: tokens.surface,
                  color: tokens.lime,
                  transition: "transform 0.18s cubic-bezier(.2,.8,.2,1)",
                }}
              >
                <ExternalLink size={17} />
              </a>
            </div>

            <div className="mt-5">
              <WaveTrack
                percent={percent}
                accent={accent}
                isPlaying={isPlaying}
              />
              <div className="flex justify-between mt-2">
                <span
                  className="text-xs"
                  style={{ color: tokens.textSecondary }}
                >
                  {np.hasProgress
                    ? formatTime(elapsed)
                    : np.isNowPlaying
                    ? "Scrobbling"
                    : "Last Played"}
                </span>
                <span
                  className="text-xs"
                  style={{ color: tokens.textSecondary }}
                >
                  {np.hasProgress
                    ? formatTime(duration)
                    : np.source === "lastfm"
                    ? "Last.fm"
                    : "Spotify"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
