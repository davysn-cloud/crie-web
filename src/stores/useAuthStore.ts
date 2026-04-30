import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Agency, AgencyMember, Workspace } from "@/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  agencies: (AgencyMember & { agency: Agency })[];
  workspaces: Workspace[];
  currentAgencyId: string | null;
  currentWorkspaceId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: { display_name: string; agency_name: string }) => Promise<void>;
  signOut: () => Promise<void>;
  fetchAgencies: () => Promise<void>;
  fetchWorkspaces: (agencyId: string) => Promise<void>;
  setCurrentAgency: (agencyId: string) => void;
  setCurrentWorkspace: (workspaceId: string) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  user: null,
  agencies: [],
  workspaces: [],
  currentAgencyId: null,
  currentWorkspaceId: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        await get().fetchAgencies();
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          try {
            await get().fetchAgencies();
          } catch {
            // fetchAgencies falhou (ex: token expirado, projeto trocado)
            // não propaga — o usuário ainda está logado, mas sem agência
          }
        } else {
          set({ agencies: [], workspaces: [], currentAgencyId: null, currentWorkspaceId: null });
        }
      });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, metadata) => {
    const slug = metadata.agency_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: metadata.display_name,
          agency_name: metadata.agency_name,
          agency_slug: slug || `ag-${Date.now()}`,
        },
      },
    });
    if (error) throw error;

    // Se o signup retornou sessão imediatamente (email confirmation desativado),
    // aguarda 1s para o trigger handle_new_user criar a agência no banco,
    // depois carrega o estado de agências no store.
    if (data.session) {
      set({ session: data.session, user: data.session.user });
      await new Promise((r) => setTimeout(r, 1000));
      try {
        await get().fetchAgencies();
      } catch {
        // será retentado no onAuthStateChange
      }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, agencies: [], workspaces: [], currentAgencyId: null, currentWorkspaceId: null });
  },

  fetchAgencies: async () => {
    const { data, error } = await supabase
      .from("agency_members")
      .select("*, agency:agencies(*)")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");

    if (error) throw error;
    set({ agencies: data ?? [] });

    if (data && data.length > 0 && !get().currentAgencyId) {
      const first = data[0]!;
      set({ currentAgencyId: first.agency_id });
      await get().fetchWorkspaces(first.agency_id);
    }
  },

  fetchWorkspaces: async (agencyId) => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("archived", false)
      .order("created_at");

    if (error) throw error;
    set({ workspaces: data ?? [] });

    if (data && data.length > 0 && !get().currentWorkspaceId) {
      set({ currentWorkspaceId: data[0]!.id });
    }
  },

  setCurrentAgency: (agencyId) => {
    set({ currentAgencyId: agencyId, currentWorkspaceId: null, workspaces: [] });
    get().fetchWorkspaces(agencyId);
  },

  setCurrentWorkspace: (workspaceId) => {
    set({ currentWorkspaceId: workspaceId });
  },
}));
