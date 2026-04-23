import { useEffect } from "react";
import { Outlet, useParams, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Palette,
  Users,
  LayoutGrid,
  Inbox,
  Paintbrush,
  Calendar,
  BarChart3,
  Send,
  PenLine,
  Image,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import type { WorkspaceRole } from "@/lib/constants";

interface ViewConfig {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: (WorkspaceRole | "all")[];
}

// Views disponíveis por role
const VIEWS: ViewConfig[] = [
  {
    path: "",
    label: "Kanban",
    icon: LayoutGrid,
    roles: ["all"],
  },
  {
    path: "strategist",
    label: "Estrategista",
    icon: BarChart3,
    roles: ["owner", "strategist"],
  },
  {
    path: "copy",
    label: "Copywriter",
    icon: PenLine,
    roles: ["owner", "copywriter", "strategist"],
  },
  {
    path: "design",
    label: "Designer",
    icon: Image,
    roles: ["owner", "designer", "strategist"],
  },
  {
    path: "publisher",
    label: "Publisher",
    icon: Send,
    roles: ["owner", "social_media", "strategist"],
  },
  // Legacy views kept for backward compat
  {
    path: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    roles: [],
  },
  {
    path: "copywriter",
    label: "Copies (legacy)",
    icon: Inbox,
    roles: [],
  },
  {
    path: "designer",
    label: "Designs (legacy)",
    icon: Paintbrush,
    roles: [],
  },
  {
    path: "calendar",
    label: "Calendario",
    icon: Calendar,
    roles: [],
  },
];

export function WorkspaceLayout() {
  const { agencySlug, workspaceSlug } = useParams<{ agencySlug: string; workspaceSlug: string }>();
  const location = useLocation();
  const { workspaces, setCurrentWorkspace } = useAuthStore();
  const { data: role } = useWorkspaceRole();
  const queryClient = useQueryClient();

  const workspace = workspaces.find((ws) => ws.slug === workspaceSlug);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace.id);
    }
  }, [workspace, setCurrentWorkspace]);

  // Realtime para post_cards
  useEffect(() => {
    if (!workspace) return;

    const channel = supabase
      .channel(`workspace:${workspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_cards",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["post-cards", workspace.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace, queryClient]);

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Workspace não encontrado</p>
      </div>
    );
  }

  const basePath = `/app/${agencySlug}/w/${workspaceSlug}`;

  // Filtrar views pelo role (se não tem role, mostra só kanban)
  const availableViews = VIEWS.filter(
    (v) => v.roles.includes("all") || (role && v.roles.includes(role)),
  );

  // Detectar view ativa
  const currentSubpath = location.pathname.replace(basePath, "").replace(/^\//, "").split("/")[0] ?? "";

  return (
    <div className="flex h-full flex-col">
      {/* Workspace Header */}
      <header className="border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-semibold">{workspace.name}</h1>
          </div>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`${basePath}/brand`}>
                <Palette className="mr-1.5 h-4 w-4" />
                Marca
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`${basePath}/members`}>
                <Users className="mr-1.5 h-4 w-4" />
                Membros
              </Link>
            </Button>
          </nav>
        </div>

        {/* View switcher */}
        {availableViews.length > 1 && (
          <div className="flex items-center gap-1 border-t px-6 py-2">
            {availableViews.map((view) => {
              const isActive =
                (view.path === "" && currentSubpath === "") ||
                (view.path !== "" && currentSubpath === view.path);
              const Icon = view.icon;
              return (
                <Button
                  key={view.path}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link to={view.path ? `${basePath}/${view.path}` : basePath}>
                    <Icon className="mr-1.5 h-4 w-4" />
                    {view.label}
                  </Link>
                </Button>
              );
            })}
            {role && (
              <span className="ml-auto text-xs text-muted-foreground">
                Seu papel: <span className="font-medium">{roleLabel(role)}</span>
              </span>
            )}
          </div>
        )}
      </header>

      {/* Workspace Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

function roleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    owner: "Dono",
    strategist: "Estrategista",
    copywriter: "Copywriter",
    designer: "Designer",
    social_media: "Social Media",
  };
  return labels[role];
}
