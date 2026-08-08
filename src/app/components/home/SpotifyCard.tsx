"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, ExternalLink, Music2 } from "lucide-react";

const LASTFM_USER = process.env.NEXT_PUBLIC_LASTFM_USER || "iminthebibleson";
const LASTFM_API_KEY =
  process.env.NEXT_PUBLIC_LASTFM_API_KEY || "ef31cf7df2fe00d992a0a16db1377355";
const LASTFM_POLL_MS = 5000;

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

function buildSquigglePath(
  width,
  height,
  phase,
  amplitude = 2.5,
  frequency = 7
) {
  if (!width || width <= 0) return "";
  let d = "";
  for (let x = 0; x <= width; x += 2) {
    const y =
      height / 2 +
      Math.sin((x / width) * frequency * Math.PI * 2 + phase) * amplitude;
    d += `${x === 0 ? "M" : "L"} ${x} ${y} `;
  }
  return d;
}

function WaveTrack({
  percent = null,
  accent,
  isPlaying = false,
  idle = false,
}) {
  const containerRef = useRef(null);
  const rafRef = useRef();
  const [width, setWidth] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const shouldAnimate = idle || isPlaying;
    if (!shouldAnimate) return;

    const animate = () => {
      setPhase((p) => p + (idle ? 0.015 : 0.03));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, idle]);

  const height = 20;
  const frequency = idle ? 1 : 7;
  const amplitude = idle ? 3 : 2.5;
  const path = buildSquigglePath(width, height, phase, amplitude, frequency);
  const fillPercent = percent === null ? 100 : percent;

  if (idle) {
    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height,
          overflow: "visible",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <path
            d={path}
            fill="none"
            stroke={tokens.trackMuted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <path
          d={path}
          fill="none"
          stroke={tokens.trackMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
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
            strokeLinejoin="round"
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

function formatRelativeTime(timestampMs) {
  if (!timestampMs) return "";
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function buildCookiePath(size, lobes = 12, outerFrac = 0.5, innerFrac = 0.4) {
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

    const lastPlayedAt = track.date?.uts
      ? parseInt(track.date.uts, 10) * 1000
      : null;

    return {
      source: "lastfm",
      song: track.name,
      artist: track.artist?.["#text"] || track.artist?.name || "",
      album: track.album?.["#text"] || "",
      art,
      trackUrl: track.url,
      isNowPlaying,
      hasProgress: false,
      lastPlayedAt,
    };
  } catch (e) {
    console.error("Last.fm fetch failed:", e);
    return null;
  }
}

export default function SpotifyCard() {
  const [lastfmTrack, setLastfmTrack] = useState(null);
  const [displayTrack, setDisplayTrack] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [accent, setAccent] = useState({ a: tokens.lime, b: tokens.lavender });
  const [tick, setTick] = useState(0);
  const [artError, setArtError] = useState(false);
  const prevTrackIdRef = useRef("INIT");
  const swapTimeoutRef = useRef(null);

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
  useEffect(() => {
    const t = lastfmTrack;
    const currentId = t ? `${t.song}::${t.artist}::${t.album}` : "EMPTY";

    if (prevTrackIdRef.current === "INIT") {
      prevTrackIdRef.current = currentId;
      setDisplayTrack(t);
      return;
    }

    if (currentId !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentId;
      setIsSwapping(true);
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
      swapTimeoutRef.current = setTimeout(() => {
        setDisplayTrack(t);
        setIsSwapping(false);
      }, 260);
    } else {
      setDisplayTrack(t);
    }
  }, [lastfmTrack]);

  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current) clearTimeout(swapTimeoutRef.current);
    };
  }, []);

  const np = displayTrack;
  const hasTrack = !!np;
  const isPlaying = np?.isNowPlaying ?? false;

  useEffect(() => {
    setArtError(false);
  }, [np?.art]);

  const hasUsableArt = !!np?.art && !artError;

  useEffect(() => {
    if (hasUsableArt) {
      extractPalette(np.art).then((vibrant) => {
        setAccent(buildAccent(vibrant));
      });
    } else {
      setAccent({ a: tokens.lime, b: tokens.lavender });
    }
  }, [np?.art, hasUsableArt]);

  const now = Date.now();
  const start = np?.start ?? now;
  const end = np?.end ?? now;
  const duration = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), duration);
  const percent = np?.hasProgress ? (elapsed / duration) * 100 : null;

  const lastPlayedLabel =
    !np?.isNowPlaying && np?.lastPlayedAt
      ? `Last played - ${formatRelativeTime(np.lastPlayedAt)}`
      : "Listening now";

  const fadeStyle = {
    opacity: isSwapping ? 0 : 1,
    transform: isSwapping
      ? "translateY(6px) scale(0.99)"
      : "translateY(0) scale(1)",
    transition:
      "opacity 0.28s cubic-bezier(.2,.8,.2,1), transform 0.28s cubic-bezier(.2,.8,.2,1)",
  };

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

        @keyframes bgDrift {
          0%   { transform: scale(1.2) translate(0%, 0%) rotate(0deg); filter: blur(46px) saturate(1.5) hue-rotate(0deg); }
          25%  { transform: scale(1.42) translate(-6%, 4%) rotate(4deg); filter: blur(52px) saturate(1.7) hue-rotate(14deg); }
          50%  { transform: scale(1.5) translate(5%, -6%) rotate(-3deg); filter: blur(56px) saturate(1.8) hue-rotate(-12deg); }
          75%  { transform: scale(1.35) translate(-4%, -4%) rotate(2deg); filter: blur(50px) saturate(1.65) hue-rotate(8deg); }
          100% { transform: scale(1.2) translate(0%, 0%) rotate(0deg); filter: blur(46px) saturate(1.5) hue-rotate(0deg); }
        }

        @keyframes blobFloatA {
          0%   { transform: translate(-15%, -10%) scale(1); }
          30%  { transform: translate(35%, 5%) scale(1.4); }
          55%  { transform: translate(15%, 45%) scale(0.85); }
          80%  { transform: translate(-25%, 20%) scale(1.2); }
          100% { transform: translate(-15%, -10%) scale(1); }
        }
        @keyframes blobFloatB {
          0%   { transform: translate(25%, 30%) scale(1.15); }
          35%  { transform: translate(-25%, -15%) scale(0.8); }
          65%  { transform: translate(10%, -35%) scale(1.35); }
          100% { transform: translate(25%, 30%) scale(1.15); }
        }
      `}</style>

      <div style={fadeStyle}>
        {hasTrack && hasUsableArt && (
          <>
            <div
              style={{
                position: "absolute",
                inset: -20,
                backgroundImage: `url(${np.art})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(46px) saturate(1.5)",
                transform: "scale(1.2)",
                animation: "bgDrift 11s ease-in-out infinite",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "-30%",
                width: "70%",
                height: "70%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${accent.a} 0%, transparent 70%)`,
                filter: "blur(50px)",
                opacity: 0.65,
                mixBlendMode: "screen",
                animation: "blobFloatA 9s ease-in-out infinite",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-30%",
                right: "-20%",
                width: "65%",
                height: "65%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${accent.b} 0%, transparent 70%)`,
                filter: "blur(50px)",
                opacity: 0.6,
                mixBlendMode: "screen",
                animation: "blobFloatB 12s ease-in-out infinite",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(165deg, rgba(18,16,22,0.5) 0%, rgba(18,16,22,0.82) 100%)",
                zIndex: 0,
              }}
            />
          </>
        )}

        <div className="p-6" style={{ position: "relative", zIndex: 1 }}>
          {!hasTrack ? (
            <div>
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

              <div className="mt-6">
                <WaveTrack
                  idle
                  accent={{ a: tokens.lime, b: tokens.lavender }}
                />
              </div>
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
                  {hasUsableArt ? (
                    <>
                      <div
                        className="animate-spin"
                        style={{
                          position: "absolute",
                          inset: -10,
                          clipPath: COOKIE_MASK_GLOW,
                          background: `linear-gradient(135deg, ${accent.a}, ${accent.b})`,
                          filter: "blur(16px)",
                          animationDuration: "15s",
                        }}
                      />
                      <img
                        src={np.art}
                        alt={np.album}
                        onError={() => setArtError(true)}
                        style={{
                          position: "relative",
                          width: 76,
                          height: 76,
                          objectFit: "cover",
                          clipPath: COOKIE_MASK_IMG,
                          boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                        }}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        clipPath: COOKIE_MASK_IMG,
                        background: `linear-gradient(135deg, ${tokens.lavenderDark}, ${tokens.limeDark})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Music2 size={28} color={tokens.lime} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="tooltip tooltip-bottom" data-tip={np.song}>
                    <h2
                      className="display-font text-xl truncate"
                      style={{ fontWeight: 600, color: tokens.textPrimary }}
                      title={np.song}
                    >
                      {np.song}
                    </h2>
                  </div>
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
                  className="m3-link-btn mt-7"
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: tokens.surface,
                    color: `${accent.a}`,
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
                    className="inline-flex items-center gap-0.5 text-xs"
                    style={{ color: tokens.textSecondary }}
                  >
                    <img
                      src={
                        np.isNowPlaying ? "/vibe-car.png" : "/epping-car.gif"
                      }
                      alt=""
                      className={`w-8 h-auto drop-shadow-xl/50 ${
                        np.isNowPlaying ? "animate-bounce" : "animate-hammock"
                      }`}
                    />
                    {lastPlayedLabel}
                  </span>
                  <div className="tooltip" data-tip="Last.fm">
                    <span
                      className="inline-flex items-center gap-1 text-xs"
                      style={{ color: tokens.textSecondary }}
                    >
                      <svg
                        className="w-auto h-4.5 fill-current"
                        role="img"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Last.fm</title>
                        <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.285 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.63-3.931l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.869.907 1.869 1.704 0 1.017-.99 1.43-2.86 1.43-2.776 0-3.93-1.457-4.59-3.464l-.907-2.75c-1.155-3.573-2.997-4.893-6.653-4.893C2.144 5.333 0 7.89 0 12.233c0 4.18 2.144 6.434 5.993 6.434 3.106 0 4.591-1.457 4.591-1.457z" />
                      </svg>
                      {np.hasProgress ? formatTime(duration) : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
