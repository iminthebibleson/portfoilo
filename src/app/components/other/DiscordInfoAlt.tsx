import { useState, useEffect, useRef } from "react";

const STATUS_COLORS = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f42",
  offline: "#80848e",
};

const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
};

const ACTIVITY_VERBS = {
  0: "Playing",
  1: "Streaming",
  2: "Listening to",
  3: "Watching",
  5: "Competing in",
};

function getActivityImageUrl(activity) {
  const img = activity?.assets?.large_image;
  if (!img) return null;

  if (img.startsWith("mp:external/")) {
    return `https://media.discordapp.net/external/${img.slice("mp:external/".length)}`;
  }
  if (img.startsWith("mp:")) {
    return `https://media.discordapp.net/${img.slice(3)}`;
  }
  if (img.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${img.slice(8)}`;
  }
  if (activity.application_id) {
    return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png?size=128`;
  }
  return null;
}

export default function DiscordInfoMain({
  discordId = "1219693783374106896",
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!discordId) return;

    let cancelled = false;
    setError("");

    fetch(`https://api.lanyard.rest/v1/users/${discordId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        if (!json?.success || !json?.data) {
          setError("Couldn't find that Discord user on Lanyard.");
          return;
        }
        setData(json.data);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't reach Lanyard.");
        }
      });

    const socket = new WebSocket("wss://api.lanyard.rest/socket");

    socket.onmessage = (event) => {
      if (cancelled) return;
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.op === 1) {
        clearInterval(heartbeatRef.current);
        const interval = msg.d?.heartbeat_interval || 30000;
        heartbeatRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ op: 3 }));
          }
        }, interval);

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              op: 2,
              d: { subscribe_to_id: discordId },
            })
          );
        }
      } else if (msg.op === 0 && msg.d) {
        setData(msg.d);
        setError("");
      }
    };

    socket.onerror = () => {
      if (!cancelled) {
        setError((prev) => prev || "Live connection failed.");
      }
    };

    return () => {
      cancelled = true;
      clearInterval(heartbeatRef.current);
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, "Component unmounted");
      }
    };
  }, [discordId]);

  if (error && !data) {
    return (
      <div
        role="alert"
        className="alert alert-error w-full rounded-box px-4 py-3 text-sm font-medium shadow-sm"
      >
        <span className="truncate">{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative w-full overflow-hidden rounded-[28px] bg-base-200/90 p-3.5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="skeleton h-12 w-12 shrink-0 rounded-[20px]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-32 max-w-full rounded-full" />
            <div className="skeleton h-3 w-24 max-w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const user = data.discord_user || {};
  const status = STATUS_COLORS[data.discord_status]
    ? data.discord_status
    : "offline";

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
        user.avatar.startsWith("a_") ? "gif" : "png"
      }?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${
        (BigInt(user.id || 0) >> 22n) % 6n
      }.png`;

  const decorationUrl = user.avatar_decoration_data?.asset
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128`
    : null;

  const rawNameplate = user.collectibles?.nameplate;
  const nameplate = Array.isArray(rawNameplate) ? rawNameplate[0] : rawNameplate;
  const nameplateAsset = nameplate?.asset?.replace(/^\/+|\/+$/g, "");
  const nameplateVideoUrl = nameplateAsset
    ? `https://cdn.discordapp.com/assets/collectibles/${nameplateAsset}/asset.webm`
    : null;
  const nameplatePosterUrl = nameplateAsset
    ? `https://cdn.discordapp.com/assets/collectibles/${nameplateAsset}/static.png`
    : null;

  const activities = Array.isArray(data.activities) ? data.activities : [];
  const customStatus = activities.find((a) => a.type === 4);
  const otherActivity =
    activities.find((a) => [0, 1, 3, 5].includes(a.type)) ||
    activities.find((a) => a.type === 2);

  const activityVerb = otherActivity ? ACTIVITY_VERBS[otherActivity.type] : null;
  const activityIconUrl = otherActivity
    ? getActivityImageUrl(otherActivity)
    : null;

  const statusEmoji = customStatus?.emoji;
  const statusEmojiUrl = statusEmoji?.id
    ? `https://cdn.discordapp.com/emojis/${statusEmoji.id}.${
        statusEmoji.animated ? "gif" : "png"
      }?size=64`
    : null;

  const statusText = customStatus?.state || STATUS_LABELS[status];

  return (
    <div
      className="group relative flex w-full flex-1 items-center overflow-hidden rounded-field rounded-b-box lg:rounded-field lg:rounded-r-box bg-base-200/95 p-3.5 shadow-sm"
      style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      {nameplateVideoUrl && (
        <>
          <video
            src={nameplateVideoUrl}
            poster={nameplatePosterUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="pointer-events-none absolute inset-0 from-base-300/75 via-base-300/55 to-base-300/40" />
        </>
      )}

      <div className="relative z-10 flex w-full min-w-0 items-center gap-3.5">
        {/* Expressive Squircle Avatar + Presence Pill */}
        <div className="relative shrink-0">
          <div className="avatar relative flex h-12 w-12 items-center justify-center">
            <div className="h-11 w-11 overflow-hidden rounded-[18px]">
              <img
                src={avatarUrl}
                alt={user.username || "Discord user"}
                className="h-full w-full object-cover"
              />
            </div>
            {decorationUrl && (
              <img
                src={decorationUrl}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="pointer-events-none absolute z-10 h-14 w-14 max-w-none object-contain"
              />
            )}
          </div>

          <span
            className="ring-base-200 absolute -bottom-0.5 -right-0.5 z-20 h-3.5 w-3.5 rounded-full ring-[3px]"
            style={{ backgroundColor: STATUS_COLORS[status] }}
            title={STATUS_LABELS[status]}
          />
        </div>

        {/* Expressive Display Name + Tonal Status Pill */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-base-content truncate text-[15px] font-bold tracking-tight">
              {user.global_name || user.username}
            </p>
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <div className="bg-base-300/80 text-base-content/85 flex min-w-0 max-w-full items-center gap-1.5 rounded-full text-xs font-medium">
              {statusEmoji ? (
                statusEmojiUrl ? (
                  <img
                    src={statusEmojiUrl}
                    alt={statusEmoji.name || ""}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="h-3.5 w-3.5 shrink-0 object-contain"
                  />
                ) : (
                  statusEmoji.name && (
                    <span className="shrink-0">{statusEmoji.name}</span>
                  )
                )
              ) : (
                activityIconUrl && (
                  <img
                    src={activityIconUrl}
                    alt={otherActivity?.name || ""}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="h-4 w-4 shrink-0 rounded-box object-cover"
                  />
                )
              )}

              {otherActivity && (
                <>
                  <span className="text-primary truncate font-semibold">
                    {activityVerb ? `${activityVerb} ` : ""}
                    {otherActivity.name}
                  </span>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}