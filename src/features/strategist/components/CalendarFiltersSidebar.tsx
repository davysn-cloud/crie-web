import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { POST_STAGES, IG_FORMAT_TYPES } from "@/lib/constants";

export function CalendarFiltersSidebar() {
  const {
    filterStatus,
    filterFormat,
    setFilterStatus,
    setFilterFormat,
    resetFilters,
  } = useCalendarStore();

  const hasFilters = filterStatus || filterFormat;

  return (
    <div className="w-56 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1 text-sm font-semibold">
          <Filter className="h-4 w-4" /> Filtros
        </h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs gap-1">
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}
      </div>

      <Separator />

      {/* Status filter */}
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select value={filterStatus ?? "all"} onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {POST_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Format filter */}
      <div className="space-y-1.5">
        <Label className="text-xs">Formato IG</Label>
        <Select value={filterFormat ?? "all"} onValueChange={(v) => setFilterFormat(v === "all" ? null : v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {IG_FORMAT_TYPES.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TODO P1: Pillar filter (needs pillars table) */}
      {/* TODO P1: Campaign filter */}
    </div>
  );
}
