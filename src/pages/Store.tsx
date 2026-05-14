import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTrainer } from "../context/TrainerContext";
import { ShoppingCart, Coins, CheckCircle, XCircle } from "lucide-react";
import { soundManager } from "../lib/sounds";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  ballColor?: string;
  image: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "pokeball",
    name: "Poké Ball",
    description: "Standard capture device. Good for common Pokémon.",
    price: 50,
    color: "bg-red-50 border-red-300",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/items/poke-ball.png",
  },
  {
    id: "greatball",
    name: "Great Ball",
    description: "Higher performance ball. 1.5× catch rate multiplier.",
    price: 150,
    color: "bg-blue-50 border-blue-300",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/items/great-ball.png",
  },
  {
    id: "ultraball",
    name: "Ultra Ball",
    description: "Top-grade ball. 2× catch rate multiplier.",
    price: 400,
    color: "bg-yellow-50 border-yellow-300",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/items/ultra-ball.png",
  },
  {
    id: "razzberry",
    name: "Razz Berry",
    description: "Feed to a wild Pokémon to boost catch rate by 50%.",
    price: 80,
    color: "bg-pink-50 border-pink-300",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/items/razz-berry.png",
  },
  {
    id: "goldenrazz",
    name: "Golden Razz",
    description: "Premium berry. Dramatically boosts catch rate by 150%.",
    price: 500,
    color: "bg-amber-50 border-amber-300",
    image: "https://archives.bulbagarden.net/media/upload/0/00/Golden_Razz_Berry_Winter_Fest_Artwork.png",
  },
  {
    id: "masterball",
    name: "Master Ball",
    description: "The ultimate ball. Catches any wild Pokémon without fail. 100% guaranteed.",
    price: 5000,
    color: "bg-purple-50 border-purple-400",
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/items/master-ball.png",
  },
];

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

export const Store: React.FC = () => {
  const { coins, inventory, buyItem } = useTrainer();
  const [quantities, setQuantities] = useState<Record<string, number>>({
    pokeball: 1, greatball: 1, ultraball: 1, razzberry: 1, goldenrazz: 1, masterball: 1,
  });
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleBuy = async (item: ShopItem) => {
    const qty = quantities[item.id];
    const totalCost = item.price * qty;
    if (totalCost > coins) {
      addToast("error", `Not enough coins! Need ${totalCost}, have ${coins}.`);
      soundManager.play("click");
      return;
    }

    setLoadingItem(item.id);
    soundManager.play("click");
    const result = await buyItem(item.id, qty);
    setLoadingItem(null);

    if (result.success) {
      addToast("success", `Bought ${qty}× ${item.name} for ${totalCost} coins!`);
      soundManager.play("catch");
    } else {
      addToast("error", result.error || "Purchase failed.");
    }
  };

  const inventoryMap: Record<string, number> = {
    pokeball: inventory.pokeballs,
    greatball: inventory.greatballs,
    ultraball: inventory.ultraballs,
    razzberry: inventory.razzberries,
    goldenrazz: inventory.goldenrazz,
    masterball: inventory.masterballs,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-retro-med p-6 border-4 border-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div>
          <h2 className="font-pixel text-lg uppercase flex items-center gap-3">
            <ShoppingCart size={20} />
            Item Depot
          </h2>
          <p className="font-mono text-[10px] opacity-70 mt-1">TRADE_UNIT: COIN // EARN_COINS: WIN_BATTLES</p>
        </div>
        <div className="flex items-center gap-3 bg-yellow-400 text-black border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xl">🪙</span>
          <div>
            <div className="font-pixel text-xl">{coins.toLocaleString()}</div>
            <div className="font-mono text-[8px] uppercase opacity-70">COINS</div>
          </div>
        </div>
      </div>

      {/* Earn hint */}
      <div className="bg-emerald-900 border-4 border-black p-4 font-mono text-[10px] text-emerald-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <span className="text-emerald-300 font-bold">// TIP: </span>
        Defeat rival trainers in the Battle Arena to earn coins. Harder rivals (higher level Pokémon) pay more. 💰
      </div>

      {/* Shop Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SHOP_ITEMS.map((item) => {
          const qty = quantities[item.id];
          const totalCost = item.price * qty;
          const canAfford = coins >= totalCost;
          const isLoading = loadingItem === item.id;
          const owned = inventoryMap[item.id] ?? 0;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className={`border-4 border-black p-5 flex flex-col gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${item.color}`}
            >
              {/* Item Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain pixelated flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-pixel text-[12px] uppercase">{item.name}</h3>
                    <p className="font-mono text-[9px] opacity-60 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-pixel text-[14px] text-amber-700">🪙{item.price}</div>
                  <div className="font-mono text-[8px] opacity-50">each</div>
                </div>
              </div>

              {/* Owned */}
              <div className="font-mono text-[9px] opacity-60 border-t border-black/20 pt-2">
                In bag: <span className="font-bold opacity-100">×{owned}</span>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between border-2 border-black bg-white">
                <button
                  onClick={() => setQuantities(prev => ({ ...prev, [item.id]: Math.max(1, prev[item.id] - 1) }))}
                  className="w-10 h-10 font-bold text-lg border-r-2 border-black hover:bg-gray-100 transition-colors"
                >−</button>
                <span className="font-pixel text-[14px] px-4">{qty}</span>
                <button
                  onClick={() => setQuantities(prev => ({ ...prev, [item.id]: prev[item.id] + 1 }))}
                  className="w-10 h-10 font-bold text-lg border-l-2 border-black hover:bg-gray-100 transition-colors"
                >+</button>
              </div>

              {/* Buy Button */}
              <button
                onClick={() => handleBuy(item)}
                disabled={!canAfford || isLoading}
                className={`w-full py-3 border-4 border-black font-pixel text-[11px] uppercase transition-all ${canAfford && !isLoading
                    ? "bg-black text-white hover:bg-retro-med active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                  }`}
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Buy ×{qty}</span>
                    <span className="opacity-70">— 🪙{totalCost.toLocaleString()}</span>
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              className={`flex items-center gap-3 px-5 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-[11px] font-bold pointer-events-auto ${toast.type === "success" ? "bg-emerald-400 text-black" : "bg-red-400 text-white"
                }`}
            >
              {toast.type === "success"
                ? <CheckCircle size={16} />
                : <XCircle size={16} />
              }
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
