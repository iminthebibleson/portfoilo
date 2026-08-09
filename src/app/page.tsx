"use client";

import { HandFist, Contact, BriefcaseBusiness } from "lucide-react";
import Hero from "./components/home/Hero";
import SpotifyCard from "./components/home/SpotifyCard";
import FooterList from "./components/home/FooterList";
import SocialsLinks from "./components/home/SocialsLinks";
import ProjectsList from "./components/home/ProjectsList";
import Greeting from "./components/home/Greeting";
import SectionBackground from "./components/home/SectionBackground";

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
          
          <Greeting />

          <Hero />

          <div className="flex flex-wrap justify-center gap-3">
            <div className="join gap-2">
              <a
                style={{
                  background: tokens.surface,
                  backdropFilter: "blur(20px)",
                }}
                className="btn btn-ghost p-6 rounded-r-md rounded-l-[28px] join-item btn-active btn-disabled"
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
            <SectionBackground />
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

            <SocialsLinks />

            <div className="absolute top-6 right-6">
              <Squircle size={60} style={{ background: tokens.limeDark }}>
                <Contact size={26} color={tokens.lavender} />
              </Squircle>
            </div>
          </div>

          <SpotifyCard />

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

              <ProjectsList />
              
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

            <FooterList />            

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
