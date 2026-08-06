"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

const tokens = {
  surface: "rgba(255,255,255,0.055)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  divider: "rgba(255,255,255,0.08)",
  hoverOverlay: "rgba(255,255,255,0.035)",
  textPrimary: "#ECE6F0",
  textSecondary: "#9C96A5",
  lime: "#C6FF6B",
};

const defaultItems = [
  {
    title: "Metrolist",
    subtitle: "YouTube Music client for Android",
    href: "https://github.com/mostafaalagamy/Metrolist",
  },
  {
    title: "LumiBot",
    subtitle: "Utility bot for Aliucord's Discord server",
    href: "#",
  },
];

function Row({ item, index, total }) {
  const [hovered, setHovered] = useState(false);
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <a
      href={item.href}
      target={item.href?.startsWith("http") ? "_blank" : undefined}
      rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-between px-5 py-4"
      style={{
        textDecoration: "none",
        background: hovered ? tokens.hoverOverlay : "transparent",
        borderTop: isFirst ? "none" : `1px solid ${tokens.divider}`,
        transition: "background 0.18s ease",
      }}
    >
      <div className="min-w-0 pr-4">
        <p
          className="display-font text-base truncate"
          style={{ fontWeight: 600, color: tokens.textPrimary }}
        >
          {item.title}
        </p>
        <p
          className="text-sm truncate mt-0.5"
          style={{ color: tokens.textSecondary, fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {item.subtitle}
        </p>
      </div>

      <ChevronRight
        size={20}
        color={hovered ? tokens.lime : tokens.textSecondary}
        style={{
          flexShrink: 0,
          transform: hovered ? "translateX(3px)" : "translateX(0)",
          transition: "transform 0.18s ease, color 0.18s ease",
        }}
      />
    </a>
  );
}

export default function LinkGroup({ items = defaultItems }) {
  return (
    <div
      className="rise-in w-full"
      style={{
        borderRadius: 28,
        overflow: "hidden",
        background: tokens.surface,
        border: `1px solid ${tokens.surfaceBorder}`,
        backdropFilter: "blur(20px)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .display-font { font-family: 'Space Grotesk', system-ui, sans-serif; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .rise-in { animation: riseIn 0.5s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>

      {items.map((item, i) => (
        <Row key={item.title} item={item} index={i} total={items.length} />
      ))}
    </div>
  );
}