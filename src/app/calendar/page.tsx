"use client";

import { PageHeader, Panel, SegmentedControl } from "@/components/ui/panel";
import { applicationLabel, getProfessor } from "@/lib/selectors";
import { useData } from "@/lib/store";
import { cn, formatDate, todayISO } from "@/lib/utils";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";

type CalEvent = {
  id: string;
  title: string;
  date: string;
  href: string;
  kind: "Deadline" | "Task" | "Follow-up" | "Recommendation" | "English Test";
};

const kindClass: Record<CalEvent["kind"], string> = {
  Deadline: "bg-danger-soft text-danger",
  Task: "bg-accent-soft text-accent",
  "Follow-up": "bg-warning-soft text-warning",
  Recommendation: "bg-[oklch(0.94_0.03_260)] text-[oklch(0.4_0.08_260)]",
  "English Test": "bg-bg-muted text-ink-secondary",
};

export default function CalendarPage() {
  const data = useData();
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [cursor, setCursor] = useState(() => new Date());

  const events = useMemo(() => {
    const list: CalEvent[] = [];
    for (const app of data.applications) {
      list.push({
        id: `dl-${app.id}`,
        title: `${applicationLabel(data, app)} deadline`,
        date: app.deadline,
        href: `/applications/${app.id}`,
        kind: "Deadline",
      });
    }
    for (const task of data.tasks) {
      if (!task.dueDate || task.status === "Done") continue;
      list.push({
        id: `task-${task.id}`,
        title: task.title,
        date: task.dueDate,
        href: task.applicationId ? `/applications/${task.applicationId}` : "/tasks",
        kind: "Task",
      });
    }
    for (const fit of data.professorFits) {
      if (!fit.followUpDate) continue;
      const prof = getProfessor(data, fit.professorId);
      list.push({
        id: `fu-${fit.id}`,
        title: `Follow up · ${prof?.name ?? "Professor"}`,
        date: fit.followUpDate,
        href: `/professors/${fit.professorId}`,
        kind: "Follow-up",
      });
    }
    for (const rec of data.recommendations) {
      if (!rec.deadline || rec.status === "Submitted") continue;
      list.push({
        id: `rec-${rec.id}`,
        title: `Rec · ${rec.recommenderName}`,
        date: rec.deadline,
        href: `/applications/${rec.applicationId}`,
        kind: "Recommendation",
      });
    }
    for (const eng of data.englishTests) {
      if (!eng.date) continue;
      list.push({
        id: `eng-${eng.id}`,
        title: `${eng.type} ${eng.status}`,
        date: eng.date,
        href: "/documents",
        kind: "English Test",
      });
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const monthStart = startOfMonth(cursor);
  const monthGrid = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  });

  const weekStart = startOfWeek(cursor);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(cursor),
  });

  const eventsOn = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.date), day));

  const agendaGroups = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (e.date < todayISO()) continue;
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()].slice(0, 14);
  }, [events]);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Application season calendar"
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as typeof view)}
              options={[
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
                { value: "agenda", label: "Agenda" },
              ]}
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-[var(--radius)] border border-border px-2 py-1 text-[12px] hover:bg-bg-hover"
                onClick={() =>
                  setCursor((d) =>
                    view === "month" ? addDays(startOfMonth(d), -1) : addDays(d, -7),
                  )
                }
              >
                Prev
              </button>
              <button
                type="button"
                className="rounded-[var(--radius)] border border-border px-2 py-1 text-[12px] hover:bg-bg-hover"
                onClick={() => setCursor(new Date())}
              >
                Today
              </button>
              <button
                type="button"
                className="rounded-[var(--radius)] border border-border px-2 py-1 text-[12px] hover:bg-bg-hover"
                onClick={() =>
                  setCursor((d) =>
                    view === "month" ? addDays(endOfMonth(d), 1) : addDays(d, 7),
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        }
      />

      <div className="mb-4 font-serif text-xl text-ink">
        {format(cursor, "MMMM yyyy")}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
        {(Object.keys(kindClass) as CalEvent["kind"][]).map((k) => (
          <span key={k} className={cn("rounded px-1.5 py-0.5", kindClass[k])}>
            {k}
          </span>
        ))}
      </div>

      {view === "agenda" ? (
        <Panel>
          {agendaGroups.length === 0 ? (
            <div className="px-4 py-8 text-[13px] text-ink-muted">No upcoming events.</div>
          ) : (
            agendaGroups.map(([date, items]) => (
              <div key={date} className="border-b border-border last:border-0">
                <div className="bg-bg-muted/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                  {format(parseISO(date), "EEEE · MMM d")}
                  {date === todayISO() ? " · Today" : ""}
                </div>
                <ul>
                  {items.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={e.href}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg-hover"
                      >
                        <div>
                          <div className="text-[13px] font-medium">{e.title}</div>
                          <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[11px]", kindClass[e.kind])}>
                            {e.kind}
                          </span>
                        </div>
                        <span className="text-[12px] text-ink-muted">{formatDate(e.date)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Panel>
      ) : view === "week" ? (
        <div className="grid gap-2 md:grid-cols-7">
          {weekDays.map((day) => (
            <Panel key={day.toISOString()} className="min-h-40 p-2">
              <div
                className={cn(
                  "mb-2 text-[12px] font-medium",
                  isSameDay(day, new Date()) ? "text-accent" : "text-ink-muted",
                )}
              >
                {format(day, "EEE d")}
              </div>
              <ul className="space-y-1">
                {eventsOn(day).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.href}
                      className={cn(
                        "block rounded px-1.5 py-1 text-[11px] leading-snug",
                        kindClass[e.kind],
                      )}
                    >
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-bg-muted/40 text-center text-[11px] uppercase tracking-[0.06em] text-ink-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-1 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((day) => {
              const dayEvents = eventsOn(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[88px] border-b border-r border-border p-1.5",
                    !isSameMonth(day, cursor) && "bg-bg-muted/30 text-ink-faint",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 text-[11px] tabular-nums",
                      isSameDay(day, new Date()) &&
                        "inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <ul className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <li key={e.id}>
                        <Link
                          href={e.href}
                          className={cn(
                            "block truncate rounded px-1 py-0.5 text-[10px]",
                            kindClass[e.kind],
                          )}
                          title={e.title}
                        >
                          {e.title}
                        </Link>
                      </li>
                    ))}
                    {dayEvents.length > 3 ? (
                      <li className="px-1 text-[10px] text-ink-faint">
                        +{dayEvents.length - 3} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
