"use client";

import { useEffect, useState } from "react";
import { HandFist, Contact, ArrowRight, BriefcaseBusiness } from "lucide-react";
import Hero from "./components/Hero";
import SpotifyCard from "./components/SpotifyCard";
import Image from 'next/image'

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

const steps = [
  {
    title: "Fortnite Status bot",
    description:
      "A Discord bot that can fetch Fortnite stats like users stats, game news, And more.",
    modalText:
      "A Discord bot that can fetch Fortnite stats like users stats, game news, And more.",
  },
  {
    title: "Ev.io Status bot",
    description:
      "Discord bot that fetches and shows users stats to a Discord bot.",
    modalText:
      "There used to be a active FPS shooter game that got me into coding. which made me got very info API fetching to the point I made 2 versions of the game bot but each got better and advanced code other time.",
  },
];

function Squircle({ children, size = 56, style = {} }) {
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

function getLocalTimeDifference(baseHour = 0, baseMinute = 0) {
  const now = new Date();

  const yourTimeZone = "America/New_York";

  const yourDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: yourTimeZone,
    })
  );

  yourDate.setHours(baseHour, baseMinute, 0, 0);

  const visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const visitorTime = new Intl.DateTimeFormat("en-US", {
    timeZone: visitorTimeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(yourDate);

  return `My ${formatTime(
    baseHour,
    baseMinute
  )} is your ${visitorTime} | UTC-4`;
}

function formatTime(hour, minute) {
  const date = new Date();
  date.setHours(hour, minute);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function Home() {
  const [hour, setHour] = useState(19);
  useEffect(() => setHour(new Date().getHours()), []);
  const greeting =
    hour < 5
      ? "Still up?"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 21
            ? "Good evening"
            : "Good night";
  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: tokens.bg,
        color: tokens.textPrimary,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      className="px-4 py-8 md:px-12 md:py-14 w-full max-w-full overflow-hidden"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        .display-font { font-family: 'Space Grotesk', system-ui, sans-serif; }

        @keyframes blobDrift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes blobDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-25px, 25px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rise-1 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) both; }
        .rise-2 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) 0.08s both; }
        .rise-3 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) 0.16s both; }
        .rise-4 { animation: riseIn 0.6s cubic-bezier(.2,.8,.2,1) 0.24s both; }

        .m3-btn {
          transition: transform 0.18s cubic-bezier(.2,.8,.2,1), filter 0.18s ease, background 0.18s ease;
        }
        .m3-btn:hover { transform: scale(1.035); filter: brightness(1.08); }
        .m3-btn:active { transform: scale(0.96); }

        .card-hover {
          transition: transform 0.25s cubic-bezier(.2,.8,.2,1), border-color 0.25s ease;
        }
        .card-hover:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.18); }
      `}</style>

      {/* ambient dynamic-color blobs */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-8%",
          width: 420,
          height: 420,
          borderRadius: "9999px",
          background: tokens.lime,
          opacity: 0.16,
          filter: "blur(90px)",
          animation: "blobDrift 14s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: 460,
          height: 460,
          borderRadius: "9999px",
          background: tokens.lavender,
          opacity: 0.14,
          filter: "blur(100px)",
          animation: "blobDrift2 16s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <section className="mb-10 rise-1">
          <h1
            className="display-font text-center mt-6 text-4xl md:text-5xl"
            style={{
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {greeting}
          </h1>

          <Hero />

          <div className="flex flex-wrap justify-center gap-3">
            <div className="join gap-2">
              <a
                style={{
                  background: tokens.surface,
                  backdropFilter: "blur(20px)",
                }}
                className="btn btn-ghost p-6 rounded-r-md rounded-l-[28px] join-item btn-active"
              >
                This page
              </a>

              <a
                href="/other"
                style={{
                  background: tokens.surface,
                  backdropFilter: "blur(20px)",
                }}
                className="btn btn-ghost p-6 rounded-l-md rounded-r-[28px] join-item"
              >
                Misc stuff
              </a>
            </div>
          </div>
        </section>

        {/* Cards */}
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          {/* Status */}
          <div
            className="p-6 card-hover rise-2"
            style={{
              borderRadius: 28,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="display-font text-2xl"
                  style={{ fontWeight: 600 }}
                >
                  <span className="text-rotate w-full">
                    <span>
                      <span className="display-font flex items-center gap-0.5 text-2xl"><img src="/wave-car.gif" alt="" className="h-7 w-auto object-contain"/><span>Hellur,</span></span>
                      <span className="display-font text-2xl">Hey,</span>
                      <span className="display-font text-2xl">Yo,</span>
                      <span className="display-font flex items-center gap-0.5 text-2xl"><img src="/wave-car-2.gif" alt="" className="h-7 w-auto object-contain"/></span>
                    </span>
                  </span>
                  <br /> I'm Iminthebibleson
                </h2>

                <ul className="mt-2 list-disc list-inside">
                  <li>I code shit for fun</li>
                  <li>I speak both English and Spanish</li>
                  <li>Ecuadorian, 18+</li>
                </ul>

                <div
                  className="mt-4 text-sm"
                  style={{ color: tokens.textSecondary }}
                >
                  {getLocalTimeDifference(0, 0)}
                </div>
              </div>
              <div className="absolute top-6 right-6">
                <Squircle size={60} style={{ background: tokens.limeDark }}>
                  <HandFist size={26} color={tokens.lavender} />
                </Squircle>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="p-6 card-hover rise-3 md:row-span-2"
            style={{
              borderRadius: 28,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              backdropFilter: "blur(20px)",
            }}
          >
            <h2
              className="display-font text-2xl mb-5"
              style={{ fontWeight: 600 }}
            >
              Socials
            </h2>

            <div className="flex flex-wrap gap-3">
              <div className="join gap-2 w-full join-vertical mt-5">
                <a
                  href="https://discord.com/users/842366854697189447"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-b-md rounded-t-[28px] join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Discord</title>
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>{" "}
                  Discord
                </a>
                <a
                  href="https://github.com/iminthebibleson"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-md join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>{" "}
                  Github
                </a>
                <a
                  href="https://www.last.fm/user/iminthebibleson"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-md join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Last.fm</title>
                    <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.285 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.63-3.931l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.869.907 1.869 1.704 0 1.017-.99 1.43-2.86 1.43-2.776 0-3.93-1.457-4.59-3.464l-.907-2.75c-1.155-3.573-2.997-4.893-6.653-4.893C2.144 5.333 0 7.89 0 12.233c0 4.18 2.144 6.434 5.993 6.434 3.106 0 4.591-1.457 4.591-1.457z" />
                  </svg>{" "}
                  Last.fm
                </a>
                <a
                  href="https://www.youtube.com/@iminthebib"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-t-md rounded-b-[28px] join-item"
                >
                  {" "}
                  <svg
                    className="size-6 fill-current "
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>YouTube</title>
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Youtube{" "}
                </a>
              </div>
            </div>

            <div className="absolute top-6 right-6">
              <Squircle size={60} style={{ background: tokens.limeDark }}>
                <Contact size={26} color={tokens.lavender} />
              </Squircle>
            </div>
          </div>

          {/* temp */}
          <SpotifyCard />

          {/* Battery */}
          <div
            className="p-7 card-hover rise-4 md:col-span-2"
            style={{
              borderRadius: 28,
              background: tokens.surface,
              border: `1px solid ${tokens.surfaceBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div className="w-full">
              <h2
                className="display-font text-2xl mb-4"
                style={{ fontWeight: 600 }}
              >
                Projects
              </h2>

              <div className="absolute top-6 right-6">
                <Squircle size={60} style={{ background: tokens.limeDark }}>
                  <BriefcaseBusiness size={26} color={tokens.lavender} />
                </Squircle>
              </div>

              <div className="join gap-2 w-full join-vertical mt-5">
                {steps.map((item, index) => (
                  <div key={index}>
                    <button
                      onClick={() =>
                        (
                          document.getElementById(
                            `modal_${index}`
                          ) as HTMLDialogElement
                        )?.showModal()
                      }
                      style={{
                        background: tokens.surface,
                        backdropFilter: "blur(20px)",
                      }}
                      className={`
  btn btn-ghost p-10 md:p-8 join-item w-full
  flex items-center justify-between
  text-left
  ${index === 0
                          ? "rounded-t-[28px] rounded-b-md"
                          : index === steps.length - 1
                            ? "rounded-t-md rounded-b-[28px]"
                            : "rounded-md"
                        }
`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-base font-medium">
                          {item.title}
                        </span>

                        <span className="text-sm opacity-60 font-normal">
                          {item.description}
                        </span>
                      </div>

                      <ArrowRight size={22} className="opacity-60" />
                    </button>

                    <dialog id={`modal_${index}`} className="modal">
                      <div
                        className="modal-box"
                        style={{
                          borderRadius: 28,
                          background: tokens.surface,
                          border: `1px solid ${tokens.surfaceBorder}`,
                          backdropFilter: "blur(20px)",
                        }}
                      >
                        <h3 className="font-bold text-lg">{item.title}</h3>

                        <p className="py-4">{item.modalText}</p>

                        <div className="modal-action">
                          <form method="dialog">
                            <button
                              style={{
                                background: tokens.surface,
                                backdropFilter: "blur(20px)",
                              }}
                              className="btn btn-ghost p-6 rounded-[28px]"
                            >
                              Close
                            </button>
                          </form>
                        </div>
                      </div>
                    </dialog>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="p-7 card-hover rise-4 md:col-span-2"
            style={{
              borderRadius: 28,
              background: `linear-gradient(135deg, ${tokens.lavenderDark} 0%, ${tokens.limeDark} 120%)`,
              border: `1px solid ${tokens.surfaceBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div className="flex-row md:flex items-center justify-between w-full">
              <h2
                className="display-font md:text-left text-center md:mb-0 mb-4 text-2xl"
                style={{ fontWeight: 600 }}
              >
                Contacts
                <div
                  className=" text-sm"
                  style={{ color: tokens.textSecondary }}
                >
                  Thanks to{" "}
                  <a href="https://lamp.delivery" className="link ">
                    Lamp.delivery
                  </a>{" "}
                  for the UI Idea!
                </div>
              </h2>

              <div className="flex flex-wrap justify-center items-center gap-2 ">
                <a
                  href="https://discord.com/users/842366854697189447"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-r-md rounded-l-[28px] join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Discord</title>
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/iminthebibleson"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-md join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
                <a
                  href="https://www.last.fm/user/iminthebibleson"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-md join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Last.fm</title>
                    <path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.649-3.244-4.288 0-3.382 1.704-4.591 3.381-4.591 2.42 0 3.189 1.567 3.849 3.574l.88 2.749c.88 2.666 2.529 4.81 7.285 4.81 3.409 0 5.718-1.044 5.718-3.793 0-2.227-1.265-3.381-3.63-3.931l-1.758-.385c-1.21-.275-1.567-.77-1.567-1.595 0-.934.742-1.484 1.952-1.484 1.32 0 2.034.495 2.144 1.677l2.749-.33c-.22-2.474-1.924-3.492-4.729-3.492-2.474 0-4.893.935-4.893 3.932 0 1.87.907 3.051 3.189 3.601l1.87.44c1.402.33 1.869.907 1.869 1.704 0 1.017-.99 1.43-2.86 1.43-2.776 0-3.93-1.457-4.59-3.464l-.907-2.75c-1.155-3.573-2.997-4.893-6.653-4.893C2.144 5.333 0 7.89 0 12.233c0 4.18 2.144 6.434 5.993 6.434 3.106 0 4.591-1.457 4.591-1.457z" />
                  </svg>
                </a>
                <a
                  href="mailto:iminthebibleson@gmail.com"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-md join-item"
                >
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Gmail</title>
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@iminthebib"
                  style={{
                    background: tokens.surface,
                    backdropFilter: "blur(20px)",
                  }}
                  className="btn btn-ghost p-6 rounded-l-md rounded-r-[28px] join-item"
                >
                  {" "}
                  <svg
                    className="size-6 fill-current"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>YouTube</title>
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
