"use client";
import { useEffect, useState } from "react";

const tokens = {
    surface: "rgba(255,255,255,0.055)",
    surfaceBorder: "rgba(255,255,255,0.09)",
    textPrimary: "#ECE6F0",
    textSecondary: "#9C96A5",
    fallbackA: "#C6FF6B",
    fallbackB: "#CBB8FF",
};

export default function Greeting() {
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
        
    );
}
