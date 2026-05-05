import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
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
    const safetyTimeout = setTimeout(() => {
      if (!get().isInitialized) {
        console.warn("[auth] initialize timeout — forçando estado inicializado");
        set({ isLoading: false, isInitialized: true });
      }
    }, 8000);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
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
          }

          if (get().agencies.length === 0 && get().session) {
            try {
              const { error: verifyError } = await supabase.auth.getUser();
              if (verifyError) {
                console.warn("[auth] token inválido para este projeto, limpando:", verifyError.message);
                await supabase.auth.signOut().catch(() => {});
                set({ session: null, user: null });
              }
            } catch {
              // network error — keep session
            }
          }
        }
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        // Limpa tudo ao deslogar ou se o refresh do token falhar
        if (event === "SIGNED_OUT" || event === "TOKEN_REFRESH_FAILED") {
          set({ session: null, user: null, agencies: [], workspaces: [], currentAgencyId: null, currentWorkspaceId: null });
          queryClient.clear();
          return;
        }

        // Supabase v2 emite SIGNED_IN quando a session carrega na inicialização;
        // nesse caso já processamos tudo acima — evita double-fetch.
        set({ session, user: session?.user ?? null });

        // Token renovado: invalida queries para usar novo JWT
        if (event === "TOKEN_REFRESHED") {
          queryClient.invalidateQueries();
        }

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

      // Re-valida sessão e refaz fetch quando a aba volta ao foco
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && get().session) {
            supabase.auth.getSession().then(async ({ data: { session: fresh } }) => {
              if (fresh) {
                set({ session: fresh, user: fresh.user });
                // Atualiza dados (workspaces, agencies) que podem ter mudado
                try {
                  await get().fetchAgencies();
                } catch {
                  // silencioso — não quebra o fluxo
                }
              }
            }).catch(() => {});
          }
        });
      }
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
    // Limpa cache do usuário anterior antes de criar nova sessão
    queryClient.clear();

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
    queryClient.clear();
    // Limpa qualquer dado persistido localmente
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ambiente sem storage (SSR, iframe sandboxado)
    }
  },

  fetchAgencies: async () => {
    const userId = get().user?.id;
    if (!userId) {
      set({ agencies: [] });
      return;
    }

    const { data, error } = await supabase
      .from("agency_members")
      .select("*, agency:agencies(*)")
      .eq("user_id", userId)
      .not("accepted_at", "is", null);

    if (error) throw error;
    set({ agencies: data ?? [] });

    if (data && data.length > 0) {
      // Sempre carrega workspaces para a agência atual (ou a primeira se ainda não definida)
      const currentId = get().currentAgencyId;
      const found = currentId ? data.find((m) => m.agency_id === currentId) : null;
      const target = found ?? data[0]!;

      if (!currentId) {
        set({ currentAgencyId: target.agency_id });
      }

      try {
        await get().fetchWorkspaces(target.agency_id);
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
