"use client";

import { useEffect, useState } from "react";
import { Clock3, ArrowLeft } from "lucide-react";

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

export default function ComingSoon() {
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
      className="px-4 py-8 md:px-12 md:py-14 w-full max-w-full overflow-hidden flex items-center justify-center"
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

      {/* ambient dynamic-color blobs, same as homepage */}
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

      <div
        style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}
        className="w-full"
      >
        <div
          className="p-8 md:p-10 card-hover rise-1 text-center"
          style={{
            borderRadius: 28,
            background: tokens.surface,
            border: `1px solid ${tokens.surfaceBorder}`,
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex justify-center mb-5">
            <Squircle size={68} style={{ background: tokens.limeDark }}>
              <Clock3 size={30} color={tokens.lavender} />
            </Squircle>
          </div>

          <h1
            className="display-font text-4xl md:text-5xl"
            style={{
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Coming soon
          </h1>

          <p className="mt-4" style={{ color: tokens.textSecondary }}>
            Still making this page so for now just sit and wait ig
          </p>

          <div className="mt-8 flex justify-center rise-2">
            <a
              href="/"
              style={{
                background: tokens.surface,
                backdropFilter: "blur(20px)",
              }}
              className="btn btn-ghost m3-btn p-6 rounded-[28px] gap-2"
            >
              <ArrowLeft size={18} />
              Go back
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
