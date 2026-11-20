"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  sourceColorFromImage,
  themeFromSourceColor,
  hexFromArgb,
} from "@material/material-color-utilities";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { Loading } from "@/components/expressive/loading";
import NextImage from "next/image";
import { LinearProgress } from "@/components/expressive/progress";
import { RichTooltip, Tooltip, TooltipProvider } from "@/components/expressive/tooltip";

const DISCORD_ID = "842366854697189447";
const APP_NAME = "Metrolisting";
const ARTWORK_API = "https://artwork.m8tec.top/api/v1/artwork/search";

type Activity = {
  name: string;
  details?: string;
  state?: string;
  url?: string;
  assets?: { large_image?: string; large_text?: string };
  timestamps?: { start?: number; end?: number };
};
type LanyardData = { activities: Activity[] };

/* ============ Lanyard: websocket + REST resync when the tab wakes up ============ */
function useLanyard(id: string) {
  const [data, setData] = useState<LanyardData | null>(null);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const rest = () =>
      fetch(`https://api.lanyard.rest/v1/users/${id}`)
        .then((r) => r.json())
        .then((j) => !closed && j.success && setData(j.data))
        .catch(() => { });

    const connect = () => {
      ws = new WebSocket("wss://api.lanyard.rest/socket");
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.op === 1) {
          ws!.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }));
          heartbeat = setInterval(
            () => ws?.readyState === 1 && ws.send(JSON.stringify({ op: 3 })),
            msg.d.heartbeat_interval,
          );
        } else if (msg.op === 0) setData(msg.d);
      };
      ws.onclose = () => {
        clearInterval(heartbeat);
        if (!closed) retry = setTimeout(connect, 2000);
      };
    };

    // browsers throttle/kill background sockets: resync when the tab is visible again
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      rest();
      if (!ws || ws.readyState > 1) connect();
    };

    rest();
    connect();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(retry);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      ws?.close();
    };
  }, [id]);

  return data;
}

function resolveArt(raw?: string) {
  if (!raw) return null;
  if (raw.startsWith("mp:external/"))
    return `https://media.discordapp.net/external/${raw.slice("mp:external/".length)}`;
  return raw;
}

/* ============ Material palette from the album art ============ */
type Palette = {
  container: string;
  onContainer: string;
  primary: string;
  onPrimary: string;
  secondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
};

const FALLBACK_DARK: Palette = {
  container: "#2b2930",
  onContainer: "#e6e0e9",
  primary: "#d0bcff",
  onPrimary: "#381e72",
  secondaryContainer: "#4a4458",
  tertiary: "#efb8c8",
  tertiaryContainer: "#633b48",
};

const FALLBACK_LIGHT: Palette = {
  container: "#f3edf7",
  onContainer: "#1d1b20",
  primary: "#6750a4",
  onPrimary: "#ffffff",
  secondaryContainer: "#e8def8",
  tertiary: "#7d5260",
  tertiaryContainer: "#ffd8e4",
};

// the seed colour is read from the cover once, so flipping light/dark never reloads the image
function useSourceColor(src: string | null) {
  const [source, setSource] = useState<number | null>(null);

  useEffect(() => {
    if (!src) {
      setSource(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      sourceColorFromImage(img)
        .then((argb) => !cancelled && setSource(argb))
        .catch(() => !cancelled && setSource(null));
    };
    img.onerror = () => !cancelled && setSource(null);
    return () => {
      cancelled = true;
    };
  }, [src]);

  return source;
}

function useAlbumPalette(src: string | null, dark: boolean): Palette {
  const source = useSourceColor(src);

  return useMemo(() => {
    if (source === null) return dark ? FALLBACK_DARK : FALLBACK_LIGHT;
    const s = themeFromSourceColor(source).schemes[dark ? "dark" : "light"];
    const h = hexFromArgb;
    return {
      container: h(s.primaryContainer),
      onContainer: h(s.onPrimaryContainer),
      primary: h(s.primary),
      onPrimary: h(s.onPrimary),
      secondaryContainer: h(s.secondaryContainer),
      tertiary: h(s.tertiary),
      tertiaryContainer: h(s.tertiaryContainer),
    };
  }, [source, dark]);
}

/* ============ follow the site theme (light / dark) ============ */
function readIsDark() {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  const scheme = getComputedStyle(root).colorScheme;
  if (scheme === "dark") return true;
  if (scheme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  // data-theme / class / style on <html> or <body> (daisyUI, next-themes, palette pickers)
  for (const el of [document.documentElement, document.body])
    observer.observe(el, { attributes: true });
  media.addEventListener("change", onChange);
  // daisyUI theme-controller inputs switch themes with :has(), no attribute changes
  document.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
    document.removeEventListener("change", onChange);
  };
}

function useIsDark() {
  return useSyncExternalStore(subscribeToTheme, readIsDark, () => true);
}

/* ============ animated cover (calls the m8tec API straight from the browser) ============ */
// Walk the JSON and collect every string that looks like an HLS playlist.
function collectHls(
  v: unknown,
  path = "",
  out: { path: string; url: string }[] = [],
) {
  if (typeof v === "string") {
    if (v.includes(".m3u8")) out.push({ path: path.toLowerCase(), url: v });
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => collectHls(x, `${path}[${i}]`, out));
  } else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) collectHls(x, `${path}.${k}`, out);
  }
  return out;
}

const artCache = new Map<string, string | null>(); // remember lookups per song

function useAnimatedArt(artist?: string, album?: string, title?: string) {
  const [hls, setHls] = useState<string | null>(null);

  useEffect(() => {
    setHls(null);
    if (!artist || !album) return;

    const key = `${artist}|${album}|${title ?? ""}`;
    if (artCache.has(key)) return setHls(artCache.get(key) ?? null);

    const ctrl = new AbortController();
    const qs = new URLSearchParams({
      artist,
      album,
      ...(title ? { title } : {}),
    });

    fetch(`${ARTWORK_API}?${qs}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const found = json ? collectHls(json) : [];
        // prefer the square (1:1) variant, avoid "tall"
        const pick =
          found.find((f) => /square|1x1/.test(f.path)) ??
          found.find((f) => !/tall|3x4/.test(f.path)) ??
          found[0];
        const url = pick?.url ?? null;
        artCache.set(key, url);
        setHls(url);
      })
      .catch(() => { }); // blocked by CORS / offline: just keep the static cover

    return () => ctrl.abort();
  }, [artist, album, title]);

  return hls;
}

function HlsVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let cancelled = false;
    let hls: { destroy(): void } | undefined;

    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src; // Safari plays HLS natively
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;
        const h = new Hls();
        h.loadSource(src);
        h.attachMedia(v);
        hls = h;
      });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      muted
      loop
      autoPlay
      playsInline
      onPlaying={() => setPlaying(true)}
      className="absolute inset-0 size-full object-cover transition-opacity duration-700"
      style={{ opacity: playing ? 1 : 0 }}
    />
  );
}

/* ============ realtime progress: frame-accurate + live timer ============ */
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function Progress({
  start,
  end,
  color,
}: {
  start?: number;
  end?: number;
  color: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const n = Date.now();
      setNow(n);
      if (!end || n < end) raf = requestAnimationFrame(loop); // stops itself at the end
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [start, end]);

  const total = start && end ? end - start : 0;
  const elapsed = total ? Math.min(total, Math.max(0, now - start!)) : 0;

  return (
    <div className="mt-5">
      <LinearProgress wavy value={total ? Math.round((elapsed / total) * 100) : 0} />
      <div className="mt-2 flex justify-between text-xs -mb-2 font-medium tabular-nums opacity-75">
        <span>{fmt(elapsed)}</span>
        <span>
          <NextImage
            className="animate-[vibe-bounce_3s_infinite_ease-in-out]"
            src="/vibe-car.png"
            width={35}
            height={35}
            alt="Car"
          />
        </span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}

/* ============ styles: liquid blobs, equalizer, song-change transition ============ */
const CSS = `
@keyframes np-a{0%,100%{transform:translate(-15%,-20%) rotate(0) scale(1);border-radius:42% 58% 63% 37%/45% 40% 60% 55%}
50%{transform:translate(30%,20%) rotate(160deg) scale(1.25);border-radius:62% 38% 35% 65%/55% 65% 35% 45%}}
@keyframes np-b{0%,100%{transform:translate(25%,10%) rotate(0) scale(1.1);border-radius:55% 45% 40% 60%/60% 35% 65% 40%}
50%{transform:translate(-25%,-15%) rotate(-140deg) scale(.9);border-radius:38% 62% 58% 42%/42% 60% 40% 58%}}
@keyframes np-c{0%,100%{transform:translate(0,30%) rotate(0) scale(.9);border-radius:60% 40% 55% 45%/40% 55% 45% 60%}
50%{transform:translate(20%,-30%) rotate(200deg) scale(1.2);border-radius:40% 60% 45% 55%/58% 42% 58% 42%}}
@keyframes np-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes np-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.np-blob{position:absolute;width:75%;aspect-ratio:1;filter:blur(40px);opacity:.6;
transition:background-color 1.2s ease;will-change:transform}
.np-in{animation:np-in .5s cubic-bezier(.2,0,0,1) both}
.np-eq{display:inline-block;width:3px;height:12px;border-radius:2px;transform-origin:bottom;animation:np-eq 1s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.np-blob,.np-in,.np-eq{animation:none!important}}
`;

function LiquidBackground({ p, active }: { p: Palette; active: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: p.container }}
      />
      <div
        className="np-blob"
        style={{
          top: "-30%",
          left: "-20%",
          backgroundColor: p.tertiaryContainer,
          animation: "np-a 14s ease-in-out infinite",
        }}
      />
      <div
        className="np-blob"
        style={{
          bottom: "-35%",
          right: "-25%",
          backgroundColor: p.secondaryContainer,
          animation: "np-b 18s ease-in-out infinite",
        }}
      />
      <div
        className="np-blob"
        style={{
          top: "10%",
          left: "30%",
          width: "55%",
          opacity: 0.35,
          backgroundColor: p.primary,
          animation: "np-c 22s ease-in-out infinite",
        }}
      />
      <div
        className="np-blob"
        style={{
          bottom: "-10%",
          left: "-15%",
          width: "45%",
          opacity: 0.3,
          backgroundColor: p.tertiary,
          animation: "np-a 26s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}

/* ============ cover shape: the same cookie as the hero, only its mask spins ============ */
const COVER_SHAPE =
  "M250.91,126 L250.86,127.51 L250.68,128.99 L250.41,130.46 L250.03,131.92 L249.53,133.33 L248.92,134.71 L248.22,136.02 L247.41,137.31 L246.53,138.49 L245.54,139.63 L244.46,140.71 L243.35,141.72 L242.24,142.73 L241.13,143.74 L240.03,144.74 L238.94,145.8 L237.91,146.91 L237.0,148.1 L236.17,149.33 L235.44,150.67 L234.78,152.03 L234.25,153.44 L233.85,154.87 L233.52,156.34 L233.32,157.82 L233.22,159.33 L233.25,160.82 L233.37,162.31 L233.62,163.8 L233.98,165.28 L234.43,166.72 L234.88,168.15 L235.34,169.57 L235.79,171.0 L236.25,172.44 L236.6,173.93 L236.85,175.39 L236.98,176.87 L237.0,178.39 L236.9,179.87 L236.7,181.36 L236.4,182.85 L235.97,184.28 L235.41,185.67 L234.78,187.03 L234.05,188.34 L233.22,189.6 L232.29,190.78 L231.28,191.89 L230.2,192.95 L229.01,193.91 L227.78,194.77 L226.49,195.52 L225.13,196.18 L223.75,196.73 L222.31,197.19 L220.85,197.54 L219.39,197.87 L217.9,198.19 L216.44,198.52 L214.98,198.82 L213.51,199.23 L212.08,199.73 L210.72,200.34 L209.41,201.04 L208.12,201.85 L206.91,202.73 L205.78,203.71 L204.72,204.77 L203.74,205.93 L202.86,207.14 L202.05,208.42 L201.37,209.73 L200.76,211.12 L200.28,212.53 L199.88,214.02 L199.58,215.48 L199.25,216.94 L198.92,218.4 L198.62,219.87 L198.24,221.35 L197.79,222.79 L197.24,224.15 L196.56,225.51 L195.77,226.8 L194.92,228.03 L193.96,229.19 L192.9,230.27 L191.79,231.28 L190.58,232.21 L189.32,233.02 L188.01,233.75 L186.65,234.38 L185.24,234.91 L183.8,235.31 L182.34,235.64 L180.86,235.84 L179.34,235.92 L177.86,235.89 L176.34,235.74 L174.88,235.49 L173.42,235.11 L171.99,234.66 L170.55,234.2 L169.11,233.75 L167.68,233.3 L166.24,232.87 L164.75,232.52 L163.29,232.26 L161.8,232.16 L160.29,232.14 L158.78,232.24 L157.29,232.47 L155.83,232.79 L154.4,233.22 L153.01,233.75 L151.65,234.41 L150.34,235.14 L149.1,235.97 L147.92,236.9 L146.81,237.93 L145.75,239.04 L144.74,240.15 L143.74,241.26 L142.73,242.37 L141.72,243.48 L140.64,244.54 L139.5,245.52 L138.29,246.4 L137.01,247.18 L135.67,247.89 L134.31,248.47 L132.87,248.97 L131.44,249.35 L129.95,249.6 L128.46,249.78 L126.95,249.8 L125.47,249.75 L123.98,249.58 L122.49,249.3 L121.06,248.9 L119.64,248.39 L118.26,247.79 L116.95,247.06 L115.66,246.25 L114.48,245.37 L113.34,244.36 L112.29,243.28 L111.28,242.17 L110.27,241.06 L109.26,239.95 L108.25,238.84 L107.2,237.76 L106.06,236.75 L104.88,235.84 L103.64,235.01 L102.31,234.28 L100.95,233.65 L99.54,233.15 L98.1,232.72 L96.64,232.41 L95.13,232.21 L93.64,232.14 L92.13,232.16 L90.64,232.31 L89.15,232.57 L87.69,232.92 L86.25,233.37 L84.82,233.83 L83.38,234.28 L81.97,234.73 L80.51,235.19 L79.05,235.54 L77.56,235.77 L76.07,235.89 L74.56,235.92 L73.08,235.82 L71.59,235.59 L70.13,235.26 L68.69,234.83 L67.28,234.28 L65.94,233.65 L64.63,232.89 L63.37,232.06 L62.19,231.13 L61.08,230.1 L60.05,229.01 L59.09,227.83 L58.26,226.59 L57.5,225.28 L56.85,223.92 L56.29,222.54 L55.86,221.1 L55.51,219.64 L55.18,218.15 L54.86,216.69 L54.55,215.23 L54.23,213.77 L53.82,212.31 L53.32,210.87 L52.69,209.51 L51.98,208.2 L51.18,206.94 L50.27,205.73 L49.29,204.59 L48.2,203.54 L47.07,202.58 L45.83,201.7 L44.55,200.91 L43.24,200.21 L41.85,199.63 L40.42,199.15 L38.95,198.77 L37.49,198.45 L36.03,198.14 L34.54,197.82 L33.08,197.49 L31.62,197.13 L30.18,196.66 L28.82,196.08 L27.46,195.4 L26.18,194.61 L24.97,193.76 L23.78,192.78 L22.7,191.72 L21.72,190.61 L20.81,189.4 L19.98,188.14 L19.27,186.83 L18.64,185.44 L18.14,184.03 L17.74,182.59 L17.43,181.13 L17.23,179.65 L17.16,178.13 L17.21,176.62 L17.36,175.14 L17.61,173.67 L17.99,172.21 L18.44,170.78 L18.89,169.34 L19.35,167.9 L19.8,166.47 L20.26,165.03 L20.58,163.54 L20.81,162.06 L20.94,160.57 L20.94,159.08 L20.84,157.57 L20.61,156.08 L20.26,154.62 L19.83,153.19 L19.27,151.8 L18.62,150.44 L17.86,149.13 L17.03,147.89 L16.1,146.73 L15.06,145.63 L13.96,144.59 L12.85,143.58 L11.74,142.55 L10.63,141.54 L9.52,140.54 L8.46,139.45 L7.48,138.32 L6.62,137.11 L5.82,135.82 L5.14,134.49 L4.56,133.1 L4.08,131.66 L3.72,130.23 L3.45,128.74 L3.3,127.26 L3.27,125.74 L3.35,124.26 L3.52,122.77 L3.83,121.28 L4.23,119.85 L4.73,118.44 L5.36,117.07 L6.07,115.74 L6.9,114.48 L7.81,113.29 L8.79,112.19 L9.9,111.1 L11.01,110.09 L12.12,109.09 L13.22,108.08 L14.33,107.07 L15.42,106.01 L16.43,104.88 L17.31,103.69 L18.14,102.43 L18.84,101.12 L19.47,99.74 L19.98,98.33 L20.38,96.89 L20.68,95.4 L20.89,93.92 L20.94,92.4 L20.91,90.92 L20.76,89.43 L20.48,87.94 L20.1,86.48 L19.65,85.05 L19.2,83.61 L18.74,82.17 L18.29,80.76 L17.86,79.3 L17.51,77.84 L17.28,76.35 L17.18,74.86 L17.18,73.35 L17.28,71.87 L17.51,70.38 L17.84,68.92 L18.29,67.48 L18.84,66.09 L19.5,64.73 L20.26,63.42 L21.09,62.19 L22.04,61.0 L23.05,59.9 L24.16,58.89 L25.37,57.93 L26.61,57.1 L27.89,56.34 L29.25,55.71 L30.64,55.16 L32.1,54.73 L33.56,54.4 L35.05,54.07 L36.51,53.75 L37.97,53.42 L39.43,53.09 L40.89,52.69 L42.31,52.16 L43.67,51.55 L45.0,50.82 L46.26,50.02 L47.45,49.11 L48.58,48.1 L49.61,47.02 L50.57,45.88 L51.45,44.65 L52.23,43.36 L52.91,42.03 L53.49,40.64 L53.97,39.21 L54.33,37.74 L54.65,36.28 L54.98,34.8 L55.28,33.33 L55.61,31.87 L55.99,30.41 L56.47,28.98 L57.05,27.61 L57.73,26.25 L58.53,24.99 L59.39,23.78 L60.37,22.62 L61.46,21.54 L62.59,20.53 L63.78,19.65 L65.06,18.84 L66.37,18.11 L67.76,17.51 L69.17,17.01 L70.61,16.6 L72.07,16.32 L73.58,16.15 L75.07,16.07 L76.58,16.12 L78.06,16.27 L79.53,16.55 L80.99,16.93 L82.42,17.38 L83.86,17.86 L85.3,18.32 L86.71,18.77 L88.17,19.2 L89.66,19.53 L91.14,19.75 L92.63,19.85 L94.12,19.85 L95.63,19.73 L97.12,19.5 L98.58,19.15 L100.01,18.69 L101.4,18.14 L102.76,17.48 L104.05,16.73 L105.28,15.87 L106.44,14.91 L107.55,13.88 L108.58,12.77 L109.59,11.66 L110.6,10.55 L111.61,9.44 L112.64,8.34 L113.72,7.28 L114.86,6.32 L116.09,5.46 L117.38,4.68 L118.71,4.0 L120.1,3.42 L121.53,2.97 L122.97,2.59 L124.46,2.34 L125.94,2.21 L127.46,2.19 L128.94,2.26 L130.46,2.46 L131.92,2.77 L133.35,3.17 L134.76,3.7 L136.13,4.33 L137.44,5.06 L138.7,5.89 L139.88,6.8 L140.99,7.78 L142.05,8.89 L143.06,10.0 L144.06,11.11 L145.07,12.22 L146.08,13.33 L147.16,14.41 L148.3,15.39 L149.48,16.3 L150.74,17.11 L152.08,17.81 L153.46,18.42 L154.87,18.92 L156.31,19.32 L157.8,19.63 L159.28,19.8 L160.8,19.85 L162.28,19.8 L163.77,19.65 L165.26,19.37 L166.72,19.0 L168.15,18.54 L169.59,18.09 L171.03,17.64 L172.44,17.18 L173.9,16.73 L175.36,16.4 L176.85,16.2 L178.34,16.07 L179.85,16.1 L181.33,16.22 L182.82,16.45 L184.28,16.8 L185.72,17.23 L187.11,17.81 L188.47,18.47 L189.75,19.22 L190.99,20.08 L192.17,21.04 L193.25,22.07 L194.29,23.18 L195.22,24.36 L196.05,25.62 L196.78,26.93 L197.41,28.29 L197.94,29.68 L198.37,31.12 L198.72,32.6 L199.02,34.07 L199.35,35.53 L199.68,36.99 L200.01,38.48 L200.44,39.94 L200.97,41.35 L201.57,42.68 L202.3,44.02 L203.13,45.25 L204.06,46.46 L205.05,47.57 L206.13,48.61 L207.32,49.56 L208.53,50.42 L209.84,51.2 L211.17,51.88 L212.56,52.44 L213.99,52.91 L215.46,53.27 L216.92,53.6 L218.4,53.9 L219.87,54.23 L221.33,54.55 L222.79,54.93 L224.22,55.44 L225.59,56.01 L226.92,56.72 L228.21,57.5 L229.42,58.38 L230.55,59.37 L231.63,60.45 L232.62,61.58 L233.5,62.79 L234.3,64.08 L235.01,65.39 L235.62,66.78 L236.12,68.19 L236.5,69.62 L236.77,71.11 L236.95,72.6 L237.0,74.11 L236.95,75.62 L236.77,77.08 L236.5,78.57 L236.09,80.03 L235.64,81.47 L235.19,82.88 L234.73,84.31 L234.28,85.75 L233.85,87.21 L233.52,88.67 L233.32,90.16 L233.22,91.65 L233.25,93.16 L233.37,94.67 L233.62,96.13 L233.98,97.59 L234.43,99.03 L234.99,100.42 L235.67,101.78 L236.42,103.06 L237.28,104.3 L238.24,105.46 L239.29,106.54 L240.4,107.57 L241.51,108.58 L242.62,109.59 L243.73,110.6 L244.84,111.63 L245.87,112.71 L246.83,113.87 L247.69,115.11 L248.47,116.39 L249.12,117.73 L249.7,119.12 L250.16,120.55 L250.51,122.01 L250.76,123.5 L250.89,124.99 Z";

const COVER_SPIN_SECONDS = 35;

/* ============ component ============ */
export default function NowPlaying({ dark }: { dark?: boolean }) {
  const clipId = useId().replace(/:/g, "");
  const data = useLanyard(DISCORD_ID);
  const activity = data?.activities.find((a) => a.name === APP_NAME);

  const art = resolveArt(activity?.assets?.large_image);
  const systemDark = useIsDark();
  const p = useAlbumPalette(art, dark ?? systemDark);

  // details = song, state = artist, large_text = album (falls back to song)
  const title = activity?.details;
  const artist = activity?.state;
  const album = activity?.assets?.large_text || title;
  const animated = useAnimatedArt(artist, album, title);

  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const coverReady = !!art && loadedSrc === art;

  // one angle drives both the clip mask and the ring, so the cover itself never moves
  const reduceMotion = useReducedMotion();
  const rotate = useMotionValue(0);
  const clipShapeRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const hasActivity = !!activity;

  useEffect(() => {
    if (reduceMotion || !hasActivity) return;
    const controls = animate(rotate, 360, {
      duration: COVER_SPIN_SECONDS,
      ease: "linear",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [rotate, reduceMotion, hasActivity]);

  useMotionValueEvent(rotate, "change", (angle) => {
    clipShapeRef.current?.setAttribute(
      "transform",
      `scale(${1 / 252}) rotate(${angle} 126 126)`,
    );
    ringRef.current?.setAttribute("transform", `rotate(${angle} 126 126)`);
  });

  if (!activity)
    return (
      <div className="relative isolate overflow-hidden bg-base-200 p-6 w-full rounded-field rounded-b-box lg:rounded-field h-55 lg:rounded-r-box">
        <div className="flex gap-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="252"
            height="252"
            viewBox="0 0 252 252"
            className="size-25 fill-primary animate-spin [animation-duration:15s]"
          >
            <g transform="translate(0, 0)">
              <g id="Root">
                <g id="BoxKt">
                  <path d="M250.91,126 L250.86,127.51 L250.68,128.99 L250.41,130.46 L250.03,131.92 L249.53,133.33 L248.92,134.71 L248.22,136.02 L247.41,137.31 L246.53,138.49 L245.54,139.63 L244.46,140.71 L243.35,141.72 L242.24,142.73 L241.13,143.74 L240.03,144.74 L238.94,145.8 L237.91,146.91 L237.0,148.1 L236.17,149.33 L235.44,150.67 L234.78,152.03 L234.25,153.44 L233.85,154.87 L233.52,156.34 L233.32,157.82 L233.22,159.33 L233.25,160.82 L233.37,162.31 L233.62,163.8 L233.98,165.28 L234.43,166.72 L234.88,168.15 L235.34,169.57 L235.79,171.0 L236.25,172.44 L236.6,173.93 L236.85,175.39 L236.98,176.87 L237.0,178.39 L236.9,179.87 L236.7,181.36 L236.4,182.85 L235.97,184.28 L235.41,185.67 L234.78,187.03 L234.05,188.34 L233.22,189.6 L232.29,190.78 L231.28,191.89 L230.2,192.95 L229.01,193.91 L227.78,194.77 L226.49,195.52 L225.13,196.18 L223.75,196.73 L222.31,197.19 L220.85,197.54 L219.39,197.87 L217.9,198.19 L216.44,198.52 L214.98,198.82 L213.51,199.23 L212.08,199.73 L210.72,200.34 L209.41,201.04 L208.12,201.85 L206.91,202.73 L205.78,203.71 L204.72,204.77 L203.74,205.93 L202.86,207.14 L202.05,208.42 L201.37,209.73 L200.76,211.12 L200.28,212.53 L199.88,214.02 L199.58,215.48 L199.25,216.94 L198.92,218.4 L198.62,219.87 L198.24,221.35 L197.79,222.79 L197.24,224.15 L196.56,225.51 L195.77,226.8 L194.92,228.03 L193.96,229.19 L192.9,230.27 L191.79,231.28 L190.58,232.21 L189.32,233.02 L188.01,233.75 L186.65,234.38 L185.24,234.91 L183.8,235.31 L182.34,235.64 L180.86,235.84 L179.34,235.92 L177.86,235.89 L176.34,235.74 L174.88,235.49 L173.42,235.11 L171.99,234.66 L170.55,234.2 L169.11,233.75 L167.68,233.3 L166.24,232.87 L164.75,232.52 L163.29,232.26 L161.8,232.16 L160.29,232.14 L158.78,232.24 L157.29,232.47 L155.83,232.79 L154.4,233.22 L153.01,233.75 L151.65,234.41 L150.34,235.14 L149.1,235.97 L147.92,236.9 L146.81,237.93 L145.75,239.04 L144.74,240.15 L143.74,241.26 L142.73,242.37 L141.72,243.48 L140.64,244.54 L139.5,245.52 L138.29,246.4 L137.01,247.18 L135.67,247.89 L134.31,248.47 L132.87,248.97 L131.44,249.35 L129.95,249.6 L128.46,249.78 L126.95,249.8 L125.47,249.75 L123.98,249.58 L122.49,249.3 L121.06,248.9 L119.64,248.39 L118.26,247.79 L116.95,247.06 L115.66,246.25 L114.48,245.37 L113.34,244.36 L112.29,243.28 L111.28,242.17 L110.27,241.06 L109.26,239.95 L108.25,238.84 L107.2,237.76 L106.06,236.75 L104.88,235.84 L103.64,235.01 L102.31,234.28 L100.95,233.65 L99.54,233.15 L98.1,232.72 L96.64,232.41 L95.13,232.21 L93.64,232.14 L92.13,232.16 L90.64,232.31 L89.15,232.57 L87.69,232.92 L86.25,233.37 L84.82,233.83 L83.38,234.28 L81.97,234.73 L80.51,235.19 L79.05,235.54 L77.56,235.77 L76.07,235.89 L74.56,235.92 L73.08,235.82 L71.59,235.59 L70.13,235.26 L68.69,234.83 L67.28,234.28 L65.94,233.65 L64.63,232.89 L63.37,232.06 L62.19,231.13 L61.08,230.1 L60.05,229.01 L59.09,227.83 L58.26,226.59 L57.5,225.28 L56.85,223.92 L56.29,222.54 L55.86,221.1 L55.51,219.64 L55.18,218.15 L54.86,216.69 L54.55,215.23 L54.23,213.77 L53.82,212.31 L53.32,210.87 L52.69,209.51 L51.98,208.2 L51.18,206.94 L50.27,205.73 L49.29,204.59 L48.2,203.54 L47.07,202.58 L45.83,201.7 L44.55,200.91 L43.24,200.21 L41.85,199.63 L40.42,199.15 L38.95,198.77 L37.49,198.45 L36.03,198.14 L34.54,197.82 L33.08,197.49 L31.62,197.13 L30.18,196.66 L28.82,196.08 L27.46,195.4 L26.18,194.61 L24.97,193.76 L23.78,192.78 L22.7,191.72 L21.72,190.61 L20.81,189.4 L19.98,188.14 L19.27,186.83 L18.64,185.44 L18.14,184.03 L17.74,182.59 L17.43,181.13 L17.23,179.65 L17.16,178.13 L17.21,176.62 L17.36,175.14 L17.61,173.67 L17.99,172.21 L18.44,170.78 L18.89,169.34 L19.35,167.9 L19.8,166.47 L20.26,165.03 L20.58,163.54 L20.81,162.06 L20.94,160.57 L20.94,159.08 L20.84,157.57 L20.61,156.08 L20.26,154.62 L19.83,153.19 L19.27,151.8 L18.62,150.44 L17.86,149.13 L17.03,147.89 L16.1,146.73 L15.06,145.63 L13.96,144.59 L12.85,143.58 L11.74,142.55 L10.63,141.54 L9.52,140.54 L8.46,139.45 L7.48,138.32 L6.62,137.11 L5.82,135.82 L5.14,134.49 L4.56,133.1 L4.08,131.66 L3.72,130.23 L3.45,128.74 L3.3,127.26 L3.27,125.74 L3.35,124.26 L3.52,122.77 L3.83,121.28 L4.23,119.85 L4.73,118.44 L5.36,117.07 L6.07,115.74 L6.9,114.48 L7.81,113.29 L8.79,112.19 L9.9,111.1 L11.01,110.09 L12.12,109.09 L13.22,108.08 L14.33,107.07 L15.42,106.01 L16.43,104.88 L17.31,103.69 L18.14,102.43 L18.84,101.12 L19.47,99.74 L19.98,98.33 L20.38,96.89 L20.68,95.4 L20.89,93.92 L20.94,92.4 L20.91,90.92 L20.76,89.43 L20.48,87.94 L20.1,86.48 L19.65,85.05 L19.2,83.61 L18.74,82.17 L18.29,80.76 L17.86,79.3 L17.51,77.84 L17.28,76.35 L17.18,74.86 L17.18,73.35 L17.28,71.87 L17.51,70.38 L17.84,68.92 L18.29,67.48 L18.84,66.09 L19.5,64.73 L20.26,63.42 L21.09,62.19 L22.04,61.0 L23.05,59.9 L24.16,58.89 L25.37,57.93 L26.61,57.1 L27.89,56.34 L29.25,55.71 L30.64,55.16 L32.1,54.73 L33.56,54.4 L35.05,54.07 L36.51,53.75 L37.97,53.42 L39.43,53.09 L40.89,52.69 L42.31,52.16 L43.67,51.55 L45.0,50.82 L46.26,50.02 L47.45,49.11 L48.58,48.1 L49.61,47.02 L50.57,45.88 L51.45,44.65 L52.23,43.36 L52.91,42.03 L53.49,40.64 L53.97,39.21 L54.33,37.74 L54.65,36.28 L54.98,34.8 L55.28,33.33 L55.61,31.87 L55.99,30.41 L56.47,28.98 L57.05,27.61 L57.73,26.25 L58.53,24.99 L59.39,23.78 L60.37,22.62 L61.46,21.54 L62.59,20.53 L63.78,19.65 L65.06,18.84 L66.37,18.11 L67.76,17.51 L69.17,17.01 L70.61,16.6 L72.07,16.32 L73.58,16.15 L75.07,16.07 L76.58,16.12 L78.06,16.27 L79.53,16.55 L80.99,16.93 L82.42,17.38 L83.86,17.86 L85.3,18.32 L86.71,18.77 L88.17,19.2 L89.66,19.53 L91.14,19.75 L92.63,19.85 L94.12,19.85 L95.63,19.73 L97.12,19.5 L98.58,19.15 L100.01,18.69 L101.4,18.14 L102.76,17.48 L104.05,16.73 L105.28,15.87 L106.44,14.91 L107.55,13.88 L108.58,12.77 L109.59,11.66 L110.6,10.55 L111.61,9.44 L112.64,8.34 L113.72,7.28 L114.86,6.32 L116.09,5.46 L117.38,4.68 L118.71,4.0 L120.1,3.42 L121.53,2.97 L122.97,2.59 L124.46,2.34 L125.94,2.21 L127.46,2.19 L128.94,2.26 L130.46,2.46 L131.92,2.77 L133.35,3.17 L134.76,3.7 L136.13,4.33 L137.44,5.06 L138.7,5.89 L139.88,6.8 L140.99,7.78 L142.05,8.89 L143.06,10.0 L144.06,11.11 L145.07,12.22 L146.08,13.33 L147.16,14.41 L148.3,15.39 L149.48,16.3 L150.74,17.11 L152.08,17.81 L153.46,18.42 L154.87,18.92 L156.31,19.32 L157.8,19.63 L159.28,19.8 L160.8,19.85 L162.28,19.8 L163.77,19.65 L165.26,19.37 L166.72,19.0 L168.15,18.54 L169.59,18.09 L171.03,17.64 L172.44,17.18 L173.9,16.73 L175.36,16.4 L176.85,16.2 L178.34,16.07 L179.85,16.1 L181.33,16.22 L182.82,16.45 L184.28,16.8 L185.72,17.23 L187.11,17.81 L188.47,18.47 L189.75,19.22 L190.99,20.08 L192.17,21.04 L193.25,22.07 L194.29,23.18 L195.22,24.36 L196.05,25.62 L196.78,26.93 L197.41,28.29 L197.94,29.68 L198.37,31.12 L198.72,32.6 L199.02,34.07 L199.35,35.53 L199.68,36.99 L200.01,38.48 L200.44,39.94 L200.97,41.35 L201.57,42.68 L202.3,44.02 L203.13,45.25 L204.06,46.46 L205.05,47.57 L206.13,48.61 L207.32,49.56 L208.53,50.42 L209.84,51.2 L211.17,51.88 L212.56,52.44 L213.99,52.91 L215.46,53.27 L216.92,53.6 L218.4,53.9 L219.87,54.23 L221.33,54.55 L222.79,54.93 L224.22,55.44 L225.59,56.01 L226.92,56.72 L228.21,57.5 L229.42,58.38 L230.55,59.37 L231.63,60.45 L232.62,61.58 L233.5,62.79 L234.3,64.08 L235.01,65.39 L235.62,66.78 L236.12,68.19 L236.5,69.62 L236.77,71.11 L236.95,72.6 L237.0,74.11 L236.95,75.62 L236.77,77.08 L236.5,78.57 L236.09,80.03 L235.64,81.47 L235.19,82.88 L234.73,84.31 L234.28,85.75 L233.85,87.21 L233.52,88.67 L233.32,90.16 L233.22,91.65 L233.25,93.16 L233.37,94.67 L233.62,96.13 L233.98,97.59 L234.43,99.03 L234.99,100.42 L235.67,101.78 L236.42,103.06 L237.28,104.3 L238.24,105.46 L239.29,106.54 L240.4,107.57 L241.51,108.58 L242.62,109.59 L243.73,110.6 L244.84,111.63 L245.87,112.71 L246.83,113.87 L247.69,115.11 L248.47,116.39 L249.12,117.73 L249.7,119.12 L250.16,120.55 L250.51,122.01 L250.76,123.5 L250.89,124.99 Z" />
                </g>
              </g>
            </g>
          </svg>

          <div className="np-in min-w-0 flex-1">
            <h3 className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight">
              Sooo.
            </h3>
            <p className="mt-1 truncate text-base opacity-80">
              Nothing playing
            </p>
          </div>
        </div>

        <div className="mt-10 ">
          <LinearProgress value={4} />


          <div className="mt-2 flex justify-between text-xs font-medium tabular-nums opacity-75">
            <span></span>
            <span>
              <NextImage
                className="animate-[epping-float_4s_infinite_ease-in-out]"
                src="/epping-car.gif"
                width={35}
                height={35}
                alt="Car"
              />
            </span>
            <span></span>
          </div>
        </div>

        <div className="absolute top-3 right-3 md:top-5 md:right-5 scale-75 md:scale-100">
          <svg
            className="fill-primary"
            xmlns="http://www.w3.org/2000/svg"
            width="70"
            viewBox="0 0 252 252"
          >
            <g transform="translate(0, 0)">
              <g id="Root">
                <g id="BoxKt">
                  <path d="M219.59,219.44 L218.5,220.47 L217.4,221.5 L216.29,222.49 L215.13,223.47 L213.94,224.4 L212.76,225.28 L211.52,226.17 L210.29,227.0 L209.03,227.8 L207.74,228.58 L206.43,229.34 L205.12,230.05 L203.76,230.7 L202.43,231.36 L201.04,231.96 L199.65,232.52 L198.24,233.04 L196.83,233.52 L195.4,233.98 L193.96,234.41 L192.5,234.76 L191.04,235.11 L189.57,235.39 L188.09,235.64 L186.6,235.87 L185.11,236.04 L183.6,236.17 L182.12,236.25 L180.63,236.3 L179.12,236.32 L177.63,236.27 L176.12,236.19 L174.61,236.09 L173.12,235.94 L171.66,235.74 L170.17,235.51 L168.71,235.24 L167.22,234.91 L165.74,234.56 L164.3,234.18 L162.89,233.75 L161.48,233.3 L160.07,232.79 L158.63,232.26 L157.22,231.68 L155.83,231.08 L154.45,230.5 L153.06,229.89 L151.7,229.32 L150.31,228.71 L148.93,228.11 L147.57,227.53 L146.18,226.92 L144.77,226.37 L143.36,225.84 L141.95,225.33 L140.51,224.91 L139.07,224.5 L137.61,224.15 L136.15,223.82 L134.66,223.57 L133.18,223.32 L131.69,223.14 L130.2,222.99 L128.69,222.91 L127.2,222.84 L125.69,222.84 L124.21,222.86 L122.69,222.94 L121.21,223.07 L119.72,223.24 L118.21,223.44 L116.75,223.7 L115.26,224.0 L113.8,224.33 L112.36,224.7 L110.93,225.13 L109.49,225.59 L108.08,226.09 L106.67,226.64 L105.28,227.22 L103.89,227.83 L102.53,228.43 L101.15,229.01 L99.76,229.62 L98.4,230.22 L97.02,230.8 L95.63,231.41 L94.22,232.01 L92.81,232.57 L91.4,233.1 L89.96,233.57 L88.55,234.0 L87.14,234.41 L85.68,234.78 L84.19,235.11 L82.7,235.41 L81.24,235.67 L79.75,235.89 L78.29,236.04 L76.8,236.19 L75.29,236.3 L73.78,236.35 L72.27,236.35 L70.78,236.32 L69.3,236.27 L67.81,236.14 L66.3,235.99 L64.81,235.82 L63.32,235.56 L61.86,235.31 L60.4,234.99 L58.94,234.63 L57.48,234.25 L56.04,233.83 L54.63,233.35 L53.22,232.84 L51.81,232.29 L50.42,231.71 L49.06,231.1 L47.7,230.45 L46.36,229.74 L45.05,229.04 L43.77,228.28 L42.48,227.48 L41.22,226.64 L40.01,225.79 L38.8,224.91 L37.59,224.0 L36.43,223.04 L35.3,222.06 L34.19,221.07 L33.11,220.02 L32.05,218.96 L30.99,217.87 L30.01,216.77 L29.03,215.63 L28.07,214.47 L27.16,213.26 L26.28,212.05 L25.42,210.84 L24.59,209.58 L23.81,208.3 L23.03,207.01 L22.32,205.68 L21.62,204.37 L20.96,203.01 L20.36,201.65 L19.78,200.26 L19.22,198.85 L18.72,197.44 L18.27,196.03 L17.81,194.59 L17.43,193.13 L17.08,191.67 L16.78,190.2 L16.5,188.74 L16.27,187.26 L16.07,185.77 L15.92,184.26 L15.82,182.77 L15.75,181.28 L15.72,179.77 L15.72,178.29 L15.8,176.77 L15.87,175.26 L16.02,173.77 L16.2,172.31 L16.4,170.83 L16.65,169.34 L16.95,167.88 L17.31,166.39 L17.66,164.93 L18.06,163.52 L18.52,162.11 L19.0,160.67 L19.5,159.26 L20.08,157.85 L20.66,156.41 L21.26,155.05 L21.84,153.66 L22.45,152.3 L23.05,150.92 L23.63,149.53 L24.24,148.17 L24.82,146.79 L25.42,145.4 L25.95,143.99 L26.45,142.58 L26.93,141.14 L27.34,139.7 L27.72,138.24 L28.07,136.78 L28.35,135.32 L28.6,133.83 L28.8,132.35 L28.98,130.86 L29.08,129.35 L29.15,127.86 L29.2,126.35 L29.18,124.86 L29.13,123.35 L29.03,121.86 L28.87,120.35 L28.7,118.86 L28.47,117.38 L28.19,115.92 L27.87,114.45 L27.51,112.99 L27.11,111.56 L26.66,110.12 L26.18,108.68 L25.65,107.27 L25.07,105.89 L24.49,104.5 L23.88,103.11 L23.28,101.75 L22.7,100.37 L22.1,98.98 L21.49,97.62 L20.91,96.23 L20.31,94.85 L19.73,93.44 L19.17,92.0 L18.69,90.59 L18.24,89.18 L17.81,87.77 L17.43,86.33 L17.08,84.84 L16.75,83.36 L16.48,81.87 L16.25,80.41 L16.05,78.95 L15.9,77.46 L15.8,75.95 L15.72,74.44 L15.67,72.92 L15.69,71.44 L15.75,69.95 L15.82,68.46 L15.95,66.95 L16.12,65.46 L16.35,63.98 L16.6,62.49 L16.88,61.03 L17.23,59.57 L17.58,58.11 L18.01,56.67 L18.47,55.23 L18.95,53.82 L19.47,52.41 L20.05,51.03 L20.63,49.64 L21.29,48.3 L21.94,46.94 L22.65,45.63 L23.41,44.32 L24.19,43.04 L24.99,41.78 L25.83,40.54 L26.71,39.31 L27.61,38.12 L28.55,36.94 L29.5,35.78 L30.49,34.67 L31.52,33.56 L32.58,32.48 L33.64,31.44 L34.75,30.41 L35.88,29.43 L37.01,28.47 L38.2,27.54 L39.41,26.63 L40.62,25.77 L41.88,24.92 L43.14,24.11 L44.42,23.36 L45.73,22.6 L47.04,21.89 L48.4,21.24 L49.77,20.61 L51.13,20.0 L52.54,19.42 L53.92,18.92 L55.33,18.42 L56.77,17.99 L58.23,17.56 L59.67,17.21 L61.16,16.85 L62.62,16.58 L64.08,16.32 L65.57,16.12 L67.08,15.95 L68.56,15.82 L70.08,15.72 L71.56,15.69 L73.05,15.67 L74.56,15.72 L76.05,15.8 L77.59,15.92 L79.05,16.07 L80.51,16.27 L82.0,16.5 L83.48,16.78 L84.94,17.11 L86.43,17.46 L87.87,17.84 L89.28,18.27 L90.69,18.72 L92.13,19.22 L93.54,19.75 L94.95,20.36 L96.33,20.94 L97.72,21.54 L99.11,22.12 L100.47,22.73 L101.85,23.33 L103.24,23.91 L104.6,24.51 L105.99,25.09 L107.4,25.67 L108.81,26.2 L110.22,26.68 L111.66,27.11 L113.12,27.51 L114.55,27.87 L116.02,28.17 L117.5,28.45 L118.99,28.67 L120.48,28.85 L121.99,29.0 L123.48,29.1 L124.99,29.15 L126.47,29.15 L127.99,29.13 L129.47,29.03 L130.98,28.9 L132.47,28.75 L133.96,28.52 L135.44,28.27 L136.91,27.99 L138.37,27.64 L139.8,27.26 L141.24,26.83 L142.68,26.38 L144.09,25.85 L145.5,25.3 L146.89,24.72 L148.27,24.11 L149.66,23.53 L151.02,22.93 L152.4,22.32 L153.77,21.74 L155.15,21.14 L156.54,20.53 L157.95,19.95 L159.36,19.4 L160.77,18.87 L162.21,18.39 L163.62,17.96 L165.03,17.56 L166.49,17.18 L167.98,16.85 L169.47,16.55 L170.93,16.3 L172.41,16.1 L173.88,15.92 L175.39,15.8 L176.9,15.69 L178.41,15.64 L179.9,15.64 L181.38,15.67 L182.87,15.75 L184.38,15.85 L185.87,16.0 L187.36,16.2 L188.84,16.43 L190.31,16.7 L191.77,17.03 L193.25,17.38 L194.69,17.76 L196.13,18.21 L197.56,18.67 L198.95,19.17 L200.36,19.73 L201.75,20.33 L203.11,20.94 L204.47,21.59 L205.78,22.3 L207.11,23.0 L208.4,23.78 L209.66,24.57 L210.92,25.4 L212.15,26.25 L213.36,27.14 L214.55,28.07 L215.71,29.0 L216.84,29.98 L217.95,30.99 L219.06,32.02 L220.12,33.11 L221.15,34.19 L222.13,35.3 L223.12,36.43 L224.07,37.62 L224.98,38.8 L225.86,40.01 L226.72,41.25 L227.55,42.51 L228.33,43.77 L229.09,45.08 L229.79,46.39 L230.5,47.72 L231.15,49.08 L231.76,50.45 L232.34,51.83 L232.89,53.24 L233.37,54.65 L233.85,56.07 L234.28,57.5 L234.66,58.96 L235.01,60.42 L235.34,61.89 L235.59,63.35 L235.82,64.83 L236.02,66.32 L236.17,67.83 L236.27,69.35 L236.32,70.81 L236.35,72.32 L236.35,73.81 L236.27,75.32 L236.17,76.83 L236.04,78.32 L235.87,79.78 L235.64,81.27 L235.39,82.75 L235.09,84.21 L234.76,85.7 L234.38,87.16 L233.98,88.57 L233.52,89.98 L233.04,91.42 L232.52,92.83 L231.96,94.24 L231.36,95.65 L230.78,97.04 L230.17,98.43 L229.59,99.79 L228.99,101.17 L228.38,102.56 L227.8,103.92 L227.2,105.31 L226.62,106.69 L226.06,108.1 L225.56,109.51 L225.11,110.95 L224.7,112.39 L224.33,113.85 L224.0,115.31 L223.7,116.77 L223.44,118.26 L223.24,119.75 L223.09,121.23 L222.99,122.74 L222.91,124.23 L222.89,125.74 L222.89,127.23 L222.96,128.74 L223.07,130.23 L223.19,131.74 L223.39,133.23 L223.62,134.71 L223.9,136.18 L224.22,137.64 L224.58,139.1 L224.98,140.54 L225.43,141.97 L225.94,143.41 L226.47,144.82 L227.05,146.21 L227.63,147.59 L228.23,148.95 L228.84,150.34 L229.42,151.72 L230.02,153.09 L230.63,154.47 L231.21,155.86 L231.81,157.24 L232.39,158.65 L232.92,160.09 L233.42,161.5 L233.88,162.91 L234.28,164.32 L234.68,165.76 L235.04,167.25 L235.34,168.73 L235.62,170.22 L235.84,171.68 L236.04,173.14 L236.19,174.63 L236.3,176.14 L236.37,177.66 L236.4,179.17 L236.4,180.65 L236.35,182.14 L236.25,183.63 L236.09,185.14 L235.92,186.63 L235.72,188.11 L235.46,189.6 L235.16,191.06 L234.83,192.52 L234.46,193.98 L234.03,195.42 L233.57,196.86 L233.1,198.27 L232.57,199.65 L231.99,201.07 L231.38,202.43 L230.75,203.79 L230.07,205.12 L229.37,206.46 L228.61,207.74 L227.83,209.03 L227.02,210.31 L226.19,211.55 L225.31,212.76 L224.4,213.97 L223.47,215.13 L222.51,216.29 L221.5,217.4 L220.5,218.5 Z" />
                </g>
              </g>
            </g>

            <svg
              x="60"
              y="60"
              width="130"
              height="130"
              viewBox="0 0 24 24"
              className="fill-base-100"
            >
              <path d="M19.8,22.6L1.4,4.2L2.8,2.8L21.2,21.2l-1.4,1.4ZM14,11.15l-2-2V3h6V7H14v4.15ZM10,21q-1.65,0-2.82-1.18T6,17t1.18-2.83T10,13q0.58,0 1.06,0.14T12,13.55V12l2,2v3q0,1.65-1.17,2.82T10,21Z" />
            </svg>
          </svg>
        </div>
      </div>
    );

  const trackKey = `${title}-${artist}`;

  return (
    <div
      className="relative isolate overflow-hidden bg-base-200 p-6 w-full rounded-field lg:rounded-field lg:rounded-r-box transition-colors duration-1000"
      style={{ color: art ? p.onContainer : undefined }}
    >
      <style>{CSS}</style>
      <LiquidBackground p={p} active={!!art} />

      {/* your SVG as the mask (scaled from its 252 grid to 0..1 units) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path
              ref={clipShapeRef}
              d={COVER_SHAPE}
              transform={`scale(${1 / 252})`}
            />
          </clipPath>
        </defs>
      </svg>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
        {/* drop-shadow on the wrapper, because clip-path would cut a normal shadow */}
        <div
          className="relative shrink-0 self-start sm:self-auto"
          style={{ filter: "drop-shadow(0 10px 18px rgb(0 0 0 / .35))" }}
        >
          <div
            key={art ?? "none"}
            className="np-in relative size-25 overflow-hidden sm:size-28"
            style={{ clipPath: `url(#${clipId})` }}
          >
            <div
              className="absolute inset-0 transition-colors duration-700"
              style={{ backgroundColor: p.secondaryContainer }}
            />

            {art && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={art}
                src={art}
                alt={album ?? ""}
                crossOrigin="anonymous"
                ref={(el) => {
                  // cached images can finish before React attaches onLoad
                  if (el?.complete && el.naturalWidth > 0) setLoadedSrc(art);
                }}
                onLoad={() => setLoadedSrc(art)}
                onError={() => setLoadedSrc(art)}
                className="absolute inset-0 size-full object-cover transition-opacity duration-500"
                style={{ opacity: coverReady ? 1 : 0 }}
              />
            )}

            {animated && coverReady && (
              <HlsVideo key={animated} src={animated} />
            )}

            {/* album cover loading screen */}
            {!coverReady && (
              <div
                className="np-in absolute inset-0 grid place-items-center"
                style={{ color: p.primary }}
              >
                <Loading variant="morph" contained size={45} className="fill-primary!" />
              </div>
            )}
          </div>

          <svg
            viewBox="0 0 252 252"
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          >
            <path
              ref={ringRef}
              d={COVER_SHAPE}
              fill="none"
              strokeWidth="7"
              strokeLinejoin="round"
              className="transition-[stroke] duration-700"
              style={{ stroke: p.primary }}
            />
          </svg>
        </div>

        <div key={trackKey} className="np-in min-w-6 flex-1">
          <h3 className="mt-3 text-2xl min-w-px font-semibold leading-tight w-90 truncate">
            {title}
          </h3>

          <p className="mt-1 truncate text-base opacity-80">{artist}</p>
        </div>
      </div>

      <Progress
        key={`${activity.timestamps?.start}-${activity.timestamps?.end}`}
        start={activity.timestamps?.start}
        end={activity.timestamps?.end}
        color={p.primary}
      />

      <div className="absolute top-3 right-3 md:top-5 md:right-5 scale-75 md:scale-100">
        <svg
          className="fill-primary"
          xmlns="http://www.w3.org/2000/svg"
          width="70"
          viewBox="0 0 252 252"
        >
          <g transform="translate(0, 0)">
            <g id="Root">
              <g id="BoxKt">
                <path d="M219.59,219.44 L218.5,220.47 L217.4,221.5 L216.29,222.49 L215.13,223.47 L213.94,224.4 L212.76,225.28 L211.52,226.17 L210.29,227.0 L209.03,227.8 L207.74,228.58 L206.43,229.34 L205.12,230.05 L203.76,230.7 L202.43,231.36 L201.04,231.96 L199.65,232.52 L198.24,233.04 L196.83,233.52 L195.4,233.98 L193.96,234.41 L192.5,234.76 L191.04,235.11 L189.57,235.39 L188.09,235.64 L186.6,235.87 L185.11,236.04 L183.6,236.17 L182.12,236.25 L180.63,236.3 L179.12,236.32 L177.63,236.27 L176.12,236.19 L174.61,236.09 L173.12,235.94 L171.66,235.74 L170.17,235.51 L168.71,235.24 L167.22,234.91 L165.74,234.56 L164.3,234.18 L162.89,233.75 L161.48,233.3 L160.07,232.79 L158.63,232.26 L157.22,231.68 L155.83,231.08 L154.45,230.5 L153.06,229.89 L151.7,229.32 L150.31,228.71 L148.93,228.11 L147.57,227.53 L146.18,226.92 L144.77,226.37 L143.36,225.84 L141.95,225.33 L140.51,224.91 L139.07,224.5 L137.61,224.15 L136.15,223.82 L134.66,223.57 L133.18,223.32 L131.69,223.14 L130.2,222.99 L128.69,222.91 L127.2,222.84 L125.69,222.84 L124.21,222.86 L122.69,222.94 L121.21,223.07 L119.72,223.24 L118.21,223.44 L116.75,223.7 L115.26,224.0 L113.8,224.33 L112.36,224.7 L110.93,225.13 L109.49,225.59 L108.08,226.09 L106.67,226.64 L105.28,227.22 L103.89,227.83 L102.53,228.43 L101.15,229.01 L99.76,229.62 L98.4,230.22 L97.02,230.8 L95.63,231.41 L94.22,232.01 L92.81,232.57 L91.4,233.1 L89.96,233.57 L88.55,234.0 L87.14,234.41 L85.68,234.78 L84.19,235.11 L82.7,235.41 L81.24,235.67 L79.75,235.89 L78.29,236.04 L76.8,236.19 L75.29,236.3 L73.78,236.35 L72.27,236.35 L70.78,236.32 L69.3,236.27 L67.81,236.14 L66.3,235.99 L64.81,235.82 L63.32,235.56 L61.86,235.31 L60.4,234.99 L58.94,234.63 L57.48,234.25 L56.04,233.83 L54.63,233.35 L53.22,232.84 L51.81,232.29 L50.42,231.71 L49.06,231.1 L47.7,230.45 L46.36,229.74 L45.05,229.04 L43.77,228.28 L42.48,227.48 L41.22,226.64 L40.01,225.79 L38.8,224.91 L37.59,224.0 L36.43,223.04 L35.3,222.06 L34.19,221.07 L33.11,220.02 L32.05,218.96 L30.99,217.87 L30.01,216.77 L29.03,215.63 L28.07,214.47 L27.16,213.26 L26.28,212.05 L25.42,210.84 L24.59,209.58 L23.81,208.3 L23.03,207.01 L22.32,205.68 L21.62,204.37 L20.96,203.01 L20.36,201.65 L19.78,200.26 L19.22,198.85 L18.72,197.44 L18.27,196.03 L17.81,194.59 L17.43,193.13 L17.08,191.67 L16.78,190.2 L16.5,188.74 L16.27,187.26 L16.07,185.77 L15.92,184.26 L15.82,182.77 L15.75,181.28 L15.72,179.77 L15.72,178.29 L15.8,176.77 L15.87,175.26 L16.02,173.77 L16.2,172.31 L16.4,170.83 L16.65,169.34 L16.95,167.88 L17.31,166.39 L17.66,164.93 L18.06,163.52 L18.52,162.11 L19.0,160.67 L19.5,159.26 L20.08,157.85 L20.66,156.41 L21.26,155.05 L21.84,153.66 L22.45,152.3 L23.05,150.92 L23.63,149.53 L24.24,148.17 L24.82,146.79 L25.42,145.4 L25.95,143.99 L26.45,142.58 L26.93,141.14 L27.34,139.7 L27.72,138.24 L28.07,136.78 L28.35,135.32 L28.6,133.83 L28.8,132.35 L28.98,130.86 L29.08,129.35 L29.15,127.86 L29.2,126.35 L29.18,124.86 L29.13,123.35 L29.03,121.86 L28.87,120.35 L28.7,118.86 L28.47,117.38 L28.19,115.92 L27.87,114.45 L27.51,112.99 L27.11,111.56 L26.66,110.12 L26.18,108.68 L25.65,107.27 L25.07,105.89 L24.49,104.5 L23.88,103.11 L23.28,101.75 L22.7,100.37 L22.1,98.98 L21.49,97.62 L20.91,96.23 L20.31,94.85 L19.73,93.44 L19.17,92.0 L18.69,90.59 L18.24,89.18 L17.81,87.77 L17.43,86.33 L17.08,84.84 L16.75,83.36 L16.48,81.87 L16.25,80.41 L16.05,78.95 L15.9,77.46 L15.8,75.95 L15.72,74.44 L15.67,72.92 L15.69,71.44 L15.75,69.95 L15.82,68.46 L15.95,66.95 L16.12,65.46 L16.35,63.98 L16.6,62.49 L16.88,61.03 L17.23,59.57 L17.58,58.11 L18.01,56.67 L18.47,55.23 L18.95,53.82 L19.47,52.41 L20.05,51.03 L20.63,49.64 L21.29,48.3 L21.94,46.94 L22.65,45.63 L23.41,44.32 L24.19,43.04 L24.99,41.78 L25.83,40.54 L26.71,39.31 L27.61,38.12 L28.55,36.94 L29.5,35.78 L30.49,34.67 L31.52,33.56 L32.58,32.48 L33.64,31.44 L34.75,30.41 L35.88,29.43 L37.01,28.47 L38.2,27.54 L39.41,26.63 L40.62,25.77 L41.88,24.92 L43.14,24.11 L44.42,23.36 L45.73,22.6 L47.04,21.89 L48.4,21.24 L49.77,20.61 L51.13,20.0 L52.54,19.42 L53.92,18.92 L55.33,18.42 L56.77,17.99 L58.23,17.56 L59.67,17.21 L61.16,16.85 L62.62,16.58 L64.08,16.32 L65.57,16.12 L67.08,15.95 L68.56,15.82 L70.08,15.72 L71.56,15.69 L73.05,15.67 L74.56,15.72 L76.05,15.8 L77.59,15.92 L79.05,16.07 L80.51,16.27 L82.0,16.5 L83.48,16.78 L84.94,17.11 L86.43,17.46 L87.87,17.84 L89.28,18.27 L90.69,18.72 L92.13,19.22 L93.54,19.75 L94.95,20.36 L96.33,20.94 L97.72,21.54 L99.11,22.12 L100.47,22.73 L101.85,23.33 L103.24,23.91 L104.6,24.51 L105.99,25.09 L107.4,25.67 L108.81,26.2 L110.22,26.68 L111.66,27.11 L113.12,27.51 L114.55,27.87 L116.02,28.17 L117.5,28.45 L118.99,28.67 L120.48,28.85 L121.99,29.0 L123.48,29.1 L124.99,29.15 L126.47,29.15 L127.99,29.13 L129.47,29.03 L130.98,28.9 L132.47,28.75 L133.96,28.52 L135.44,28.27 L136.91,27.99 L138.37,27.64 L139.8,27.26 L141.24,26.83 L142.68,26.38 L144.09,25.85 L145.5,25.3 L146.89,24.72 L148.27,24.11 L149.66,23.53 L151.02,22.93 L152.4,22.32 L153.77,21.74 L155.15,21.14 L156.54,20.53 L157.95,19.95 L159.36,19.4 L160.77,18.87 L162.21,18.39 L163.62,17.96 L165.03,17.56 L166.49,17.18 L167.98,16.85 L169.47,16.55 L170.93,16.3 L172.41,16.1 L173.88,15.92 L175.39,15.8 L176.9,15.69 L178.41,15.64 L179.9,15.64 L181.38,15.67 L182.87,15.75 L184.38,15.85 L185.87,16.0 L187.36,16.2 L188.84,16.43 L190.31,16.7 L191.77,17.03 L193.25,17.38 L194.69,17.76 L196.13,18.21 L197.56,18.67 L198.95,19.17 L200.36,19.73 L201.75,20.33 L203.11,20.94 L204.47,21.59 L205.78,22.3 L207.11,23.0 L208.4,23.78 L209.66,24.57 L210.92,25.4 L212.15,26.25 L213.36,27.14 L214.55,28.07 L215.71,29.0 L216.84,29.98 L217.95,30.99 L219.06,32.02 L220.12,33.11 L221.15,34.19 L222.13,35.3 L223.12,36.43 L224.07,37.62 L224.98,38.8 L225.86,40.01 L226.72,41.25 L227.55,42.51 L228.33,43.77 L229.09,45.08 L229.79,46.39 L230.5,47.72 L231.15,49.08 L231.76,50.45 L232.34,51.83 L232.89,53.24 L233.37,54.65 L233.85,56.07 L234.28,57.5 L234.66,58.96 L235.01,60.42 L235.34,61.89 L235.59,63.35 L235.82,64.83 L236.02,66.32 L236.17,67.83 L236.27,69.35 L236.32,70.81 L236.35,72.32 L236.35,73.81 L236.27,75.32 L236.17,76.83 L236.04,78.32 L235.87,79.78 L235.64,81.27 L235.39,82.75 L235.09,84.21 L234.76,85.7 L234.38,87.16 L233.98,88.57 L233.52,89.98 L233.04,91.42 L232.52,92.83 L231.96,94.24 L231.36,95.65 L230.78,97.04 L230.17,98.43 L229.59,99.79 L228.99,101.17 L228.38,102.56 L227.8,103.92 L227.2,105.31 L226.62,106.69 L226.06,108.1 L225.56,109.51 L225.11,110.95 L224.7,112.39 L224.33,113.85 L224.0,115.31 L223.7,116.77 L223.44,118.26 L223.24,119.75 L223.09,121.23 L222.99,122.74 L222.91,124.23 L222.89,125.74 L222.89,127.23 L222.96,128.74 L223.07,130.23 L223.19,131.74 L223.39,133.23 L223.62,134.71 L223.9,136.18 L224.22,137.64 L224.58,139.1 L224.98,140.54 L225.43,141.97 L225.94,143.41 L226.47,144.82 L227.05,146.21 L227.63,147.59 L228.23,148.95 L228.84,150.34 L229.42,151.72 L230.02,153.09 L230.63,154.47 L231.21,155.86 L231.81,157.24 L232.39,158.65 L232.92,160.09 L233.42,161.5 L233.88,162.91 L234.28,164.32 L234.68,165.76 L235.04,167.25 L235.34,168.73 L235.62,170.22 L235.84,171.68 L236.04,173.14 L236.19,174.63 L236.3,176.14 L236.37,177.66 L236.4,179.17 L236.4,180.65 L236.35,182.14 L236.25,183.63 L236.09,185.14 L235.92,186.63 L235.72,188.11 L235.46,189.6 L235.16,191.06 L234.83,192.52 L234.46,193.98 L234.03,195.42 L233.57,196.86 L233.1,198.27 L232.57,199.65 L231.99,201.07 L231.38,202.43 L230.75,203.79 L230.07,205.12 L229.37,206.46 L228.61,207.74 L227.83,209.03 L227.02,210.31 L226.19,211.55 L225.31,212.76 L224.4,213.97 L223.47,215.13 L222.51,216.29 L221.5,217.4 L220.5,218.5 Z" />
              </g>
            </g>
          </g>

          <svg
            x="60"
            y="60"
            width="130"
            height="130"
            viewBox="0 0 24 24"
            className="fill-base-100"
          >
            <path d="M7.18,19.83Q6,18.65 6,17t1.18-2.83T10,13q0.58,0 1.06,0.14T12,13.55V3h6V7H14V17q0,1.65-1.17,2.82T10,21T7.18,19.83Z" />
          </svg>
        </svg>
      </div>
    </div>
  );
}
