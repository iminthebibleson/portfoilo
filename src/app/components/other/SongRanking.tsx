"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, Flame, Radio } from "lucide-react";

const LASTFM_API_KEY =
  process.env.NEXT_PUBLIC_LASTFM_API_KEY ?? "ef31cf7df2fe00d992a0a16db1377355";
const LASTFM_USER = process.env.NEXT_PUBLIC_LASTFM_USER ?? "iminthebibleson";
const NOW_PLAYING_POLL_MS = 1000;
const TOP_TRACKS_POLL_MS = 60_000;

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

type Track = {
  name: string;
  artist: string;
  playcount?: string;
  url: string;
  image: string;
};

type Spotlight = {
  name: string;
  artist: string;
  image: string;
  url: string;
  nowPlaying: boolean;
};

function pickImage(imageArr: any[]): string {
  if (!Array.isArray(imageArr)) return "";
  const large =
    imageArr.find((i) => i.size === "extralarge") ??
    imageArr[imageArr.length - 1];
  return large?.["#text"] || "";
}

export default function SongRanking() {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!LASTFM_API_KEY) {
      setError("Missing NEXT_PUBLIC_LASTFM_API_KEY");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadNowPlaying() {
      try {
        const recentRes = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=$ASTFM_USER}&limit=1&api_key=${LASTFM_API_KEY}&format=json`
        );
        const recentData = await recentRes.json();
        const recentTrack = recentData?.recenttracks?.track?.[0];
        const isNowPlaying = recentTrack?.["@attr"]?.nowplaying === "true";

        if (cancelled) return;

        if (isNowPlaying && recentTrack) {
          setSpotlight((prev) => {
            const next: Spotlight = {
              name: recentTrack.name,
              artist: recentTrack.artist?.["#text"] ?? "",
              image: pickImage(recentTrack.image),
              url: recentTrack.url,
              nowPlaying: true,
            };
            if (
              prev &&
              prev.name === next.name &&
              (prev.artist === next.artist) & prev.nowPlaying
            ) {
              return prev;
            }
            return next;
          });
        } else {
          setTopTracks((currentTop) => {
            if (currentTop.length > 0) {
              const top = currentTop[0];
              setSpotlight((prev) => {
                if (prev && !prev.nowPlaying && prev.name === top.name)
                  return prev;
                return {
                  name: top.name,
                  artist: top.artist,
                  image: top.image,
                  url: top.url,
                  nowPlaying: false,
                };
              });
            }
            return currentTop;
          });
        }

        hasLoadedOnce.current = true;
        setError(null);
      } catch (e) {
        if (!cancelled && !hasLoadedOnce.current) {
          setError("Couldn't load Last.fm data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadTopTracks() {
      try {
        const topRes = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${LASTFM_USER}&period=7day&limit=5&api_key=${LASTFM_API_KEY}&format=json`
        );
        const topData = await topRes.json();
        const tracks: Track[] = (topData?.toptracks?.track ?? []).map(
          (t: any) => ({
            name: t.name,
            artist: t.artist?.name ?? "",
            playcount: t.playcount,
            url: t.url,
            image: pickImage(t.image),
          })
        );
        if (!cancelled) setTopTracks(tracks);
      } catch (e) {}
    }

    loadTopTracks();
    loadNowPlaying();

    const nowPlayingInterval = setInterval(loadNowPlaying, NOW_PLAYING_POLL_MS);
    const topTracksInterval = setInterval(loadTopTracks, TOP_TRACKS_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(nowPlayingInterval);
      clearInterval(topTracksInterval);
    };
  }, []);

  return (
    <div className="">
      <style>{`
        @keyframes spotlightFadeIn {
          from { opacity: 0; transform: scale(1.08); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes spotlightBreathe {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .spotlight-bg {
          animation: spotlightFadeIn 0.7s cubic-bezier(.2,.8,.2,1) both,
                     spotlightBreathe 10s ease-in-out infinite 0.7s;
        }

        .m3-btn {
          transition: transform 0.18s cubic-bezier(.2,.8,.2,1), filter 0.18s ease, background 0.18s ease;
        }
        .m3-btn:active { transform: scale(0.96); }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .live-dot { animation: livePulse 1.4s ease-in-out infinite; }
      `}</style>

      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <h2 className="display-font text-2xl" style={{ fontWeight: 600 }}>
            Top tracks
          </h2>
          <div className="text-sm" style={{ color: tokens.textSecondary }}>
            Last 7 days
          </div>
        </div>
        <Squircle size={60} style={{ background: tokens.limeDark }}>
          <svg
            className="p-3 fill-current"
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Last.fm</title>
            <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.285 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.63-3.931l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.869.907 1.869 1.704 0 1.017-.99 1.43-2.86 1.43-2.776 0-3.93-1.457-4.59-3.464l-.907-2.75c-1.155-3.573-2.997-4.893-6.653-4.893C2.144 5.333 0 7.89 0 12.233c0 4.18 2.144 6.434 5.993 6.434 3.106 0 4.591-1.457 4.591-1.457z" />
          </svg>
        </Squircle>
      </div>

      {spotlight && (
        <a
          href={spotlight.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-4 p-4 mb-5 overflow-hidden"
          style={{
            borderRadius: 20,
            border: `1px solid ${tokens.surfaceBorder}`,
          }}
        >
          {/* Animated blurred album-art background, keyed so it
              crossfades whenever the track changes */}
          <div
            key={spotlight.image || spotlight.name}
            className="spotlight-bg absolute inset-0"
            style={{
              backgroundImage: spotlight.image
                ? `linear-gradient(135deg, rgba(33,26,51,0.82) 0%, rgba(27,42,14,0.82) 120%), url(${spotlight.image})`
                : `linear-gradient(135deg, ${tokens.lavenderDark} 0%, ${tokens.limeDark} 120%)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(18px) saturate(1.2)",
              transform: "scale(1.15)",
            }}
          />

          <div className="relative z-10 flex items-center gap-4 w-full">
            {spotlight.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={spotlight.image}
                alt={spotlight.name}
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
                <Flame size={24} color={tokens.lavender} />
              </Squircle>
            )}
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 text-xs mb-1"
                style={{ color: tokens.lavender }}
              >
                {spotlight.nowPlaying ? (
                  <>Playing now</>
                ) : (
                  <>
                    <Flame size={13} />
                    Current obsession
                  </>
                )}
              </div>
              <div
                className="font-medium truncate"
                style={{ color: tokens.textPrimary }}
              >
                {spotlight.name}
              </div>
              <div
                className="text-sm truncate"
                style={{ color: tokens.textSecondary }}
              >
                {spotlight.artist}
              </div>
            </div>
          </div>
        </a>
      )}

      {loading && (
        <div
          className="text-sm relative z-10"
          style={{ color: tokens.textSecondary }}
        >
          Loading scrobbles...
        </div>
      )}

      {error && (
        <div
          className="text-sm relative z-10"
          style={{ color: tokens.textSecondary }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2 relative z-10">
          {topTracks.map((track, i) => (
            <a
              key={track.url + i}
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost m3-btn p-3 h-auto justify-start rounded-2xl"
              style={{
                background: tokens.surface,
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className="flex items-center justify-center text-sm font-semibold"
                  style={{
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    color: tokens.lime,
                  }}
                >
                  {i + 1}
                </div>

                {track.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.image}
                    alt={track.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Squircle
                    size={40}
                    style={{ background: tokens.limeDark, flexShrink: 0 }}
                  >
                    <Music2 size={16} color={tokens.lavender} />
                  </Squircle>
                )}

                <div className="min-w-0 flex-1 text-left">
                  <div
                    className="font-medium truncate text-sm"
                    style={{ color: tokens.textPrimary }}
                  >
                    {track.name}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: tokens.textSecondary }}
                  >
                    {track.artist}
                  </div>
                </div>

                {track.playcount && (
                  <div
                    className="text-xs flex-shrink-0"
                    style={{ color: tokens.textSecondary }}
                  >
                    {track.playcount}x
                  </div>
                )}
              </div>
            </a>
          ))}

          {topTracks.length === 0 && (
            <div className="text-sm" style={{ color: tokens.textSecondary }}>
              No scrobbles found for this period yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
