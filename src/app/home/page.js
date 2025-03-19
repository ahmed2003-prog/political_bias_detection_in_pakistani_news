"use client";
import { motion } from "framer-motion";
import MatrixBackground from "../components/MatrixBackground";
import "../../styles/home.css"
export default function Home() {
  return (
    <main className="relative z-10 min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
      {/* Title */}
      <motion.h1
        className="text-4xl md:text-6xl font-bold tracking-wide text-center text-white-300  px-6 py-3  "
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Bias Detection Dashboard
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="mt-4 text-lg text-green-300 text-center max-w-2xl px-6 py-3 bg-black/40 backdrop-blur-md rounded-lg shadow-lg font-mono"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        style={{
          textShadow: "0 0 10px #00ff00, 0 0 20px #008000",
        }}
      >
        Visualizing bias in Pakistani news with AI-powered analysis.
      </motion.p>

      {/* Button */}
      <motion.a
        href="/dashboard"
        className="relative mt-8 px-8 py-4 rounded-lg bg-black/50 hover:bg-black/70 text-lg font-mono text-green-300 border border-green-400 shadow-lg transition-all duration-300 backdrop-blur-md overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          textShadow: "0 0 8px #00ff00, 0 0 16px #008000",
          boxShadow: "0 0 12px #00ff00, inset 0 0 12px #008000",
        }}
      >
        Explore Dashboard
        <span className="absolute inset-0 bg-transparent border-2 border-green-400 rounded-lg animate-neon-glow pointer-events-none"></span>
      </motion.a>


      <MatrixBackground />
    </main>
  );
}
