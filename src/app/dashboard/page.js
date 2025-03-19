"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "../../../styles/spinner.css";
import MatrixBackground from "../../components/MatrixBackground";

export default function Dashboard() {
  const [dropSpeed, setDropSpeed] = useState(1);
  const [inputText, setInputText] = useState("");
  const [biasScore, setBiasScore] = useState(0);
  const [biasClass, setBiasClass] = useState("");
  const [biasDetails, setBiasDetails] = useState("");
  const [biasResult, setBiasResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("");
  const [bgChanged, setBgChanged] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const analyzeBias = async (newsText) => {
    if (!newsText.trim()) return;

    setBiasResult(null);
    setProgress(0);
    setBiasScore(0);
    setBiasClass("");
    setBiasDetails("");
    setLoadingText("Analyzing keywords...");
    setShowModal(true);

    try {
      console.log("Sending request to API...");
      const response = await fetch("http://127.0.0.1:8000/analyze_news_bias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news_text: newsText }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      const data = await response.json();
      console.log("Full API Response:", data);

      if (!data.bias_analysis) {
        console.error("Unexpected API response format:", data);
        setLoadingText("Error: Unexpected response format.");
        return;
      }

      const biasScore = data.bias_analysis.bias_score ?? 0;
      const biasClass = data.bias_analysis.bias_classification ?? "Unknown";
      const biasLabel = data.bias_analysis.bias_label ?? "No details available.";

      console.log("Bias Score:", biasScore);
      console.log("Bias Classification:", biasClass);
      console.log("Bias Label:", biasLabel);

      setLoadingText("Processing bias score...");

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 5;
        setProgress(currentProgress);

        if (currentProgress >= biasScore) {
          clearInterval(interval);
          setProgress(biasScore);
          setBiasScore(biasScore);
          setBiasClass(biasClass);
          setBiasDetails(biasLabel);

          setTimeout(() => {
            setLoadingText("Analysis complete!");
            setBiasResult({ biasScore, biasClass, biasLabel });
            setShowModal(false);
          }, 500);
        }
      }, 50);
    } catch (error) {
      console.error("Error:", error);
      setLoadingText("Failed to analyze.");
    }
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-black">
          <div className="spinner"></div>
        </div>
      );
    }
  };

  return (
    <main
      className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-6 transition-colors duration-1000 ${
        bgChanged
          ? "bg-gradient-to-br from-black via-[#013220] to-green-800 shadow-[0_0_40px_rgba(0,255,0,0.3)]"
          : "bg-black"
      }`}
    >
      <MatrixBackground dropSpeed={dropSpeed} />

      <motion.h1
        className="text-4xl md:text-6xl font-bold tracking-wide text-center text-white-600 relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onAnimationComplete={() => setBgChanged(true)}
      >
        <motion.span
          animate={{
            opacity: [1, 0.6, 1, 0.8, 1],
            textShadow: [
              "0px 0px 8px #00ff00",
              "0px 0px 12px #008000",
              "0px 0px 16px #00ff00",
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="inline-block"
        >
          Bias Detection Dashboard
        </motion.span>
      </motion.h1>

      <motion.div
        className="relative mt-8 p-6 bg-black/50 border border-green-400 rounded-lg shadow-lg backdrop-blur-md w-full max-w-3xl text-center transition-all duration-300 hover:shadow-green-500"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-2xl font-mono text-green-300">Bias Score Overview</h2>
        <motion.p
          className="mt-4 text-lg text-gray-300"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          Analyzing bias in Pakistani news articles using AI.
        </motion.p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-6 mt-4 overflow-hidden border border-green-500">
          <motion.div
            className="h-full bg-green-400"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </div>

        <motion.p
          className="text-3xl font-bold mt-2 text-green-400"
          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {biasScore}%
        </motion.p>

        {biasResult && (
          <div className="mt-4 text-left p-4 border border-green-400 bg-black/60 rounded-md">
            <p className="text-lg text-green-300 font-mono">
              <strong>Bias Classification:</strong> {biasClass}
            </p>
            <p className="text-gray-300 mt-2 font-mono">
              <strong>Bias Label:</strong> {biasDetails}
            </p>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="mt-6 px-6 py-3 rounded-lg bg-green-700 hover:bg-green-600 text-white font-mono transition-all duration-300 shadow-md hover:shadow-lg border border-green-400"
        >
          Check Bias Input
        </button>
      </motion.div>

      {/* Modal for Input */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md">
          <motion.div
            className="bg-black p-6 rounded-lg border border-green-400 shadow-lg max-w-lg w-full text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl text-green-300 font-mono">Check Bias Input</h2>

            <textarea
              placeholder="Enter a news article or headline..."
              className="mt-4 w-full p-3 text-black rounded-md font-mono border border-green-400 focus:ring-2 focus:ring-green-500"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            ></textarea>

            <div className="flex justify-center mt-4 gap-4">
              <button
                onClick={() => analyzeBias(inputText)}
                className="px-6 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-mono transition-all duration-300 shadow-md hover:shadow-lg border border-green-400"
              >
                Analyze Bias
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-mono transition-all duration-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
