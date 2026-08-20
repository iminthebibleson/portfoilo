import { useRef, useEffect } from "react";

export default function Topography({
  palette = ["#FF5E1216", "#FF9A2028", "#FFCE3A3C", "FFE06A66", "#FFB0AAA8", "#FFD6D2DO", "#FFF2F0EE"],
  background = "transparent",
  lineCount = 15,
  speed = 0.5,
  animated = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let width, height;

    function mulberry32(a) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const initSeed = Math.floor(Math.random() * 1e9);
    const rand = mulberry32(initSeed);

    const noiseSeed = rand() * 10000;
    const seedX = rand() * 1000;
    const seedY = rand() * 1000;

    function hash(x, y) {
      const s = Math.sin(x * 127.1 + y * 311.7 + noiseSeed) * 43758.5453123;
      return s - Math.floor(s);
    }
    function smooth(t) {
      return t * t * (3 - 2 * t);
    }
    function noise(x, y) {
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const sx = smooth(x - x0);
      const sy = smooth(y - y0);
      const n00 = hash(x0, y0);
      const n10 = hash(x0 + 1, y0);
      const n01 = hash(x0, y0 + 1);
      const n11 = hash(x0 + 1, y0 + 1);
      const ix0 = n00 + (n10 - n00) * sx;
      const ix1 = n01 + (n11 - n01) * sx;
      return ix0 + (ix1 - ix0) * sy;
    }
    function fbm(x, y) {
      let total = 0,
        amp = 1,
        freq = 1,
        maxAmp = 0;
      for (let o = 0; o < 4; o++) {
        total += noise(x * freq, y * freq) * amp;
        maxAmp += amp;
        amp *= 0.5;
        freq *= 2;
      }
      return total / maxAmp;
    }

    const bandColors = [];
    const bandWidths = [];
    for (let i = 0; i < lineCount; i++) {
      bandColors.push(palette[Math.floor(rand() * palette.length)]);
      // mostly thin lines, occasional bold "index contour" like real topo maps
      bandWidths.push(rand() < 0.15 ? 2.6 + rand() * 1.4 : 0.8 + rand() * 0.9);
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let t = 0;
    const cell = 3;

    function draw() {
      resize();
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const cols = Math.ceil(width / cell) + 1;
      const rows = Math.ceil(height / cell) + 1;
      const field = new Float32Array(cols * rows);

      const scale = 0.007;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = (x * cell + seedX * 100) * scale;
          const ny = (y * cell + seedY * 100) * scale;
          const v =
            fbm(nx, ny + t * 0.1) +
            fbm(nx * 2.3 + 5.2, ny * 2.3 - 3.1 + t * 0.05) * 0.3;
          field[y * cols + x] = v;
        }
      }

      for (let band = 0; band < lineCount; band++) {
        const threshold = (band + 0.5) / lineCount;
        ctx.strokeStyle = bandColors[band];
        ctx.lineWidth = bandWidths[band];
        ctx.beginPath();

        for (let y = 0; y < rows - 1; y++) {
          for (let x = 0; x < cols - 1; x++) {
            const a = field[y * cols + x];
            const b = field[y * cols + x + 1];
            const c = field[(y + 1) * cols + x + 1];
            const d = field[(y + 1) * cols + x];

            const state =
              (a >= threshold ? 8 : 0) |
              (b >= threshold ? 4 : 0) |
              (c >= threshold ? 2 : 0) |
              (d >= threshold ? 1 : 0);
            if (state === 0 || state === 15) continue;

            const px = x * cell;
            const py = y * cell;
            const lerp = (v0, v1) => (v1 - v0 !== 0 ? (threshold - v0) / (v1 - v0) : 0.5);

            const T = [px + lerp(a, b) * cell, py];
            const R = [px + cell, py + lerp(b, c) * cell];
            const B = [px + lerp(d, c) * cell, py + cell];
            const L = [px, py + lerp(a, d) * cell];

            const line = (p1, p2) => {
              ctx.moveTo(p1[0], p1[1]);
              ctx.lineTo(p2[0], p2[1]);
            };

            switch (state) {
              case 1:
                line(L, B);
                break;
              case 2:
                line(B, R);
                break;
              case 3:
                line(L, R);
                break;
              case 4:
                line(T, R);
                break;
              case 5: {
                const avg = (a + b + c + d) / 4;
                if (avg >= threshold) {
                  line(T, L);
                  line(B, R);
                } else {
                  line(T, R);
                  line(L, B);
                }
                break;
              }
              case 6:
                line(T, B);
                break;
              case 7:
                line(T, L);
                break;
              case 8:
                line(T, L);
                break;
              case 9:
                line(T, B);
                break;
              case 10: {
                const avg = (a + b + c + d) / 4;
                if (avg >= threshold) {
                  line(T, R);
                  line(L, B);
                } else {
                  line(T, L);
                  line(B, R);
                }
                break;
              }
              case 11:
                line(T, R);
                break;
              case 12:
                line(L, R);
                break;
              case 13:
                line(B, R);
                break;
              case 14:
                line(L, B);
                break;
              default:
                break;
            }
          }
        }
        ctx.stroke();
      }

      if (animated) {
        t += 0.01 * speed;
        raf = requestAnimationFrame(draw);
      }
    }

    draw();

    function handleResize() {
      if (!animated) draw();
    }
    window.addEventListener("resize", handleResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette.join(","), background, lineCount, speed, animated]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}