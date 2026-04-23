import { Link, useParams, useNavigate } from "react-router-dom";
import { Plus, Settings, Users, LogOut, Building2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgencySidebarProps {
  onCreateWorkspace: () => void;
}

export function AgencySidebar({ onCreateWorkspace }: AgencySidebarProps) {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { agencies, workspaces, user, signOut } = useAuthStore();

  const currentMembership = agencies.find((a) => a.agency.slug === agencySlug);
  const agency = currentMembership?.agency;
  const displayName = currentMembership?.display_name ?? user?.email ?? "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Agency header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {agency?.name.slice(0, 2).toUpperCase() ?? "AG"}
        </div>
        <span className="truncate text-sm font-semibold">{agency?.name ?? "Agência"}</span>
      </div>

      {/* Workspaces */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">Workspaces</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateWorkspace}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <nav className="space-y-0.5">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/app/${agencySlug}/w/${ws.slug}`}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                ws.slug === workspaceSlug
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50"
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{ws.name}</span>
            </Link>
          ))}
          {workspaces.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              Nenhum workspace ainda.
            </p>
          )}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Bottom links */}
      <div className="space-y-0.5 px-2 py-2">
        <Link
          to={`/app/${agencySlug}/members`}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent/50"
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          Membros
        </Link>
        <Link
          to={`/app/${agencySlug}/settings`}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent/50"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          Configurações
        </Link>
      </div>

      <Separator />

      {/* User */}
      <div className="px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent/50">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
