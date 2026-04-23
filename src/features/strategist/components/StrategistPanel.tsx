import { EditorialCalendar } from "./EditorialCalendar";
import { CalendarFiltersSidebar } from "./CalendarFiltersSidebar";

export function StrategistPanel() {
  return (
    <div className="flex h-full gap-6 p-6">
      {/* Filter sidebar */}
      <aside className="hidden shrink-0 lg:block">
        <CalendarFiltersSidebar />
      </aside>

      {/* Main calendar */}
      <div className="flex-1 min-w-0">
        <EditorialCalendar />
      </div>

      {/* TODO P1: Insights panel sidebar right */}
    </div>
  );
}
