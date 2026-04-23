import { useState } from "react";
import { Building2, Users, UserCheck, Link2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandsManager } from "./BrandsManager";
import { TeamManager } from "./TeamManager";
import { ApproversManager } from "./ApproversManager";
import { IntegrationSettings } from "./IntegrationSettings";

type AdminView = "brands" | "team" | "approvers" | "integrations";

const NAV_ITEMS: { key: AdminView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "brands", label: "Marcas", icon: Building2 },
  { key: "team", label: "Time", icon: Users },
  { key: "approvers", label: "Aprovadores", icon: UserCheck },
  { key: "integrations", label: "Integracoes", icon: Link2 },
];

export function AdminPanel() {
  const [activeView, setActiveView] = useState<AdminView>("brands");

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r p-4">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
          <Settings className="h-4 w-4" /> Admin
        </h2>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeView === key ? "secondary" : "ghost"}
              size="sm"
              className={cn("w-full justify-start gap-2", activeView === key && "font-medium")}
              onClick={() => setActiveView(key)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {activeView === "brands" && <BrandsManager />}
        {activeView === "team" && <TeamManager />}
        {activeView === "approvers" && <ApproversManager />}
        {activeView === "integrations" && <IntegrationSettings />}
      </main>
    </div>
  );
}
