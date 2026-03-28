"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Video,
  Phone,
  MessageSquare,
  X,
  Clock,
  GripVertical,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Users,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportData {
  spend: number;
  leads: number;
  cpl: number;
  ctr: number;
  leadsChange: number;
  cplChange: number;
  direction: "positive" | "negative" | "neutral";
  campaignStatus: {
    summary: string;
    whatsWorking?: string[];
    keepBallRolling?: string[];
    whatChanged?: string[];
    fixes?: string[];
    optimization?: string[];
  };
  changesThisWeek: string[];
  changeImpact: string;
  nextWeek: {
    expectation: string;
    targets: string[];
    focusAreas: string[];
  };
  htmlReportUrl: string;
}

interface RetentionEvent {
  id: string;
  title: string;
  client: string;
  type: "loom" | "biweekly" | "text" | "report" | "start" | "end";
  date: string; // YYYY-MM-DD
  time: string;
  notes: string;
  completed: boolean;
  reportData?: ReportData; // Only for weekly reports
}

type ViewType = "day" | "week" | "month";

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ClientRetentionPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("week");
  const [events, setEvents] = useState<RetentionEvent[]>([
    {
      id: "pj-weekly-001",
      title: "PJ Weekly Report",
      client: "PJ Sparks",
      type: "report",
      date: "2026-03-27",
      time: "",
      notes: "Week of March 20-27, 2026",
      completed: false,
      reportData: {
        spend: 217.33,
        leads: 1,
        cpl: 217.33,
        ctr: 0.91,
        leadsChange: 0,
        cplChange: -1.5,
        direction: "negative",
        campaignStatus: {
          summary: "Campaign is stable but underperforming on lead volume. 1 lead at $217 CPL is above target.",
          whatChanged: [
            "Lead volume too low (1 lead/week)",
            "High CPL indicates audience saturation",
            "Creative fatigue likely setting in"
          ],
          fixes: [
            "Pause lowest-performing creative (CTR < 1%)",
            "Expand targeting radius by 5 miles",
            "Test new hook angles in ad copy",
            "Reduce budget on underperforming ad sets by 20%"
          ]
        },
        changesThisWeek: [
          "Paused 2 creatives showing fatigue (CTR < 1.5%)",
          "Adjusted budget allocation",
          "Reviewed targeting parameters"
        ],
        changeImpact: "Changes attempted but market conditions shifted — need more aggressive fixes.",
        nextWeek: {
          expectation: "Expect 2-3 day recovery period after implementing fixes, then stabilization.",
          targets: [
            "Target Leads: 3-4",
            "Target CPL: $80-100",
            "Target Spend: $240-280"
          ],
          focusAreas: [
            "Monitor daily",
            "Aggressive creative rotation",
            "Budget reallocation"
          ]
        },
        htmlReportUrl: "/loom-recording"
      }
    }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<RetentionEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<RetentionEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formType, setFormType] = useState<"loom" | "biweekly" | "text" | "report" | "start" | "end">("loom");
  const [formTime, setFormTime] = useState("09:00");
  const [formNotes, setFormNotes] = useState("");

  // ─── Calendar Logic ──────────────────────────────────────────────────────────

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigation functions based on view
  const prevPeriod = () => {
    if (view === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (view === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (view === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (view === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  // Get week start (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDateKey = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const getEventsForDate = (dateKey: string) => {
    return events.filter((e) => e.date === dateKey);
  };

  // ─── Event Handlers ────────────────────────────────────────────────────────

  const openAddModal = (dateKey: string) => {
    setSelectedDate(dateKey);
    setEditingEvent(null);
    setFormTitle("");
    setFormClient("");
    setFormType("loom");
    setFormTime("09:00");
    setFormNotes("");
    setShowModal(true);
  };

  const openEditModal = (event: RetentionEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setFormTitle(event.title);
    setFormClient(event.client);
    setFormType(event.type);
    setFormTime(event.time);
    setFormNotes(event.notes);
    setShowModal(true);
  };

  const saveEvent = () => {
    if (!formTitle || !formClient || !selectedDate) return;

    if (editingEvent) {
      // Update existing
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? { ...e, title: formTitle, client: formClient, type: formType, time: formTime, notes: formNotes }
            : e
        )
      );
    } else {
      // Add new
      const newEvent: RetentionEvent = {
        id: crypto.randomUUID(),
        title: formTitle,
        client: formClient,
        type: formType,
        date: selectedDate,
        time: formTime,
        notes: formNotes,
        completed: false,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    setShowModal(false);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setShowModal(false);
  };

  const toggleCompleted = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  // Drag and drop
  const handleDragStart = (event: RetentionEvent) => {
    setDraggedEvent(event);
  };

  const handleDrop = (dateKey: string) => {
    if (draggedEvent) {
      setEvents((prev) =>
        prev.map((e) => (e.id === draggedEvent.id ? { ...e, date: dateKey } : e))
      );
      setDraggedEvent(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "loom": return <Video size={14} />;
      case "biweekly": return <Phone size={14} />;
      case "text": return <MessageSquare size={14} />;
      case "report": return <Clock size={14} />;
      case "start": return <CalendarIcon size={14} />;
      case "end": return <CalendarIcon size={14} />;
      default: return <CalendarIcon size={14} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "loom": return "#E53E3E"; // Red
      case "biweekly": return "#38A169"; // Green
      case "text": return "#D69E2E"; // Yellow
      case "report": return "#4299E1"; // Blue
      case "start": return "#805AD5"; // Purple
      case "end": return "#DD6B20"; // Orange
      default: return "#718096";
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto", position: "relative", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" }}>
      {/* Red Glow Backdrops */}
      <div
        style={{
          position: "fixed",
          top: "-15%",
          right: "-10%",
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(229, 62, 62, 0.25) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-15%",
          left: "-10%",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(229, 62, 62, 0.2) 0%, transparent 55%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(70px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "40%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(229, 62, 62, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(100px)",
        }}
      />

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            marginBottom: "8px",
            background: "linear-gradient(135deg, #F7FAFC 0%, #E53E3E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          Client Retention
        </h1>
        <p style={{ color: "#A0AEC0", fontSize: "14px", fontWeight: 400 }}>
          Track touchpoints, Loom videos, calls, and reports. Drag events to reschedule.
        </p>
      </div>

      {/* Calendar Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #1A1A1A 0%, #1A1A1A 50%, rgba(229, 62, 62, 0.05) 100%)",
          padding: "16px 20px",
          borderRadius: "12px",
          flexWrap: "wrap",
          gap: "16px",
          border: "1px solid rgba(229, 62, 62, 0.1)",
          boxShadow: "0 0 40px rgba(229, 62, 62, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={prevPeriod}
            style={{
              background: "#2A2A2A",
              border: "1px solid #3A3A3A",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: "#F7FAFC",
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#F7FAFC", whiteSpace: "nowrap" }}>
            {view === "month" && `${monthNames[month]} ${year}`}
            {view === "week" && `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {view === "day" && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <button
            onClick={nextPeriod}
            style={{
              background: "#2A2A2A",
              border: "1px solid #3A3A3A",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              color: "#F7FAFC",
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              background: "#0D0D0D",
              borderRadius: "8px",
              padding: "4px",
              border: "1px solid #3A3A3A",
            }}
          >
            {(["day", "week", "month"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: view === v ? "#E53E3E" : "transparent",
                  color: view === v ? "#fff" : "#A0AEC0",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openAddModal(formatDateKey(currentDate.getDate()))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#E53E3E",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { type: "loom", label: "Loom Video", color: "#E53E3E" },
          { type: "biweekly", label: "Bi-Weekly Call", color: "#38A169" },
          { type: "text", label: "Text", color: "#D69E2E" },
          { type: "report", label: "Weekly Report", color: "#4299E1" },
          { type: "start", label: "Start of Campaign", color: "#805AD5" },
          { type: "end", label: "End of Campaign", color: "#DD6B20" },
        ].map((item) => (
          <div key={item.type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: item.color,
              }}
            />
            <span style={{ fontSize: "13px", color: "#A0AEC0" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Views */}
      <div
        style={{
          background: "linear-gradient(180deg, #1A1A1A 0%, rgba(229, 62, 62, 0.15) 100%)",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid rgba(229, 62, 62, 0.25)",
          boxShadow: "inset 0 0 100px rgba(229, 62, 62, 0.15), 0 0 60px rgba(229, 62, 62, 0.12)",
          position: "relative",
        }}
      >
        {/* Red Glow Backdrop - Month View */}
        {view === "month" && (
          <>
            <div
              style={{
                position: "absolute",
                top: "5%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "900px",
                height: "600px",
                background: "radial-gradient(circle, rgba(229, 62, 62, 0.35) 0%, transparent 55%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(80px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10%",
                right: "5%",
                width: "500px",
                height: "400px",
                background: "radial-gradient(circle, rgba(229, 62, 62, 0.2) 0%, transparent 60%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(60px)",
              }}
            />
          </>
        )}
        {/* Red Glow Backdrop - Week View */}
        {view === "week" && (
          <>
            <div
              style={{
                position: "absolute",
                top: "10%",
                right: "-15%",
                width: "700px",
                height: "700px",
                background: "radial-gradient(circle, rgba(229, 62, 62, 0.4) 0%, transparent 50%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(100px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "20%",
                left: "-10%",
                width: "600px",
                height: "500px",
                background: "radial-gradient(circle, rgba(229, 62, 62, 0.25) 0%, transparent 55%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(80px)",
              }}
            />
          </>
        )}
        {/* Red Glow Backdrop - Day View */}
        {view === "day" && (
          <>
            <div
              style={{
                position: "absolute",
                bottom: "-20%",
                left: "-20%",
                width: "900px",
                height: "900px",
                background: "radial-gradient(circle, rgba(229, 62, 62, 0.5) 0%, transparent 45%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(120px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "10%",
                right: "-10%",
                width: "500px",
                height: "500px",
                background: "radial-gradient(circle, rgba(229, 62, 62, 0.3) 0%, transparent 50%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(90px)",
              }}
            />
          </>
        )}
        {/* ─── MONTH VIEW ─── */}
        {view === "month" && (
          <>
            {/* Day Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              {dayNames.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#718096",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
              }}
            >
              {/* Empty cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: "1" }} />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = formatDateKey(day);
                const dayEvents = getEventsForDate(dateKey);
                const isToday =
                  new Date().toDateString() ===
                  new Date(year, month, day).toDateString();

                return (
                  <div
                    key={day}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dateKey)}
                    onClick={() => openAddModal(dateKey)}
                    style={{
                      aspectRatio: "1",
                      background: "#0D0D0D",
                      borderRadius: "8px",
                      padding: "8px",
                      cursor: "pointer",
                      border: isToday ? "2px solid #E53E3E" : "1px solid #2A2A2A",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      minHeight: "80px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: isToday ? "#E53E3E" : "#F7FAFC",
                        marginBottom: "4px",
                      }}
                    >
                      {day}
                    </div>
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={() => handleDragStart(event)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event);
                        }}
                        style={{
                          fontSize: "10px",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          background: getTypeColor(event.type) + "20",
                          color: getTypeColor(event.type),
                          border: `1px solid ${getTypeColor(event.type)}40`,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "grab",
                          opacity: event.completed ? 0.5 : 1,
                          textDecoration: event.completed ? "line-through" : "none",
                        }}
                      >
                        <GripVertical size={10} />
                        {event.type === "biweekly" ? `${event.time} ` : ""}{event.client.substring(0, 8)}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#718096",
                          textAlign: "center",
                        }}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── WEEK VIEW ─── */}
        {view === "week" && (
          <>
            {/* Day Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "12px" }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const dayEvents = getEventsForDate(dateKey);
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <div
                    key={i}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dateKey)}
                    onClick={() => openAddModal(dateKey)}
                    style={{
                      background: "#0D0D0D",
                      borderRadius: "8px",
                      padding: "12px",
                      cursor: "pointer",
                      border: isToday ? "2px solid #E53E3E" : "1px solid #2A2A2A",
                      minHeight: "300px",
                    }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#718096", fontWeight: 700 }}>
                        {dayNames[date.getDay()]}
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: isToday ? "#E53E3E" : "#F7FAFC" }}>
                        {date.getDate()}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {dayEvents.sort((a, b) => a.time.localeCompare(b.time)).map((event) => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={() => handleDragStart(event)}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(event);
                          }}
                          style={{
                            fontSize: "11px",
                            padding: "8px",
                            borderRadius: "6px",
                            background: getTypeColor(event.type) + "20",
                            color: getTypeColor(event.type),
                            border: `1px solid ${getTypeColor(event.type)}40`,
                            cursor: "grab",
                            opacity: event.completed ? 0.5 : 1,
                            textDecoration: event.completed ? "line-through" : "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                            {getTypeIcon(event.type)}
                            {event.type === "biweekly" && <span style={{ fontWeight: 600 }}>{event.time}</span>}
                          </div>
                          <div>{event.client}</div>
                          <div style={{ fontSize: "10px", opacity: 0.8 }}>{event.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── DAY VIEW ─── */}
        {view === "day" && (
          <>
            {(() => {
              const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
              const dayEvents = getEventsForDate(dateKey).sort((a, b) => a.time.localeCompare(b.time));

              return (
                <div style={{ minHeight: "400px" }}>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dateKey)}
                    onClick={() => openAddModal(dateKey)}
                    style={{
                      background: "#0D0D0D",
                      borderRadius: "12px",
                      padding: "24px",
                      cursor: "pointer",
                      border: "1px solid #2A2A2A",
                      minHeight: "350px",
                    }}
                  >
                    {dayEvents.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "#718096" }}>
                        <CalendarIcon size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                        <p>No events scheduled for this day.</p>
                        <p style={{ fontSize: "14px", marginTop: "8px" }}>Click to add an event.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(event);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                              padding: "16px",
                              background: getTypeColor(event.type) + "10",
                              borderRadius: "8px",
                              border: `1px solid ${getTypeColor(event.type)}30`,
                              cursor: "grab",
                              opacity: event.completed ? 0.5 : 1,
                            }}
                          >
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "8px",
                                background: getTypeColor(event.type) + "20",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: getTypeColor(event.type),
                              }}
                            >
                              {getTypeIcon(event.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: "#F7FAFC", marginBottom: "4px" }}>
                                {event.type === "biweekly" ? `${event.time} — ` : ""}{event.title}
                              </div>
                              <div style={{ fontSize: "13px", color: "#A0AEC0" }}>
                                {event.client}
                              </div>
                              {event.notes && (
                                <div style={{ fontSize: "12px", color: "#718096", marginTop: "4px" }}>
                                  {event.notes}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: event.completed ? "#38A169" : getTypeColor(event.type),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Event List */}
      <div style={{ marginTop: "32px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "#F7FAFC" }}>
          Upcoming Events
        </h3>
        {events.length === 0 ? (
          <p style={{ color: "#718096", fontSize: "14px" }}>
            No events yet. Click any date or the "Add Event" button to create your first retention touchpoint.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {events
              .filter((e) => !e.completed)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((event) => (
                <div
                  key={event.id}
                  onClick={() => openEditModal(event)}
                  style={{
                    background: "#1A1A1A",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: "pointer",
                    border: "1px solid #2A2A2A",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: getTypeColor(event.type) + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: getTypeColor(event.type),
                    }}
                  >
                    {getTypeIcon(event.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#F7FAFC" }}>{event.title}</div>
                    <div style={{ fontSize: "13px", color: "#A0AEC0" }}>
                      {event.client} • {event.date}{event.type === "biweekly" ? ` at ${event.time}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompleted(event.id);
                    }}
                    style={{
                      background: "transparent",
                      border: `1px solid ${event.completed ? "#D69E2E" : "#38A169"}`,
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: event.completed ? "#D69E2E" : "#38A169",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {event.completed ? "Mark Undone" : "Mark Done"}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#1A1A1A",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflow: "auto",
              margin: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#F7FAFC" }}>
                {editingEvent ? "Edit Event" : "Add Event"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", color: "#718096", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* ─── WEEKLY REPORT BIG THREE BREAKDOWN ─── */}
              {editingEvent?.type === "report" && editingEvent?.reportData && (
                <div
                  style={{
                    background: "#0D0D0D",
                    border: "1px solid rgba(229, 62, 62, 0.3)",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "8px",
                  }}
                >
                  {/* Header with link */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid #2A2A2A",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#F7FAFC",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ color: "#E53E3E" }}>📊</span> Weekly Report Breakdown
                    </h4>
                    <a
                      href={editingEvent.reportData.htmlReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#E53E3E",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Video size={14} />
                      Open for Loom
                    </a>
                  </div>

                  {/* Stats Summary with Charts */}
                  <div style={{ marginBottom: "24px" }}>
                    {/* Main Stats Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        marginBottom: "20px",
                      }}
                    >
                      {/* Spend Card */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #1A1A1A 0%, rgba(229, 62, 62, 0.1) 100%)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(229, 62, 62, 0.15)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "60px",
                            height: "60px",
                            background: "radial-gradient(circle, rgba(229, 62, 62, 0.2) 0%, transparent 70%)",
                            filter: "blur(20px)",
                          }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <DollarSign size={16} style={{ color: "#E53E3E" }} />
                          <span style={{ fontSize: "11px", color: "#718096", fontWeight: 600, letterSpacing: "0.05em" }}>
                            SPEND
                          </span>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#F7FAFC", fontFamily: "'SF Mono', Monaco, monospace" }}>
                          ${editingEvent.reportData.spend.toFixed(0)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#718096", marginTop: "4px" }}>
                          of $285 budget
                        </div>
                      </div>

                      {/* Leads Card */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #1A1A1A 0%, rgba(56, 161, 105, 0.08) 100%)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(56, 161, 105, 0.15)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "60px",
                            height: "60px",
                            background: "radial-gradient(circle, rgba(56, 161, 105, 0.2) 0%, transparent 70%)",
                            filter: "blur(20px)",
                          }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Users size={16} style={{ color: "#38A169" }} />
                          <span style={{ fontSize: "11px", color: "#718096", fontWeight: 600, letterSpacing: "0.05em" }}>
                            LEADS
                          </span>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#F7FAFC", fontFamily: "'SF Mono', Monaco, monospace" }}>
                          {editingEvent.reportData.leads}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: editingEvent.reportData.leadsChange >= 0 ? "#38A169" : "#E53E3E",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          {editingEvent.reportData.leadsChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {Math.abs(editingEvent.reportData.leadsChange)}% vs last week
                        </div>
                      </div>

                      {/* CPL Card */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #1A1A1A 0%, rgba(214, 158, 46, 0.08) 100%)",
                          borderRadius: "12px",
                          padding: "16px",
                          border: "1px solid rgba(214, 158, 46, 0.15)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "-20px",
                            right: "-20px",
                            width: "60px",
                            height: "60px",
                            background: "radial-gradient(circle, rgba(214, 158, 46, 0.2) 0%, transparent 70%)",
                            filter: "blur(20px)",
                          }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Target size={16} style={{ color: "#D69E2E" }} />
                          <span style={{ fontSize: "11px", color: "#718096", fontWeight: 600, letterSpacing: "0.05em" }}>
                            CPL
                          </span>
                        </div>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#F7FAFC", fontFamily: "'SF Mono', Monaco, monospace" }}>
                          ${editingEvent.reportData.cpl.toFixed(0)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#718096", marginTop: "4px" }}>
                          target: $80-100
                        </div>
                      </div>
                    </div>

                    {/* Mini Bar Chart - Weekly Performance */}
                    <div
                      style={{
                        background: "#0D0D0D",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid #2A2A2A",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <TrendingUp size={14} style={{ color: "#718096" }} />
                        <span style={{ fontSize: "12px", color: "#718096", fontWeight: 600 }}>
                          WEEKLY LEAD TREND
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px", padding: "0 4px" }}>
                        {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.4].map((h, i) => (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <div
                              style={{
                                width: "100%",
                                height: `${h * 60}px`,
                                background: i === 5 ? "linear-gradient(180deg, #E53E3E 0%, #C53030 100%)" : "#2A2A2A",
                                borderRadius: "2px",
                                transition: "all 0.3s ease",
                              }}
                            />
                            <span style={{ fontSize: "9px", color: "#4A5568" }}>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Direction Badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "16px",
                      background:
                        editingEvent.reportData.direction === "positive"
                          ? "rgba(56, 161, 105, 0.2)"
                          : editingEvent.reportData.direction === "negative"
                          ? "rgba(229, 62, 62, 0.2)"
                          : "rgba(214, 158, 46, 0.2)",
                      color:
                        editingEvent.reportData.direction === "positive"
                          ? "#38A169"
                          : editingEvent.reportData.direction === "negative"
                          ? "#E53E3E"
                          : "#D69E2E",
                      border:
                        editingEvent.reportData.direction === "positive"
                          ? "1px solid rgba(56, 161, 105, 0.3)"
                          : editingEvent.reportData.direction === "negative"
                          ? "1px solid rgba(229, 62, 62, 0.3)"
                          : "1px solid rgba(214, 158, 46, 0.3)",
                    }}
                  >
                    <span>
                      {editingEvent.reportData.direction === "positive"
                        ? "▲"
                        : editingEvent.reportData.direction === "negative"
                        ? "▼"
                        : "●"}
                    </span>
                    {editingEvent.reportData.direction === "positive"
                      ? "Positive Direction"
                      : editingEvent.reportData.direction === "negative"
                      ? "Needs Attention"
                      : "Stable"}
                  </div>

                  {/* BIG THREE POINTS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Point 1 */}
                    <div
                      style={{
                        background: "#1A1A1A",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#F7FAFC",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            background: "#E53E3E",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                        >
                          1
                        </span>
                        How Is The Campaign Going?
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#A0AEC0",
                          lineHeight: "1.6",
                          marginBottom: "12px",
                        }}
                      >
                        {editingEvent.reportData.campaignStatus.summary}
                      </p>
                      {editingEvent.reportData.campaignStatus.whatsWorking && (
                        <>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#718096",
                              marginBottom: "8px",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ✓ What&apos;s Working
                          </div>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {editingEvent.reportData.campaignStatus.whatsWorking.map(
                              (item, i) => (
                                <li
                                  key={i}
                                  style={{
                                    fontSize: "13px",
                                    color: "#F7FAFC",
                                    paddingLeft: "16px",
                                    position: "relative",
                                  }}
                                >
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: "0",
                                      color: "#38A169",
                                    }}
                                  >
                                    →
                                  </span>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </>
                      )}
                      {editingEvent.reportData.campaignStatus.fixes && (
                        <>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#718096",
                              marginBottom: "8px",
                              marginTop: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ⚠ Fixes We&apos;re Implementing
                          </div>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {editingEvent.reportData.campaignStatus.fixes.map((item, i) => (
                              <li
                                key={i}
                                style={{
                                  fontSize: "13px",
                                  color: "#F7FAFC",
                                  paddingLeft: "16px",
                                  position: "relative",
                                }}
                              >
                                <span
                                  style={{
                                    position: "absolute",
                                    left: "0",
                                    color: "#E53E3E",
                                  }}
                                >
                                  →
                                </span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>

                    {/* Point 2 */}
                    <div
                      style={{
                        background: "#1A1A1A",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#F7FAFC",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            background: "#E53E3E",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                        >
                          2
                        </span>
                        Changes Made This Week
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#A0AEC0",
                          lineHeight: "1.6",
                          marginBottom: "12px",
                        }}
                      >
                        {editingEvent.reportData.changeImpact}
                      </p>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {editingEvent.reportData.changesThisWeek.map((item, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: "13px",
                              color: "#F7FAFC",
                              paddingLeft: "16px",
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "0",
                                color: "#E53E3E",
                              }}
                            >
                              →
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Point 3 */}
                    <div
                      style={{
                        background: "#1A1A1A",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#F7FAFC",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "24px",
                            height: "24px",
                            background: "#E53E3E",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                        >
                          3
                        </span>
                        What To Expect Next Week
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#A0AEC0",
                          lineHeight: "1.6",
                          marginBottom: "12px",
                        }}
                      >
                        {editingEvent.reportData.nextWeek.expectation}
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        {editingEvent.reportData.nextWeek.targets.map((target, i) => {
                          const [label, value] = target.split(":");
                          return (
                            <div
                              key={i}
                              style={{
                                background: "#0D0D0D",
                                borderRadius: "6px",
                                padding: "10px",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#718096",
                                  textTransform: "uppercase",
                                  marginBottom: "4px",
                                }}
                              >
                                {label.trim()}
                              </div>
                              <div
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 700,
                                  color: "#F7FAFC",
                                }}
                              >
                                {value.trim()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#718096",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "8px",
                        }}
                      >
                        Focus Areas
                      </div>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {editingEvent.reportData.nextWeek.focusAreas.map((item, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: "13px",
                              color: "#F7FAFC",
                              paddingLeft: "16px",
                              position: "relative",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "0",
                                color: "#E53E3E",
                              }}
                            >
                              →
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#A0AEC0", marginBottom: "6px" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Weekly Check-in Loom"
                  style={{
                    width: "100%",
                    background: "#0D0D0D",
                    border: "1px solid #3A3A3A",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#F7FAFC",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#A0AEC0", marginBottom: "6px" }}>
                  Client
                </label>
                <input
                  type="text"
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  placeholder="e.g., Hector Huizar"
                  style={{
                    width: "100%",
                    background: "#0D0D0D",
                    border: "1px solid #3A3A3A",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#F7FAFC",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#A0AEC0", marginBottom: "6px" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#0D0D0D",
                    border: "1px solid #3A3A3A",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#F7FAFC",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#A0AEC0", marginBottom: "6px" }}>
                    Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    style={{
                      width: "100%",
                      background: "#0D0D0D",
                      border: "1px solid #3A3A3A",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#F7FAFC",
                      fontSize: "14px",
                    }}
                  >
                    <option value="loom">Loom Video</option>
                    <option value="biweekly">Bi-Weekly Call</option>
                    <option value="text">Text</option>
                    <option value="report">Weekly Report</option>
                    <option value="start">Start of Campaign</option>
                    <option value="end">End of Campaign</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#A0AEC0", marginBottom: "6px" }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#0D0D0D",
                      border: "1px solid #3A3A3A",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      color: "#F7FAFC",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#A0AEC0", marginBottom: "6px" }}>
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="What to cover in this touchpoint..."
                  rows={3}
                  style={{
                    width: "100%",
                    background: "#0D0D0D",
                    border: "1px solid #3A3A3A",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: "#F7FAFC",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                {editingEvent && (
                  <button
                    onClick={() => deleteEvent(editingEvent.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "transparent",
                      border: "1px solid #E53E3E",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      color: "#E53E3E",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                {editingEvent && (
                  <button
                    onClick={() => {
                      toggleCompleted(editingEvent.id);
                      // Update the editingEvent to reflect the change
                      setEditingEvent(prev => prev ? { ...prev, completed: !prev.completed } : null);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "transparent",
                      border: `1px solid ${editingEvent.completed ? "#D69E2E" : "#38A169"}`,
                      borderRadius: "8px",
                      padding: "12px 16px",
                      color: editingEvent.completed ? "#D69E2E" : "#38A169",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {editingEvent.completed ? "Mark Undone" : "Mark Done"}
                  </button>
                )}
                <button
                  onClick={saveEvent}
                  disabled={!formTitle || !formClient}
                  style={{
                    flex: 1,
                    background: !formTitle || !formClient ? "#3A3A3A" : "#E53E3E",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    color: "#fff",
                    cursor: !formTitle || !formClient ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {editingEvent ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
