"use client";

import { useEffect, useState } from "react";
import { Shape } from "@/components/expressive/shape";

type AndroidShapeConfig = {
  id: number;
  shapeName: string;
  top: number;
  left: number;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  color: string;
  spinDirection: 1 | -1;
  spinDuration: number;
};

interface AndroidScatterProps {
  count?: number;
  sizeRange?: [number, number];
  colors?: string[];
  className?: string;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function scatterPositions(count: number): { top: number; left: number }[] {
  const cols = Math.ceil(Math.sqrt(count * 20)); // slightly wider than tall
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return cells.slice(0, count).map(({ row, col }) => {
    const top = row * cellH + randomBetween(0.15, 0.85) * cellH;
    const left = col * cellW + randomBetween(0.15, 0.85) * cellW;
    return { top, left };
  });
}

const SHAPE_NAMES = [
  "circle",
  "square",
  "slanted",
  "arch",
  "oval",
  "pill",
  "triangle",
  "arrow",
  "fan",
  "diamond",
  "pentagon",
  "gem",
  "sunny",
  "burst",
  "boom",
  "flower",
  "puffy",
  "ghostish",
  "bun",
  "heart",
  "semi-circle",
  "clam-shell",
  "very-sunny",
  "cookie-4",
  "cookie-6",
  "cookie-7",
  "cookie-9",
  "cookie-12",
  "clover-4",
  "clover-8",
  "soft-burst",
  "soft-boom",
  "puffy-diamond",
  "pixel-circle",
  "pixel-triangle",
] as const;

function generateShapes(
  count: number,
  sizeRange: [number, number],
  colors: string[],
): AndroidShapeConfig[] {
  const positions = scatterPositions(count);

  return Array.from({ length: count }, (_, i) => {
    const leansLeft = Math.random() < 0.7;
    const rotation = leansLeft
      ? -randomBetween(10, 45)
      : randomBetween(-15, 30);

    return {
      id: i,
      shapeName: SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)],
      top: positions[i].top,
      left: positions[i].left,
      size: randomBetween(sizeRange[0], sizeRange[1]),
      rotation,
      delay: randomBetween(0, 500),
      duration: randomBetween(600, 1100),
      color: colors[Math.floor(Math.random() * colors.length)],
      spinDirection: Math.random() < 0.5 ? 1 : -1,
      spinDuration: randomBetween(8, 22), // slow, ambient — not dizzying
    };
  });
}

export default function SectionBackground({
  count = 15,
  sizeRange = [18, 42],
  colors = [
    "var(--color-primary)",
    "var(--color-primary)",
    "var(--color-secondary)",
    "var(--color-accent)",
    "var(--color-neutral)",
    "var(--color-primary)",
  ],
}: AndroidScatterProps) {
  const [shapes, setShapes] = useState<AndroidShapeConfig[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setShapes(generateShapes(count, sizeRange, colors));
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 w-full z-0 overflow-hidden transition-color! duration-400`}
      aria-hidden="true"
    >
      {shapes.map((shape) => (
        <div
          key={shape.id}
          style={{
            position: "absolute",
            top: `${shape.top}%`,
            left: `${shape.left}%`,
            width: shape.size,
            height: shape.size,
            opacity: mounted ? 0.6 : 0,
            transform: mounted ? "scale(1)" : "scale(0)",
            transition: `opacity ${shape.duration}ms ease-out ${shape.delay}ms, transform ${shape.duration}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${shape.delay}ms`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              color: shape.color,
              // @ts-expect-error
              "--start-rotate": `${shape.rotation}deg`,
              animation: mounted
                ? `${
                    shape.spinDirection === 1 ? "spin-cw" : "spin-ccw"
                  } ${shape.spinDuration}s linear infinite`
                : "none",
              transform: `rotate(${shape.rotation}deg)`,
            }}
          >
            {/* @ts-expect-error Shape name type alignment */}
            <Shape name={shape.shapeName} className="h-full w-full" />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes spin-cw {
          from {
            transform: rotate(var(--start-rotate));
          }
          to {
            transform: rotate(calc(var(--start-rotate) + 360deg));
          }
        }
        @keyframes spin-ccw {
          from {
            transform: rotate(var(--start-rotate));
          }
          to {
            transform: rotate(calc(var(--start-rotate) - 360deg));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}