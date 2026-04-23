import { create } from "zustand";

type PublisherView = "queue" | "calendar" | "grid" | "settings";

interface PublisherState {
  view: PublisherView;
  filterStatus: string | null;
  selectedPostId: string | null;
}

interface PublisherActions {
  setView: (view: PublisherView) => void;
  setFilterStatus: (status: string | null) => void;
  setSelectedPostId: (id: string | null) => void;
}

export const usePublisherStore = create<PublisherState & PublisherActions>((set) => ({
  view: "queue",
  filterStatus: null,
  selectedPostId: null,

  setView: (view) => set({ view }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSelectedPostId: (id) => set({ selectedPostId: id }),
}));
