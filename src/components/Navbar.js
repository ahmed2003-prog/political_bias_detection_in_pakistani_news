"use client"
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Trend Analysis", href: "/trend-analysis" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/5 backdrop-blur-lg border-b border-white/20 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo with Link */}
        <Link href="/">
          <h1 className="text-2xl font-bold text-green-300 cursor-pointer" style={{ textShadow: "0 0 6px #00ff00" }}>
            Bias Detection
          </h1>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8 text-lg">
          {navLinks.map(({ name, href }) => (
            <li key={name} className="relative group cursor-pointer">
              <Link href={href}>
                <span className="transition-colors duration-300 group-hover:text-gray-400">{name}</span>
              </Link>
              <motion.div
                className="absolute left-0 bottom-0 h-[2px] w-full bg-gray-400 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300"
              />
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden bg-gray-800 py-4"
        >
          <ul className="flex flex-col items-center space-y-4 text-lg">
            {navLinks.map(({ name, href }) => (
              <li key={name} className="cursor-pointer hover:text-gray-400 transition-colors duration-300">
                <Link href={href} onClick={() => setMenuOpen(false)}>{name}</Link>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
