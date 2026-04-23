import { create } from "zustand";
import type { MagicLinkSession } from "@/types/approver";

interface ApproverState {
  session: MagicLinkSession | null;
  currentIndex: number;
  isValidating: boolean;
  error: string | null;
}

interface ApproverActions {
  setSession: (session: MagicLinkSession) => void;
  clearSession: () => void;
  setCurrentIndex: (index: number) => void;
  setValidating: (v: boolean) => void;
  setError: (error: string | null) => void;
}

export const useApproverStore = create<ApproverState & ApproverActions>((set) => ({
  session: null,
  currentIndex: 0,
  isValidating: false,
  error: null,

  setSession: (session) => set({ session, error: null }),
  clearSession: () => set({ session: null }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setValidating: (v) => set({ isValidating: v }),
  setError: (error) => set({ error }),
}));
