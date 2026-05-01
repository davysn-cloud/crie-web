import { create } from "zustand";
import type { IGFormat } from "@/lib/instagram";

interface CanvasState {
  activeFormat: IGFormat;
  zoom: number;
  showSafeZones: boolean;
  showIGOverlay: boolean;
  showGrid: boolean;
  selectedSlideIndex: number;
}

interface CanvasActions {
  setActiveFormat: (format: IGFormat) => void;
  setZoom: (zoom: number) => void;
  toggleSafeZones: () => void;
  toggleIGOverlay: () => void;
  toggleGrid: () => void;
  setSelectedSlideIndex: (index: number) => void;
}

export const useCanvasStore = create<CanvasState & CanvasActions>((set) => ({
  activeFormat: "feed_1_1",
  zoom: 100,
  showSafeZones: true,
  showIGOverlay: false,
  showGrid: false,
  selectedSlideIndex: 0,

  setActiveFormat: (format) => set({ activeFormat: format }),
  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(400, zoom)) }),
  toggleSafeZones: () => set((s) => ({ showSafeZones: !s.showSafeZones })),
  toggleIGOverlay: () => set((s) => ({ showIGOverlay: !s.showIGOverlay })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setSelectedSlideIndex: (index) => set({ selectedSlideIndex: index }),
}));
