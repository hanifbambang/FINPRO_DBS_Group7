import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DialogueBox } from "../components/DialogueBox";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTrainer } from "../context/TrainerContext";
import { soundManager } from "../lib/sounds";

export const Safari: React.FC = () => {
  const { user } = useAuth();
  const { inventory, saveInventory } = useTrainer();

  const [wildPokemon, setWildPokemon] = useState<any>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [isShaking, setIsShaking] = useState(0);
  const [catchStatus, setCatchStatus] = useState<"idle" | "success" | "fail">("idle");
  const [messages, setMessages] = useState<string[]>(["Searching tall grass..."]);
  const [mood, setMood] = useState<"neutral" | "eating" | "angry">("neutral");
  const [selectedBall, setSelectedBall] = useState<"pokeball" | "greatball" | "ultraball" | "masterball">("pokeball");
  const [activeBerry, setActiveBerry] = useState<number>(1);
  const [showItemMenu, setShowItemMenu] = useState<"none" | "balls" | "berries">("none");
  const [showPartyFullConfirm, setShowPartyFullConfirm] = useState(false);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [partyTeam, setPartyTeam] = useState<any[]>([]);

  const findWildPokemon = async () => {
    setCatchStatus("idle");
    setMood("neutral");
    setIsShaking(0);
    setActiveBerry(1);
    setMessages(["Searching tall grass..."]);
    setWildPokemon(null);

    try {
      // Pass trainerId so backend filters out already-caught Pokémon
      const res = await fetch(`/api/pokemon/random?trainerId=${user?.id || ""}`);
      const random = await res.json();

      setTimeout(() => {
        soundManager.play("encounter");
        const lvl = Math.floor(Math.random() * 91) + 10;
        setWildPokemon({ ...random, level: lvl });
        setMessages([`A wild ${random.name} (Lvl ${lvl}) appeared!`]);
      }, 1000);
    } catch (e) {
      setMessages(["Error: Biosignals lost in the grass."]);
    }
  };

  useEffect(() => {
    findWildPokemon();
  }, []);

  const ballKey = selectedBall === "pokeball" ? "pokeballs"
    : selectedBall === "greatball" ? "greatballs"
    : selectedBall === "ultraball" ? "ultraballs"
    : "masterballs";

  const throwBait = () => {
    if (!wildPokemon || isCatching || inventory.razzberries <= 0) return;
    const updated = { ...inventory, razzberries: inventory.razzberries - 1 };
    saveInventory(updated);
    setActiveBerry(1.5);
    setMood("eating");
    setMessages([`You used a RAZZ BERRY.`, `The catch rate increased!`]);
  };

  const useGoldenRazz = () => {
    if (!wildPokemon || isCatching || inventory.goldenrazz <= 0) return;
    const updated = { ...inventory, goldenrazz: inventory.goldenrazz - 1 };
    saveInventory(updated);
    setActiveBerry(2.5);
    setMood("eating");
    setMessages([`You used a GOLDEN RAZZ BERRY.`, `The catch rate significantly increased!`]);
  };

  const throwPokeball = async () => {
    if (!wildPokemon || isCatching || inventory[ballKey] <= 0) return;

    setIsCatching(true);
    soundManager.play("throw");
    setCatchStatus("idle");

    const updated = { ...inventory, [ballKey]: inventory[ballKey] - 1 };
    saveInventory(updated);

    const ballName = selectedBall.toUpperCase().replace("BALL", " BALL");
    setMessages([`You threw a ${ballName}!`]);

    setTimeout(() => setIsShaking(1), 500);

    const ballMultiplier = selectedBall === "ultraball" ? 2.0 : selectedBall === "greatball" ? 1.5 : selectedBall === "masterball" ? 1.0 : 1.0;
    const finalMultiplier = ballMultiplier * activeBerry;
    const isGuaranteed = selectedBall === "masterball";

    try {
      const res = await fetch("/api/catch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: user?.id || "1",
          pokemonId: wildPokemon.id,
          mood,
          multiplier: finalMultiplier,
          level: wildPokemon.level,
          guaranteed: isGuaranteed
        })
      });
      const data = await res.json();

      const shakes = data.success ? 3 : Math.floor(Math.random() * 3);

      for (let i = 1; i <= shakes; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsShaking(i);
        if (i < 3) setMessages([`Shake ${".".repeat(i)}`]);
      }

      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 800));
        soundManager.play("catch");
        setCatchStatus("success");
        setMessages([`Gotcha! ${wildPokemon.name} was caught!`, "Data synchronized with active party."]);
      } else {
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsShaking(0);

        if (data.code === "PARTY_FULL") {
          setPartyTeam(data.team || []);
          setShowPartyFullConfirm(true);
          setMessages(["SYSTEM ALERT: Active party is full!", "Do you want to replace a current party member?"]);
          return;
        }

        // Already own this Pokémon — auto-find a fresh encounter
        if (data.code === "ALREADY_CAUGHT") {
          setMessages([`You already have ${wildPokemon.name}!`, "Finding a different Pokémon..."]);
          setTimeout(() => findWildPokemon(), 1500);
          return;
        }

        if (data.fled) {
          soundManager.play("flee");
          setCatchStatus("fail");
          setMessages([`Oh no! ${wildPokemon.name} fled!`, data.error]);
          setTimeout(() => {
            setWildPokemon(null);
            setCatchStatus("idle");
          }, 2000);
        } else {
          setCatchStatus("idle");
          setMessages([`Oh no! The Pokémon broke free!`, "Try another ball or berry?"]);
          setActiveBerry(1);
        }
      }
    } catch (e) {
      setCatchStatus("fail");
      setMessages(["CRITICAL ERROR: Connection lost during capture."]);
    } finally {
      setIsCatching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-retro-med p-6 border-4 border-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div>
          <h2 className="font-pixel text-lg uppercase">Safari Zone</h2>
          <p className="font-mono text-[10px] opacity-70">ENCOUNTER_LATENCY: 42MS // SCANNING BIOSIGNALS</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 h-[450px]">
        {/* Safari Viewport */}
        <div className="retro-panel flex-1 bg-emerald-50 relative overflow-hidden flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            {!wildPokemon ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-16 h-16 border-4 border-dashed border-emerald-300 rounded-full animate-spin mb-4 mx-auto" />
                <p className="font-pixel text-[10px] text-emerald-800">SCANNING...</p>
              </motion.div>
            ) : (
              <motion.div
                key={wildPokemon.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="relative flex flex-col items-center"
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white font-pixel text-[8px] px-2 py-1 uppercase shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] z-20">
                  Lvl {wildPokemon.level || 5}
                </div>
                <div className="absolute -bottom-4 w-32 h-8 bg-emerald-200/50 blur-xl rounded-full -z-10" />

                <img
                  src={wildPokemon.sprite}
                  className={`w-48 h-48 pixelated transition-all duration-300 ${
                    isCatching ? "scale-0 opacity-0" : "scale-110"
                  } ${catchStatus === "success" ? "opacity-0 scale-0" : ""} ${mood === "angry" ? "brightness-75 sepia" : mood === "eating" ? "animate-bounce" : ""}`}
                />

                {isCatching && (
                  <motion.div
                    initial={{ y: -200, scale: 0.5 }}
                    animate={{
                      y: 0,
                      scale: 1,
                      rotate: isShaking > 0 ? [0, -15, 0, 15, 0] : 0
                    }}
                    transition={{ rotate: { repeat: Infinity, duration: 0.3 } }}
                    className="absolute top-1/2 -translate-y-1/2"
                  >
                    <div className={`w-12 h-12 bg-white border-4 border-black rounded-full flex flex-col overflow-hidden relative ${isShaking === 0 ? "animate-bounce" : ""}`}>
                      <div className={`h-1/2 border-b-2 border-black ${
                    catchStatus === "success" ? "bg-gray-400" :
                    selectedBall === "masterball" ? "bg-purple-600" :
                    selectedBall === "ultraball" ? "bg-yellow-400" :
                    selectedBall === "greatball" ? "bg-blue-500" :
                    "bg-red-500"
                  }`} />
                      <div className="h-1/2 bg-white" />
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full z-10 ${isShaking === 3 && catchStatus === "success" ? "bg-yellow-400 animate-ping" : ""}`} />
                    </div>
                  </motion.div>
                )}

                {catchStatus === "success" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute flex items-center justify-center -translate-y-4"
                  >
                    <Sparkles className="text-yellow-400 w-16 h-16 animate-spin" />
                  </motion.div>
                )}

                <div className="absolute top-0 right-0 p-2 bg-black/80 text-white font-pixel text-[8px] uppercase flex flex-col items-end gap-1">
                  <div>{mood === "neutral" ? "CALM" : mood === "angry" ? "ANGRY" : "EATING"}</div>
                  {activeBerry > 1 && (
                    <div className="text-yellow-400 border-t border-white/20 pt-1 mt-1">
                      +{(activeBerry * 100 - 100).toFixed(0)}% RATE
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col gap-4">
          <div className="retro-panel flex-1 screen-panel relative">
            <div className="uppercase text-[10px] font-bold border-b-2 border-black pb-2 mb-4 flex justify-between">
              <span>Safari Commands</span>
              <span className="text-emerald-600">x{inventory[ballKey]} LEFT</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Main Throw Action */}
              <button
                onClick={throwPokeball}
                disabled={!wildPokemon || isCatching || catchStatus !== "idle" || inventory[ballKey] <= 0}
                className={`flex flex-col items-center justify-center gap-3 p-6 border-4 border-black transition-all ${
                  !wildPokemon || isCatching || catchStatus !== "idle"
                  ? "bg-gray-100 opacity-50 grayscale"
                  : "bg-white hover:bg-red-50 hover:-translate-y-1 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <div className="w-12 h-12 bg-white border-4 border-black rounded-full overflow-hidden relative">
                  <div className={`h-1/2 border-b-2 border-black ${selectedBall === "masterball" ? "bg-purple-600" : selectedBall === "ultraball" ? "bg-yellow-400" : selectedBall === "greatball" ? "bg-blue-500" : "bg-red-500"}`} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-black rounded-full z-10" />
                </div>
                <div className="font-pixel text-[12px] uppercase">Throw {selectedBall}</div>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    soundManager.play("click");
                    setShowItemMenu(showItemMenu === "balls" ? "none" : "balls");
                  }}
                  disabled={isCatching}
                  className={`p-3 border-4 border-black font-pixel text-[10px] uppercase transition-all ${showItemMenu === "balls" ? "bg-black text-white" : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50"}`}
                >
                  Balls
                </button>
                <button
                  onClick={() => {
                    soundManager.play("click");
                    setShowItemMenu(showItemMenu === "berries" ? "none" : "berries");
                  }}
                  disabled={isCatching}
                  className={`p-3 border-4 border-black font-pixel text-[10px] uppercase transition-all ${showItemMenu === "berries" ? "bg-black text-white" : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50"}`}
                >
                  Berries
                </button>
              </div>

              {/* Items Overlay Menu */}
              <AnimatePresence>
                {showItemMenu !== "none" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-0 bg-white border-4 border-black p-4 z-50 flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                      <h4 className="font-pixel text-[12px] uppercase">{showItemMenu === "balls" ? "Poke Balls" : "Berries"}</h4>
                      <button onClick={() => setShowItemMenu("none")} className="text-[10px] border-2 border-black px-1 font-bold">X</button>
                    </div>

                    <div className="grid gap-2 overflow-y-auto">
                      {showItemMenu === "balls" ? (
                        <>
                          <button
                            onClick={() => { setSelectedBall("pokeball"); setShowItemMenu("none"); }}
                            className="flex items-center justify-between p-2 border-2 border-black hover:bg-gray-50"
                          >
                            <span className="font-mono text-[10px] font-bold">POKE BALL</span>
                            <span className="font-pixel text-[10px]">x{inventory.pokeballs}</span>
                          </button>
                          <button
                            onClick={() => { setSelectedBall("greatball"); setShowItemMenu("none"); }}
                            className="flex items-center justify-between p-2 border-2 border-black hover:bg-gray-50"
                          >
                            <span className="font-mono text-[10px] font-bold text-blue-600">GREAT BALL</span>
                            <span className="font-pixel text-[10px]">x{inventory.greatballs}</span>
                          </button>
                          <button
                            onClick={() => { setSelectedBall("ultraball"); setShowItemMenu("none"); }}
                            className="flex items-center justify-between p-2 border-2 border-black hover:bg-gray-50"
                          >
                            <span className="font-mono text-[10px] font-bold text-yellow-600">ULTRA BALL</span>
                            <span className="font-pixel text-[10px]">x{inventory.ultraballs}</span>
                          </button>
                          <button
                            onClick={() => { setSelectedBall("masterball"); setShowItemMenu("none"); }}
                            className="flex items-center justify-between p-2 border-2 border-black hover:bg-purple-50"
                          >
                            <span className="font-mono text-[10px] font-bold text-purple-700">MASTER BALL ✦ 100%</span>
                            <span className="font-pixel text-[10px]">x{inventory.masterballs}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { throwBait(); setShowItemMenu("none"); }}
                            className="flex items-center justify-between p-2 border-2 border-black hover:bg-gray-50"
                          >
                            <span className="font-mono text-[10px] font-bold text-pink-600">RAZZ BERRY</span>
                            <span className="font-pixel text-[10px]">x{inventory.razzberries}</span>
                          </button>
                          <button
                            onClick={() => { useGoldenRazz(); setShowItemMenu("none"); }}
                            className="flex items-center justify-between p-2 border-2 border-black hover:bg-gray-50"
                          >
                            <span className="font-mono text-[10px] font-bold text-yellow-500">GOLDEN RAZZ</span>
                            <span className="font-pixel text-[10px]">x{inventory.goldenrazz}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => {
                  soundManager.play("click");
                  findWildPokemon();
                }}
                disabled={isCatching}
                className="flex items-center justify-center gap-3 p-3 border-4 border-black bg-white hover:bg-emerald-50 transition-all font-pixel text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Run Away
              </button>
            </div>
          </div>

          <div className="bg-black p-4 text-emerald-400 font-mono text-[10px] h-24 overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
            <p className="border-b border-emerald-400/20 pb-1 mb-1 opacity-50">ENVIRONMENT_LOG</p>
            <p className="animate-pulse">{catchStatus === "success" ? "STATUS: UNIT_CAPTURED" : catchStatus === "fail" ? "STATUS: TARGET_FLED" : isCatching ? "STATUS: CAPTURE_PROG" : "STATUS: AWAITING_CMD"}</p>
            <p className="opacity-50">TEMP: 24C // HUMID: 88%</p>
          </div>
        </div>
      </div>

      {/* Party Full Confirmation Overlay */}
      <AnimatePresence>
        {showPartyFullConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          >
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full">
              <h3 className="font-pixel text-[12px] uppercase mb-4 border-b-2 border-black pb-2">Party Full (6/6)</h3>
              <p className="font-mono text-[10px] mb-6">Do you want to replace a current party member with {wildPokemon?.name}?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    soundManager.play("click");
                    setShowPartyFullConfirm(false);
                    setShowSwapPicker(true);
                    setMessages([`Choose which Pokémon to replace with ${wildPokemon?.name}.`]);
                  }}
                  className="p-3 border-4 border-black bg-emerald-100 hover:bg-emerald-200 font-pixel text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >Yes, Replace</button>
                <button
                  onClick={() => {
                    soundManager.play("click");
                    setShowPartyFullConfirm(false);
                    setCatchStatus("fail");
                    setMessages([`${wildPokemon?.name} was released back into the wild.`]);
                    setTimeout(() => findWildPokemon(), 2000);
                  }}
                  className="p-3 border-4 border-black bg-red-100 hover:bg-red-200 font-pixel text-[10px] uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >No, Release</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Picker Overlay */}
      <AnimatePresence>
        {showSwapPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          >
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <h3 className="font-pixel text-[10px] uppercase">Choose Pokémon to Replace</h3>
                <button
                  onClick={() => {
                    setShowSwapPicker(false);
                    setCatchStatus("fail");
                    setMessages([`${wildPokemon?.name} was released back into the wild.`]);
                    setTimeout(() => findWildPokemon(), 2000);
                  }}
                  className="text-[10px] border-2 border-black px-1 font-bold"
                >X</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {partyTeam.map((p: any, i: number) => (
                  <button
                    key={p.id}
                    onClick={async () => {
                      soundManager.play("click");
                      try {
                        const res = await fetch("/api/catch/replace", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            trainerId: user?.id || "1",
                            pokemonId: wildPokemon.id,
                            replaceIndex: i
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          soundManager.play("catch");
                          setCatchStatus("success");
                          setMessages([`${p.name} was released.`, `${wildPokemon.name} joined your party!`]);
                        } else {
                          setMessages(["Error replacing party member."]);
                        }
                      } catch {
                        setMessages(["CRITICAL ERROR: Connection lost."]);
                      }
                      setShowSwapPicker(false);
                    }}
                    className="flex items-center gap-2 border-2 border-black p-2 text-left hover:bg-red-50 transition-all"
                  >
                    <img src={p.sprite} className="w-10 h-10 pixelated" alt={p.name} />
                    <div className="overflow-hidden flex-1">
                      <p className="font-pixel text-[8px] uppercase truncate">{p.name}</p>
                      <p className="font-mono text-[6px] opacity-50">{p.types}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DialogueBox messages={messages} />
    </div>
  );
};
