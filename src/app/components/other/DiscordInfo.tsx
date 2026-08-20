import { useState, useEffect, useRef } from "react";

/**
 * DiscordInfo
 *
 * Renders a Discord-style username row using Lanyard
 * (https://github.com/Phineas/lanyard) — avatar (with avatar
 * decoration if set), a live status dot, nameplate background behind
 * the username, and current custom status / activity text. Updates
 * in real time over Lanyard's websocket, with an initial REST fetch
 * so it isn't blank while the socket connects.
 *
 * Requirement: the Discord account must have joined the Lanyard
 * Discord server (https://discord.gg/lanyard) — Lanyard can only see
 * presence for members of that server.
 */
export default function DiscordInfo({}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const discordId = "842366854697189447";

  useEffect(() => {
    if (!discordId) return;
    let cancelled = false;

    fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.success) {
          setError("Couldn't find that Discord user on Lanyard.");
          return;
        }
        setData(json.data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't reach Lanyard.");
      });

    // Live updates over websocket
    const socket = new WebSocket("wss://api.lanyard.rest/socket");
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.op) {
        case 1: // hello — start heartbeat, then subscribe
          heartbeatRef.current = setInterval(() => {
            socket.readyState === 1 && socket.send(JSON.stringify({ op: 3 }));
          }, msg.d.heartbeat_interval);
          socket.send(
            JSON.stringify({ op: 2, d: { subscribe_to_id: discordId } })
          );
          break;
        case 0: // event — initial state or presence update
          if (!cancelled && msg.d) setData(msg.d);
          break;
        default:
          break;
      }
    };
    socket.onerror = () => {
      if (!cancelled) setError((prev) => prev || "Live connection failed.");
    };

    return () => {
      cancelled = true;
      clearInterval(heartbeatRef.current);
      socket.close();
    };
  }, [discordId]);

  if (error && !data) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-[#2b2d31] px-3 py-2 text-sm text-[#f23f42]">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-[#2b2d31] px-3 py-2">
        <div className="h-9 w-9 animate-pulse rounded-full bg-[#3f4147]" />
        <div className="h-3 w-24 animate-pulse rounded bg-[#3f4147]" />
      </div>
    );
  }

  const user = data.discord_user;
  const status = data.discord_status || "offline";

  const statusColors = {
    online: "#23a55a",
    idle: "#f0b232",
    dnd: "#f23f42",
    offline: "#80848e",
  };

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
        user.avatar.startsWith("a_") ? "gif" : "png"
      }?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${
        (BigInt(user.id) >> 22n) % 6n
      }.png`;

  const decorationUrl = user.avatar_decoration_data
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128`
    : null;

  // Nameplate — Discord's animated background behind the username.
  // Lanyard passes it through on user.collectibles.nameplate when set.
  const nameplate = user.collectibles?.nameplate;
  const nameplateVideoUrl = nameplate
    ? `https://cdn.discordapp.com/assets/collectibles/${nameplate.asset}asset.webm`
    : null;
  const nameplatePosterUrl = nameplate
    ? `https://cdn.discordapp.com/assets/collectibles/${nameplate.asset}static.png`
    : null;

  // Prefer a custom status (activity type 4) if set, else name an
  // activity, else fall back to the online-state label. Game/stream/
  // watch/compete (0,1,3,5) take priority over listening (2, Spotify) —
  // listening only shows if there's no game activity running.
  const customStatus = data.activities?.find((a) => a.type === 4);
  const playingActivity = data.activities?.find(
    (a) => a.type === 0 || a.type === 1 || a.type === 3 || a.type === 5
  );
  const listeningActivity = data.activities?.find((a) => a.type === 2);
  const otherActivity = playingActivity || listeningActivity;

  const activityVerb = {
    0: "Playing",
    1: "Streaming",
    2: "Listening to",
    3: "Watching",
    5: "Competing in",
  }[otherActivity?.type];

  // Resolve a game's icon from its Rich Presence assets, when present.
  // Not every game ships one — in that case this stays null and the
  // icon is just skipped.
  function getActivityImageUrl(activity) {
    const img = activity?.assets?.large_image;
    if (!img) return null;
    if (img.startsWith("mp:")) {
      return `https://media.discordapp.net/${img.slice(3)}`;
    }
    if (img.startsWith("spotify:")) {
      return `https://i.scdn.co/image/${img.slice(8)}`;
    }
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`;
  }
  const activityIconUrl = otherActivity ? getActivityImageUrl(otherActivity) : null;

  // Custom status emoji — can be a unicode emoji (just `name`) or a
  // custom server emoji (`id` + optional `animated`), which resolves
  // to Discord's emoji CDN.
  const statusEmoji = customStatus?.emoji;
  const statusEmojiUrl = statusEmoji?.id
    ? `https://cdn.discordapp.com/emojis/${statusEmoji.id}.${
        statusEmoji.animated ? "gif" : "png"
      }`
    : null;

  const statusLabel = {
    online: "Online",
    idle: "Idle",
    dnd: "Do not disturb",
    offline: "Offline",
  }[status];

  // Second half of the line — custom status text if set, else the
  // plain online/idle/dnd/offline label.
  const statusText = customStatus?.state || statusLabel;

  return (
    <div className="flex items-center gap-3 rounded-lg  px-3 py-2 transition-colors">
      {nameplate && (
        <video
          src={nameplateVideoUrl}
          poster={nameplatePosterUrl}
          autoPlay
          loop
          muted
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: 0.9,
            maskImage: "linear-gradient(to right, black 45%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 45%, transparent 100%)",
          }}
        />
      )}
      <div className="relative shrink-0 scale-140" style={{ width: 40, height: 40 }}>
        <img
          src={avatarUrl}
          alt={user.username}
          className="h-9 w-9 rounded-full object-cover"
        />
        {decorationUrl && (
          <img
            src={decorationUrl}
            alt=""
            className="pointer-events-none absolute -inset-1 h-12 w-12"
          />
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 block rounded-full"
          style={{
            width: 14,
            height: 14,
            background: statusColors[status],
            boxShadow: "0 0 0 3px #2b2d31",
          }}
        />
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-md">
        {nameplate && (
          <>
            <div
              className="pointer-events-none absolute inset-0"
              
            />
          </>
        )}
        <div className="relative min-w-0 px-3">
          <p className="truncate text-sm font-medium text-white">
            {user.global_name || user.username}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-[#b5bac1]">
            {statusEmoji ? (
              statusEmojiUrl ? (
                <img
                  src={statusEmojiUrl}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0"
                />
              ) : (
                <span className="shrink-0">{statusEmoji.name}</span>
              )
            ) : (
              activityIconUrl && (
                <img
                  src={activityIconUrl}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0 rounded-sm"
                />
              )
            )}
            {otherActivity && (
              <>
                <span className="truncate">
                  {activityVerb} {otherActivity.name}
                </span>
                <span className="shrink-0">•</span>
              </>
            )}
            <span className="truncate">{statusText}</span>
          </p>
        </div>
      </div>
    </div>
  );
}