"use client";
import { useState, useEffect } from "react";
import BiasTrendsChart from "../../components/BiasTrendsChart";
import "../../../styles/spinner.css";

export default function TrendAnalysis() {
  const [biasData, setBiasData] = useState(null);
  const [aggregation, setAggregation] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const url = `http://127.0.0.1:8000/bias_trends?aggregation=${aggregation}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setBiasData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [aggregation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-8 space-y-8 pt-20">
      <h1 className="text-4xl font-bold">📈 Bias Detection Trends</h1>

      {/* Aggregation Selector */}
      <select
        value={aggregation}
        onChange={(e) => setAggregation(e.target.value)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
      </select>
      
      {/* Bias Trends Chart */}
      <BiasTrendsChart biasData={biasData} />
    </div>
  );
}
