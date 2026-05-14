import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface Inventory {
  pokeballs: number;
  greatballs: number;
  ultraballs: number;
  razzberries: number;
  goldenrazz: number;
  masterballs: number;
}

const DEFAULT_INVENTORY: Inventory = {
  pokeballs: 20,
  greatballs: 10,
  ultraballs: 5,
  razzberries: 10,
  goldenrazz: 2,
  masterballs: 0,
};

interface TrainerContextType {
  coins: number;
  inventory: Inventory;
  isLoading: boolean;
  refreshTrainer: () => Promise<void>;
  saveInventory: (inv: Inventory) => Promise<void>;
  buyItem: (item: string, qty?: number) => Promise<{ success: boolean; error?: string }>;
  addCoins: (amount: number) => void; // optimistic update after earning
}

const TrainerContext = createContext<TrainerContextType | undefined>(undefined);

export const TrainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [coins, setCoins] = useState(500);
  const [inventory, setInventory] = useState<Inventory>(DEFAULT_INVENTORY);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTrainer = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trainer/${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCoins(data.coins ?? 500);
      setInventory({ ...DEFAULT_INVENTORY, ...(data.inventory || {}) });
    } catch (e) {
      console.error("TrainerContext: Failed to fetch trainer", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load on mount / when user changes
  useEffect(() => {
    refreshTrainer();
  }, [refreshTrainer]);

  const saveInventory = useCallback(async (inv: Inventory) => {
    if (!user) return;
    setInventory(inv); // optimistic
    try {
      await fetch(`/api/trainer/${user.id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory: inv }),
      });
    } catch (e) {
      console.error("TrainerContext: Failed to save inventory", e);
    }
  }, [user]);

  const buyItem = useCallback(async (item: string, qty = 1) => {
    if (!user) return { success: false, error: "Not logged in" };
    try {
      const res = await fetch(`/api/trainer/${user.id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, qty }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      // Server returns updated coins + inventory
      setCoins(data.coins);
      setInventory({ ...DEFAULT_INVENTORY, ...data.inventory });
      return { success: true };
    } catch (e) {
      return { success: false, error: "Network error" };
    }
  }, [user]);

  const addCoins = useCallback((amount: number) => {
    setCoins(prev => prev + amount);
  }, []);

  return (
    <TrainerContext.Provider value={{
      coins, inventory, isLoading,
      refreshTrainer, saveInventory, buyItem, addCoins
    }}>
      {children}
    </TrainerContext.Provider>
  );
};

export const useTrainer = () => {
  const context = useContext(TrainerContext);
  if (!context) throw new Error("useTrainer must be used within TrainerProvider");
  return context;
};
