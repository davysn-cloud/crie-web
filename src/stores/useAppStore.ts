import { create } from "zustand";
import type { BrandId } from "@/lib/crie-tokens";

interface AppState {
  brand: BrandId;
  setBrand: (b: BrandId) => void;
}

export const useAppStore = create<AppState>((set) => ({
  brand: "cafebonito",
  setBrand: (brand) => set({ brand }),
}));
