"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  EmptyState,
  PageHeader,
  Panel,
  Section,
  SegmentedControl,
  StatStrip,
} from "@/components/ui/panel";
import { applicationLabel, openTasks } from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const BOARD: TaskStatus[] = ["Todo", "In Progress", "Done"];

function dueLabel(due?: string) {
  const days = daysUntil(due);
  if (days === null) return "No due date";
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${formatDate(due)}`;
}

function TaskRow({
  task,
  onComplete,
  onOpen,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onOpen?: (task: Task) => void;
}) {
  const data = useData();
  const app = task.applicationId
    ? data.applications.find((a) => a.id === task.applicationId)
    : null;
  const prof = task.professorId
    ? data.professors.find((p) => p.id === task.professorId)
    : null;

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onOpen?.(task)}
      >
        <div
          className={cn(
            "text-[13px] font-medium",
            task.status === "Done" && "text-ink-muted line-through",
          )}
        >
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
          <StatusBadge status={task.priority} />
          <StatusBadge status={task.status} />
          <span>{dueLabel(task.dueDate)}</span>
          {app ? (
            <Link
              href={`/applications/${app.id}`}
              className="hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              {applicationLabel(data, app)}
            </Link>
          ) : (
            <span>General</span>
          )}
          {prof ? <span>{prof.name}</span> : null}
        </div>
        {task.notes ? (
          <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-secondary">
            {task.notes}
          </p>
        ) : null}
      </button>
      {task.status !== "Done" ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export default function TasksPage() {
  const data = useData();
  const createTask = useAppStore((s) => s.createTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const [view, setView] = useState<"list" | "board">("list");
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    priority: "Normal" as TaskPriority,
    status: "Todo" as TaskStatus,
    dueDate: "",
    applicationId: "",
    notes: "",
  });
  const [statusFilter, setStatusFilter] = useState("Open");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    priority: "Normal" as TaskPriority,
    dueDate: "",
    applicationId: "",
    notes: "",
  });

  const openList = openTasks(data);
  const dueToday = openList.filter((t) => daysUntil(t.dueDate) === 0).length;
  const thisWeek = openList.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d >= 0 && d <= 7;
  }).length;
  const overdue = openList.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0;
  }).length;

  const filtered = useMemo(() => {
    return data.tasks.filter((t) => {
      if (statusFilter === "Open" && t.status === "Done") return false;
      if (statusFilter !== "All" && statusFilter !== "Open" && t.status !== statusFilter)
        return false;
      if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [data.tasks, statusFilter, priorityFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.status === "Done" && b.status !== "Done") return 1;
      if (b.status === "Done" && a.status !== "Done") return -1;
      const p = { Urgent: 0, High: 1, Normal: 2, Low: 3 }[a.priority] -
        { Urgent: 0, High: 1, Normal: 2, Low: 3 }[b.priority];
      if (p !== 0) return p;
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
  }, [filtered]);

  const onCreate = () => {
    if (!form.title) return;
    createTask({
      title: form.title,
      status: "Todo",
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      applicationId: form.applicationId || undefined,
      notes: form.notes || undefined,
    });
    setOpen(false);
    setForm({
      title: "",
      priority: "Normal",
      dueDate: "",
      applicationId: "",
      notes: "",
    });
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditForm({
      title: task.title,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ?? "",
      applicationId: task.applicationId ?? "",
      notes: task.notes ?? "",
    });
  };

  const onSaveEdit = () => {
    if (!editTask || !editForm.title.trim()) return;
    updateTask(editTask.id, {
      title: editForm.title.trim(),
      priority: editForm.priority,
      status: editForm.status,
      dueDate: editForm.dueDate || undefined,
      applicationId: editForm.applicationId || undefined,
      notes: editForm.notes.trim() || undefined,
      completedAt: editForm.status === "Done" ? editTask.completedAt ?? new Date().toISOString().slice(0, 10) : undefined,
    });
    setEditTask(null);
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="What still needs doing across applications and outreach."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as "list" | "board")}
              options={[
                { value: "list", label: "List" },
                { value: "board", label: "Board" },
              ]}
            />
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          { label: "Open", value: openList.length, accent: true },
          { label: "Due Today", value: dueToday, accent: dueToday > 0 },
          { label: "This Week", value: thisWeek },
          { label: "Overdue", value: overdue, accent: overdue > 0 },
          { label: "Done", value: data.tasks.filter((t) => t.status === "Done").length },
          { label: "Total", value: data.tasks.length },
        ]}
      />

      {view === "list" ? (
        <Section>
          <div className="mb-3 flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-auto min-w-32"
            >
              <option value="Open">Open</option>
              <option value="All">All statuses</option>
              {BOARD.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-auto min-w-32"
            >
              <option value="All">All priority</option>
              {(["Urgent", "High", "Normal", "Low"] as TaskPriority[]).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          {sorted.length === 0 ? (
            <EmptyState
              title="No tasks here."
              description="Capture the next concrete step so deadlines don't sneak up."
              actionLabel="Add Task"
              onAction={() => setOpen(true)}
            />
          ) : (
            <Panel>
              <ul className="divide-y divide-border">
                {sorted.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      onComplete={completeTask}
                      onOpen={openEdit}
                    />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </Section>
      ) : (
        <Section>
          {data.tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet."
              description="Capture the next concrete step so deadlines don't sneak up."
              actionLabel="Add Task"
              onAction={() => setOpen(true)}
            />
          ) : (
            <div className="scroll-thin -mx-1 flex gap-3 overflow-x-auto pb-2">
              {BOARD.map((status) => {
                const column = data.tasks.filter((t) => t.status === status);
                return (
                  <div
                    key={status}
                    className="w-[280px] shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragId) {
                        if (status === "Done") completeTask(dragId);
                        else updateTask(dragId, { status, completedAt: undefined });
                      }
                      setDragId(null);
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h3 className="text-[12px] font-semibold text-ink">{status}</h3>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {column.length}
                      </span>
                    </div>
                    <div className="min-h-[120px] space-y-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-muted/40 p-2">
                      {column.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDragId(task.id)}
                          onDragEnd={() => setDragId(null)}
                          className="cursor-grab rounded-[var(--radius)] border border-border bg-bg-elevated active:cursor-grabbing"
                        >
                          <TaskRow
                            task={task}
                            onComplete={completeTask}
                            onOpen={openEdit}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Task"
        description="Keep titles action-oriented and specific."
      >
        <div className="space-y-3">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Draft Stanford SOP opening"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
              >
                {(["Urgent", "High", "Normal", "Low"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Application">
            <Select
              value={form.applicationId}
              onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
            >
              <option value="">General</option>
              {data.applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {applicationLabel(data, a)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreate}>
              Create
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title="Edit Task"
        description="Update details and notes for this task."
      >
        <div className="space-y-3">
          <Field label="Title">
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select
                value={editForm.priority}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    priority: e.target.value as TaskPriority,
                  })
                }
              >
                {(["Urgent", "High", "Normal", "Low"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value as TaskStatus })
                }
              >
                {BOARD.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <Input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              />
            </Field>
            <Field label="Application">
              <Select
                value={editForm.applicationId}
                onChange={(e) =>
                  setEditForm({ ...editForm, applicationId: e.target.value })
                }
              >
                <option value="">General</option>
                {data.applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {applicationLabel(data, a)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="min-h-28"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditTask(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
