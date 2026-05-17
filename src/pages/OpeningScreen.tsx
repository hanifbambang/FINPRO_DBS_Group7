import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { soundManager } from "../lib/sounds";

const OpeningScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [canInteract, setCanInteract] = useState(false);
  const [showPressEnter, setShowPressEnter] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [bgmStarted, setBgmStarted] = useState(false);

  // Start BGM on the first user interaction (click/keypress).
  // Browsers block audio autoplay until the user has interacted
  // with the page at least once — this ensures we respect that policy.
  const tryStartBGM = useCallback(() => {
    if (!bgmStarted && soundManager) {
      setBgmStarted(true);
      soundManager.playBGM("openingbgm");
    }
  }, [bgmStarted]);

  useEffect(() => {
    // Show prompt after 1.5 seconds
    const timer1 = setTimeout(() => {
      setShowPressEnter(true);
    }, 1500);

    // Allow full interaction (navigation) after 2.5 seconds
    const timer2 = setTimeout(() => {
      setCanInteract(true);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      // Ensure BGM stops if component unmounts
      if (soundManager) soundManager.stopBGM();
    };
  }, []);

  const handleContinue = useCallback(() => {
    // First interaction: just start BGM and return (don't navigate yet)
    if (!bgmStarted) {
      tryStartBGM();
      return;
    }

    // Subsequent interactions: navigate if allowed
    if (canInteract && !isStarting) {
      setIsStarting(true);
      if (soundManager) {
        soundManager.stopBGM();
        soundManager.play("gamestart");
      }
      
      // Delay navigation to let the game-start sound finish
      setTimeout(() => {
        if (user) {
          navigate("/home");
        } else {
          navigate("/login");
        }
      }, 1500);
    }
  }, [bgmStarted, canInteract, isStarting, user, navigate, tryStartBGM]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleContinue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleContinue]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer p-4 relative overflow-hidden bg-black"
      onClick={handleContinue}
    >
      {/* Animated Background */}
      <motion.div
        initial={{ scale: 1.1, x: 0 }}
        animate={{ x: ["-3%", "3%", "-3%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-0 opacity-80"
        style={{
          backgroundImage: `url('https://images4.alphacoders.com/574/thumb-1920-574726.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/20" /> {/* Dark overlay to ensure text is readable */}
      <div className="crt-overlay z-10" />

      {/* Smooth Fade to Black transition */}
      {isStarting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-black z-50 pointer-events-none"
        />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-12 z-10"
      >
        <motion.div 
          className="flex flex-col items-center"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <h1 
            className="text-6xl md:text-8xl font-pixel text-yellow-400 tracking-tighter"
            style={{ textShadow: "4px 4px 0px #3B4CCA, -2px -2px 0px #3B4CCA, 2px -2px 0px #3B4CCA, -2px 2px 0px #3B4CCA" }}
          >
            POKEMON
          </h1>
        </motion.div>

        {/* Perfect Pixel Sprite Placeholder - Pokeball */}
        <motion.div 
          initial={{ opacity: 0, rotate: -180 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 1.5, type: "spring", bounce: 0.5 }}
          className="relative w-24 h-24 bg-white rounded-full border-[8px] border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex items-center justify-center z-10"
        >
          <div className="absolute top-0 w-full h-1/2 bg-[#FF0000]" />
          <div className="absolute w-full h-[8px] bg-black" />
          <div className="absolute w-8 h-8 bg-white rounded-full border-[8px] border-black flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full border border-gray-300" />
          </div>
        </motion.div>

        <div className="h-8">
          {showPressEnter && !isStarting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className={`font-pixel text-white text-lg md:text-xl ${!canInteract ? "opacity-50" : ""}`}
            >
              {!bgmStarted ? "Click Anywhere" : "Press Enter to Start"}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OpeningScreen;
