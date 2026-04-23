import { create } from "zustand";

type ViewMode = "month" | "week" | "grid";

interface CalendarState {
  viewMode: ViewMode;
  filterPillarId: string | null;
  filterStatus: string | null;
  filterFormat: string | null;
  filterCampaignId: string | null;
}

interface CalendarActions {
  setViewMode: (mode: ViewMode) => void;
  setFilterPillarId: (id: string | null) => void;
  setFilterStatus: (status: string | null) => void;
  setFilterFormat: (format: string | null) => void;
  setFilterCampaignId: (id: string | null) => void;
  resetFilters: () => void;
}

export const useCalendarStore = create<CalendarState & CalendarActions>((set) => ({
  viewMode: "month",
  filterPillarId: null,
  filterStatus: null,
  filterFormat: null,
  filterCampaignId: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterPillarId: (id) => set({ filterPillarId: id }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterFormat: (format) => set({ filterFormat: format }),
  setFilterCampaignId: (id) => set({ filterCampaignId: id }),
  resetFilters: () =>
    set({ filterPillarId: null, filterStatus: null, filterFormat: null, filterCampaignId: null }),
}));
