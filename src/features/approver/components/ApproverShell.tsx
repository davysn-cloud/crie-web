import { Outlet } from "react-router-dom";
import { MagicLinkGate } from "@/components/MagicLinkGate";
import { useApproverStore } from "@/stores/useApproverStore";

export function ApproverShell() {
  return (
    <MagicLinkGate>
      <ApproverLayout />
    </MagicLinkGate>
  );
}

function ApproverLayout() {
  const session = useApproverStore((s) => s.session);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* White-label topbar */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {session?.agency_logo_url ? (
            <img
              src={session.agency_logo_url}
              alt={session.agency_name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {session?.agency_name?.charAt(0) ?? "C"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{session?.agency_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              Ola, {session?.approver_name}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-3 text-center text-[10px] text-muted-foreground">
        Powered by crie-web
      </footer>
    </div>
  );
}
