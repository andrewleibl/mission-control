"use client";

import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CronJob {
  id: string;
  name: string;
  description?: string;
  category: string;
  lastStatus: "success" | "ok" | "error" | "pending";
  nextRunMs?: number;
  cdtHour: number;
  cdtMinute: number;
  dow: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

interface Task {
  id: string;
  title: string;
  assignee: "andrew" | "poseidon";
  dueDate?: string; // YYYY-MM-DD
  priority?: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

// Merged from crons.json + live openclaw cron list
const CRON_JOBS: CronJob[] = [
  {
    id: "morning-brief",
    name: "Morning Brief",
    description: "Daily brief: weather, calendar, urgent client tasks",
    category: "brief",
    lastStatus: "success",
    nextRunMs: 1773748800000, // 2026-03-18T12:00:00Z = 7am CDT Mar 18
    cdtHour: 7,
    cdtMinute: 0,
    dow: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "nightly-build",
    name: "Nightly Build",
    description: "Poseidon builds while Andrew sleeps",
    category: "build",
    lastStatus: "error",
    nextRunMs: 1773806400000, // 2026-03-19T04:00:00Z = 11pm CDT Mar 18
    cdtHour: 23,
    cdtMinute: 0,
    dow: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "client-health-check",
    name: "Client Health Monitor",
    description: "Flag at-risk clients, upcoming renewals, overdue tasks",
    category: "monitor",
    lastStatus: "success",
    cdtHour: 6,
    cdtMinute: 0,
    dow: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "email-check",
    name: "Email Check",
    description: "Scan inbox for urgent messages (8am, 12pm, 4pm CDT)",
    category: "monitor",
    lastStatus: "success",
    cdtHour: 8,
    cdtMinute: 0,
    dow: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "monday-brief",
    name: "Monday Weekly Brief",
    description: "Weekly summary: revenue, pipeline, wins, priorities",
    category: "brief",
    lastStatus: "success",
    cdtHour: 8,
    cdtMinute: 0,
    dow: [1], // Monday only
  },
  {
    id: "memory-maintenance",
    name: "Memory Maintenance",
    description: "Distill daily notes into MEMORY.md",
    category: "maintenance",
    lastStatus: "success",
    cdtHour: 22,
    cdtMinute: 0,
    dow: [6], // Saturday (0 3 * * 0 UTC = 10pm CDT Saturday)
  },
  {
    id: "sms-warmup-monitor",
    name: "SMS Account Monitor",
    description: "Check SMS send rates and delivery",
    category: "monitor",
    lastStatus: "pending",
    cdtHour: 9,
    cdtMinute: 0,
    dow: [1, 2, 3, 4, 5], // Weekdays
  },
  {
    id: "caller-debrief",
    name: "Caller Debrief Reminder",
    description: "Remind Andrew to debrief callers before EOD",
    category: "reminder",
    lastStatus: "success",
    cdtHour: 17,
    cdtMinute: 30,
    dow: [1, 2, 3, 4, 5], // Weekdays
  },
];

// In-progress tasks shown on current date (no dueDates in tasks.json)
const IN_PROGRESS_TASKS: Task[] = [
  {
    id: "a-ip1",
    title: "Train Caller 2 to booking consistency",
    assignee: "andrew",
    dueDate: "2026-03-17",
    priority: "high",
  },
  {
    id: "a-ip2",
    title: "Clutch Barber Supply Shopify Redesign",
    assignee: "andrew",
    dueDate: "2026-03-17",
    priority: "high",
  },
  {
    id: "p-ip1",
    title: "Mission Control Dashboard",
    assignee: "poseidon",
    dueDate: "2026-03-17",
    priority: "high",
  },
  {
    id: "p-ip2",
    title: "Clutch Conversion Audit",
    assignee: "poseidon",
    dueDate: "2026-03-17",
    priority: "high",
  },
];

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  brief: "#63B3ED",
  build: "#E53E3E",
  monitor: "#48BB78",
  reminder: "#ED8936",
  maintenance: "#9F7AEA",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const TODAY = new Date(2026, 2, 17); // March 17, 2026 (local time)
const TODAY_STR = "2026-03-17";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: number): string {
  const h12 = hour % 12 || 12;
  const ampm = hour >= 12 ? "PM" : "AM";
  const minStr = minute === 0 ? "00" : String(minute).padStart(2, "0");
  return `${h12}:${minStr} ${ampm}`;
}

function getStatusColor(status: string): string {
  if (status === "success" || status === "ok") return "#48BB78";
  if (status === "error") return "#E53E3E";
  return "#ECC94B";
}

function getWeekStart(base: Date, offsetWeeks: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - d.getDay() + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startStr = `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}`;
  const endStr = `${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${startStr} – ${endStr}`;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavButton({
  onClick,
  children,
  dim = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  dim?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#1A1A1A",
        border: `1px solid ${hovered ? "#E53E3E" : "#333"}`,
        color: dim ? "#718096" : "#fff",
        borderRadius: "6px",
        padding: "6px 14px",
        cursor: "pointer",
        fontSize: dim ? "12px" : "18px",
        lineHeight: 1,
        transition: "border-color 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function CronCard({ job }: { job: CronJob }) {
  const color = CATEGORY_COLORS[job.category] ?? "#718096";
  const statusColor = getStatusColor(job.lastStatus);
  return (
    <div
      style={{
        background: "#1A1A1A",
        borderLeft: `3px solid ${color}`,
        borderRadius: "4px",
        padding: "5px 6px",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "4px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.3,
            flexGrow: 1,
          }}
        >
          {job.name}
        </span>
        <span
          style={{
            color: statusColor,
            fontSize: "7px",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          ●
        </span>
      </div>
      <div style={{ fontSize: "10px", color: "#718096", marginTop: "2px" }}>
        {formatTime(job.cdtHour, job.cdtMinute)} CDT
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const isAndrew = task.assignee === "andrew";
  const accentColor = isAndrew ? "#E53E3E" : "#63B3ED";
  return (
    <div
      style={{
        background: "#222",
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: "4px",
        padding: "5px 6px",
        marginBottom: "4px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "#fff",
          lineHeight: 1.3,
        }}
      >
        {task.title}
      </div>
      <span
        style={{
          display: "inline-block",
          marginTop: "3px",
          background: `${accentColor}22`,
          color: accentColor,
          border: `1px solid ${accentColor}44`,
          borderRadius: "10px",
          padding: "1px 6px",
          fontSize: "9px",
          fontWeight: 600,
          textTransform: "capitalize" as const,
        }}
      >
        {task.assignee}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => getWeekStart(TODAY, weekOffset), [weekOffset]);

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const weekLabel = formatDateRange(weekStart);

  const alwaysRunning = CRON_JOBS.filter(
    (j) => j.id === "morning-brief" || j.id === "nightly-build"
  );

  const upcoming = useMemo(
    () =>
      CRON_JOBS.filter((j) => j.nextRunMs !== undefined)
        .sort((a, b) => (a.nextRunMs ?? 0) - (b.nextRunMs ?? 0))
        .slice(0, 5),
    []
  );

  function getCronEventsForDay(dayOfWeek: number): CronJob[] {
    return CRON_JOBS.filter((job) => job.dow.includes(dayOfWeek)).sort(
      (a, b) =>
        a.cdtHour * 60 + a.cdtMinute - (b.cdtHour * 60 + b.cdtMinute)
    );
  }

  function getTasksForDate(dateStr: string): Task[] {
    return IN_PROGRESS_TASKS.filter((t) => t.dueDate === dateStr);
  }

  return (
    <div
      style={{
        background: "#0D0D0D",
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "#fff",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
            Calendar
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#718096",
              margin: "4px 0 0 0",
            }}
          >
            Week of {weekLabel}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <NavButton onClick={() => setWeekOffset((o) => o - 1)}>‹</NavButton>
          <NavButton onClick={() => setWeekOffset(0)} dim>
            Today
          </NavButton>
          <NavButton onClick={() => setWeekOffset((o) => o + 1)}>›</NavButton>
        </div>
      </div>

      {/* ── Always Running ── */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            fontSize: "11px",
            color: "#718096",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "10px",
          }}
        >
          Always Running
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {alwaysRunning.map((job) => {
            const color = CATEGORY_COLORS[job.category] ?? "#718096";
            const statusColor = getStatusColor(job.lastStatus);
            const nextRunDate =
              job.nextRunMs != null ? new Date(job.nextRunMs) : null;
            const nextRunCDT = nextRunDate
              ? nextRunDate.toLocaleString("en-US", {
                  timeZone: "America/Chicago",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null;
            return (
              <div
                key={job.id}
                style={{
                  background: "#1A1A1A",
                  border: `1px solid ${color}`,
                  borderRadius: "20px",
                  padding: "6px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                }}
              >
                <span style={{ color: statusColor, fontSize: "8px" }}>●</span>
                <span style={{ fontWeight: 600, color: "#fff" }}>
                  {job.name}
                </span>
                {nextRunCDT && (
                  <span style={{ color: "#718096", fontSize: "11px" }}>
                    next: {nextRunCDT} CDT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Weekly Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          marginBottom: "28px",
        }}
      >
        {/* Column headers */}
        {weekDates.map((date, i) => {
          const dateStr = toDateStr(date);
          const isToday = dateStr === TODAY_STR;
          return (
            <div
              key={`hdr-${i}`}
              style={{
                textAlign: "center",
                padding: "8px 4px 6px",
                borderRadius: "6px 6px 0 0",
                background: isToday ? "#1A0808" : "transparent",
                border: isToday ? "1px solid #E53E3E" : "1px solid transparent",
                borderBottom: "none",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isToday ? "#E53E3E" : "#718096",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {DAY_NAMES[i]}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: isToday ? "#E53E3E" : "#fff",
                  marginTop: "2px",
                  lineHeight: 1,
                }}
              >
                {date.getDate()}
              </div>
              {isToday && (
                <div
                  style={{
                    fontSize: "9px",
                    color: "#E53E3E",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: "3px",
                  }}
                >
                  TODAY
                </div>
              )}
            </div>
          );
        })}

        {/* Day cells */}
        {weekDates.map((date, i) => {
          const dateStr = toDateStr(date);
          const isToday = dateStr === TODAY_STR;
          const dayOfWeek = date.getDay();
          const cronEvents = getCronEventsForDay(dayOfWeek);
          const tasks = getTasksForDate(dateStr);

          return (
            <div
              key={`cell-${i}`}
              style={{
                background: isToday ? "#1A0808" : "#141414",
                border: isToday ? "1px solid #E53E3E" : "1px solid #2A2A2A",
                borderTop: "none",
                borderRadius: "0 0 6px 6px",
                minHeight: "120px",
                padding: "6px",
                overflowY: "auto",
                maxHeight: "320px",
              }}
            >
              {/* Task cards */}
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {/* Cron event cards */}
              {cronEvents.map((job) => (
                <CronCard key={job.id} job={job} />
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Upcoming Runs ── */}
      <div
        style={{
          background: "#141414",
          border: "1px solid #2A2A2A",
          borderRadius: "8px",
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#718096",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "12px",
          }}
        >
          Upcoming Runs
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {upcoming.map((job) => {
            const nextRunDate =
              job.nextRunMs != null ? new Date(job.nextRunMs) : null;
            const timeStr = nextRunDate
              ? nextRunDate.toLocaleString("en-US", {
                  timeZone: "America/Chicago",
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Unknown";
            const color = CATEGORY_COLORS[job.category] ?? "#718096";
            const statusColor = getStatusColor(job.lastStatus);
            return (
              <div
                key={job.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ color, fontSize: "8px", flexShrink: 0 }}>
                  ●
                </span>
                <span
                  style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}
                >
                  {job.name}
                </span>
                <span style={{ fontSize: "12px", color: "#718096" }}>
                  {timeStr} CDT
                </span>
                <span
                  style={{
                    color: statusColor,
                    fontSize: "8px",
                    flexShrink: 0,
                  }}
                >
                  ●
                </span>
                <span style={{ fontSize: "10px", color: statusColor }}>
                  {job.lastStatus}
                </span>
              </div>
            );
          })}
          {upcoming.length === 0 && (
            <p style={{ fontSize: "13px", color: "#4A5568", margin: 0 }}>
              No upcoming runs with known timestamps.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
