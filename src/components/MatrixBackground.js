"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function MatrixBackground() {
  const canvasRef = useRef(null);
  const pathname = usePathname();
  let drops = [];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function initMatrix() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const fontSize = 16;
      const columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
    }

    initMatrix();

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
    const fontSize = 16;

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0F0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        drops[i] += 0.4;

        // ❌ SKIP this line if the user is on /dashboard
        if (pathname !== "/dashboard" && drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
      }

      setTimeout(() => requestAnimationFrame(draw), 30);
    }

    draw();

    const handleResize = () => {
      initMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none"
      ></canvas>
    </div>
  );
}
