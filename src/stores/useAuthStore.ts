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
    // Garante que o spinner do AuthGuard nunca trava: se algo demorar mais
    // de 8s (token stale, rede caída, RLS travado), forçamos isLoading=false
    // para o AuthGuard redirecionar para /login.
    const safetyTimeout = setTimeout(() => {
      if (!get().isInitialized) {
        console.warn("[auth] initialize timeout — forçando estado inicializado");
        set({ isLoading: false, isInitialized: true });
      }
    }, 8000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        // Token stale do projeto antigo — limpa para forçar novo login
        console.warn("[auth] sessão inválida, limpando:", sessionError.message);
        await supabase.auth.signOut().catch(() => {});
        set({ session: null, user: null });
      } else {
        set({ session, user: session?.user ?? null });

        if (session?.user) {
          try {
            await get().fetchAgencies();
          } catch (e) {
            console.warn("[auth] fetchAgencies falhou na inicialização:", e);
            // não propaga — usuário continua logado, dashboard mostrará vazio
          }
        }
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        // TOKEN_REFRESH_FAILED ou SIGNED_OUT: limpa tudo
        if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
          set({ session: null, user: null, agencies: [], workspaces: [], currentAgencyId: null, currentWorkspaceId: null });
          return;
        }

        set({ session, user: session?.user ?? null });
        if (session?.user) {
          try {
            await get().fetchAgencies();
          } catch (e) {
            console.warn("[auth] fetchAgencies falhou:", e);
          }
        } else {
          set({ agencies: [], workspaces: [], currentAgencyId: null, currentWorkspaceId: null });
        }
      });
    } catch (e) {
      console.error("[auth] erro inesperado em initialize:", e);
    } finally {
      clearTimeout(safetyTimeout);
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
    // Usa o user já em memória (vindo de getSession) em vez de getUser(),
    // que faz uma nova chamada de rede e pode travar se o token estiver stale.
    const userId = get().user?.id;
    if (!userId) {
      set({ agencies: [] });
      return;
    }

    const { data, error } = await supabase
      .from("agency_members")
      .select("*, agency:agencies(*)")
      .eq("user_id", userId);

    if (error) throw error;
    set({ agencies: data ?? [] });

    if (data && data.length > 0 && !get().currentAgencyId) {
      const first = data[0]!;
      set({ currentAgencyId: first.agency_id });
      try {
        await get().fetchWorkspaces(first.agency_id);
      } catch (e) {
        console.warn("[auth] fetchWorkspaces falhou:", e);
      }
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
