"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  Calendar as CalendarIcon, 
  Video, 
  Phone, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  GripVertical,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Utils ───────────────────────────────────────────────────────────────────

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = "loom" | "call" | "text";
type ViewType = "daily" | "weekly" | "monthly";

interface Campaign {
  id: string;
  name: string;
  clientName: string;
  spend: number;
  leads: number;
  targetCPL: number;
  ctr: number;
  status: "good" | "warning" | "critical";
}

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  time: string;
  campaignId: string;
  recurring?: boolean;
  dayOfWeek?: number; // 0=Sun, 1=Mon, ..., 6=Sat
}

interface EventDetails {
  stats: {
    spend: string;
    leads: number;
    cpl: string;
    ctr: string;
  };
  whatMeans: string;
  whatSay: string;
  changes: string[];
  nextSteps: string[];
}

// ─── Sample Data ───────────────────────────────────────────────────────────

const CAMPAIGNS: Campaign[] = [
  {
    id: "landscape-pro",
    name: "Landscape Pro",
    clientName: "Hector Huizar",
    spend: 2847,
    leads: 23,
    targetCPL: 100,
    ctr: 2.4,
    status: "warning",
  },
  {
    id: "precision-lawn",
    name: "Precision Lawn",
    clientName: "PJ Sparks",
    spend: 3120,
    leads: 31,
    targetCPL: 100,
    ctr: 2.8,
    status: "good",
  },
  {
    id: "elite-outdoor",
    name: "Elite Outdoor",
    clientName: "Ricardo Madera",
    spend: 1945,
    leads: 18,
    targetCPL: 100,
    ctr: 2.1,
    status: "warning",
  },
];

// Generate recurring events for current month
function generateEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Recurring Tuesday (2) and Friday (5) Loom events
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 2) { // Tuesday
      events.push({
        id: `loom-tue-${day}`,
        title: "Loom Update",
        type: "loom",
        date,
        time: "10:00",
        campaignId: "landscape-pro",
        recurring: true,
        dayOfWeek: 2,
      });
    }
    
    if (dayOfWeek === 5) { // Friday
      events.push({
        id: `loom-fri-${day}`,
        title: "Weekly Loom",
        type: "loom",
        date,
        time: "14:00",
        campaignId: "precision-lawn",
        recurring: true,
        dayOfWeek: 5,
      });
    }
  }
  
  return events;
}

const INITIAL_EVENTS = generateEvents();

// ─── Components ─────────────────────────────────────────────────────────────

function EventCard({ event, onClick, onDragStart }: { 
  event: CalendarEvent; 
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const campaign = CAMPAIGNS.find(c => c.id === event.campaignId);
  
  const typeConfig = {
    loom: { 
      icon: Video, 
      bg: "bg-gradient-to-r from-amber-600 to-orange-700",
      border: "border-amber-500/50",
    },
    call: { 
      icon: Phone, 
      bg: "bg-gradient-to-r from-orange-600 to-amber-700", 
      border: "border-orange-500/50",
    },
    text: { 
      icon: MessageSquare, 
      bg: "bg-gradient-to-r from-zinc-700 to-zinc-800",
      border: "border-zinc-600/50",
    },
  };
  
  const config = typeConfig[event.type];
  const Icon = config.icon;
  
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "group cursor-grab active:cursor-grabbing rounded-lg p-2 mb-2",
        "border shadow-sm hover:shadow-md transition-all duration-200",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        config.bg,
        config.border,
        "border-l-4"
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-white/60" />
        <Icon className="w-3 h-3 text-white" />
        <span className="text-xs font-medium text-white truncate flex-1">
          {event.title}
        </span>
      </div>
      <div className="text-[10px] text-white/70 mt-1 ml-5">
        {event.time} · {campaign?.clientName.split(" ")[0]}
      </div>
    </div>
  );
}

function EventModal({ event, isOpen, onClose }: { 
  event: CalendarEvent | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!isOpen || !event) return null;
  
  const campaign = CAMPAIGNS.find(c => c.id === event.campaignId);
  if (!campaign) return null;
  
  const cpl = campaign.spend / campaign.leads;
  const cplDiff = ((cpl - campaign.targetCPL) / campaign.targetCPL) * 100;
  
  const details: EventDetails = {
    stats: {
      spend: `$${campaign.spend.toLocaleString()}`,
      leads: campaign.leads,
      cpl: `$${cpl.toFixed(2)}`,
      ctr: `${campaign.ctr}%`,
    },
    whatMeans: cpl > campaign.targetCPL 
      ? `Your CPL is $${cpl.toFixed(2)} — ${cplDiff.toFixed(0)}% higher than your $${campaign.targetCPL} target. The algorithm is learning, but lead quality plateaued. CTR at ${campaign.ctr}% shows creative resonance, yet conversion lag suggests landing page friction.`
      : `Your CPL is $${cpl.toFixed(2)} — performing well against your $${campaign.targetCPL} target. CTR at ${campaign.ctr}% indicates strong creative-audience fit. Continue current trajectory with minor optimizations.`,
    whatSay: event.type === "loom" 
      ? `"Hey ${campaign.clientName.split(" ")[0]}, quick update — here's what I'm seeing this week. [Screen share] We spent $${campaign.spend.toLocaleString()}, generated ${campaign.leads} leads at $${cpl.toFixed(2)} CPL. ${cpl > campaign.targetCPL ? "I'm making adjustments to bring this down." : "Trending in the right direction."} Here's what I'm doing next..."`
      : event.type === "call"
      ? `"Hey ${campaign.clientName.split(" ")[0]}, Andrew here. Wanted to reach out personally about your campaign. We're at $${cpl.toFixed(2)} CPL — ${cpl > campaign.targetCPL ? "working on optimizations to get this down to your target." : "right on track."} Can we chat for 10 minutes?"`
      : `"Hey ${campaign.clientName.split(" ")[0]}, Andrew from ${campaign.name}. Quick check-in — monitoring your campaign performance. Will send a full update tomorrow. Talk soon!"`,
    changes: [
      `Bid cap ${cpl > campaign.targetCPL ? "raised" : "maintained"} based on performance data`,
      "Creative rotated: Testing new angle variations",
      "Budget reallocated to top-performing ad sets",
    ],
    nextSteps: [
      cpl > campaign.targetCPL 
        ? `Monitor CPL over next 48 hours — if still >$${campaign.targetCPL}, pause lowest performer`
        : `Maintain current spend levels — performance is within target`,
      "Check lead quality scores — if <70% qualified, adjust targeting",
      "Review landing page speed — if >3s load time, escalate to dev",
    ],
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-amber-600/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{event.title}</h2>
            <p className="text-amber-100/80 text-sm">
              {campaign.name} · {event.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Campaign Stats */}
          <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/30 rounded-lg p-5 mb-5 border-l-4 border-amber-600">
            <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Current Campaign Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">Spend (MTD)</span>
                <span className="text-amber-400 font-semibold">{details.stats.spend}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">Leads Generated</span>
                <span className="text-amber-400 font-semibold">{details.stats.leads}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">CPL</span>
                <span className={cn(
                  "font-semibold",
                  cpl > campaign.targetCPL ? "text-red-400" : "text-green-400"
                )}>
                  {details.stats.cpl}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-sm">CTR</span>
                <span className="text-amber-400 font-semibold">{details.stats.ctr}</span>
              </div>
            </div>
          </div>
          
          {/* What This Means */}
          <div className="bg-zinc-800/50 rounded-lg p-5 mb-5 border-l-4 border-orange-600">
            <h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              What This Means
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">{details.whatMeans}</p>
          </div>
          
          {/* What To Say */}
          <div className="bg-zinc-800/50 rounded-lg p-5 mb-5 border-l-4 border-zinc-600">
            <h3 className="text-zinc-300 font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              What To Say
            </h3>
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4">
              <p className="text-zinc-300 text-sm italic leading-relaxed">{details.whatSay}</p>
            </div>
            <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1">
              <span className="capitalize">{event.type}</span> message template
            </p>
          </div>
          
          {/* Changes In Play */}
          <div className="bg-zinc-800/50 rounded-lg p-5 mb-5 border-l-4 border-orange-600">
            <h3 className="text-orange-400 font-semibold mb-3">Changes In Play</h3>
            <div className="space-y-2">
              {details.changes.map((change, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-orange-500 mt-0.5">→</span>
                  <span className="text-zinc-300">{change}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/30 rounded-lg p-5 border-l-4 border-amber-600">
            <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Next Steps
            </h3>
            <div className="space-y-3">
              {details.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-zinc-900 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-zinc-300 text-sm leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientRetentionPage() {
  const [view, setView] = useState<ViewType>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDayOfMonth = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);
  
  const filteredEvents = useMemo(() => {
    if (selectedCampaign === "all") return events;
    return events.filter(e => e.campaignId === selectedCampaign);
  }, [events, selectedCampaign]);
  
  const getEventsForDay = useCallback((day: number) => {
    return filteredEvents.filter(e => e.date.getDate() === day && e.date.getMonth() === month);
  }, [filteredEvents, month]);
  
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!draggedEvent) return;
    
    const newDate = new Date(year, month, day);
    setEvents(prev => prev.map(ev => 
      ev.id === draggedEvent.id 
        ? { ...ev, date: newDate, recurring: false }
        : ev
    ));
    setDraggedEvent(null);
  };
  
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") newDate.setMonth(prev.getMonth() - 1);
      else newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };
  
  const openEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };
  
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Client Retention
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Mission Control Dashboard</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50">
            {(["daily", "weekly", "monthly"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  view === v 
                    ? "bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Campaign Selector */}
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-600"
        >
          <option value="all">All Campaigns</option>
          {CAMPAIGNS.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50">
          <button 
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-zinc-700/50 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 font-medium text-amber-400 min-w-[160px] text-center">
            {monthName}
          </span>
          <button 
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-zinc-700/50 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-600 to-orange-700" />
          <span className="text-zinc-400">Loom Video</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-600 to-amber-700" />
          <span className="text-zinc-400">Client Call</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-zinc-700 to-zinc-800 border border-zinc-600" />
          <span className="text-zinc-400">Text/Check-in</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Week Headers */}
        <div className="grid grid-cols-7 bg-zinc-800/50 border-b border-zinc-700/50">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-xs font-medium text-amber-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[140px] bg-zinc-950/30 border-r border-b border-zinc-800/50" />
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            
            return (
              <div
                key={day}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                className={cn(
                  "min-h-[140px] p-2 border-r border-b border-zinc-800/50 transition-colors",
                  "hover:bg-zinc-800/30",
                  isToday && "bg-amber-950/20 border-amber-600/30"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-2",
                  isToday ? "text-amber-400" : "text-zinc-500"
                )}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => openEvent(event)}
                      onDragStart={(e) => handleDragStart(e, event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CAMPAIGNS.map(campaign => {
          const cpl = campaign.spend / campaign.leads;
          const isOverTarget = cpl > campaign.targetCPL;
          
          return (
            <div 
              key={campaign.id}
              className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-4 hover:border-amber-600/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-300">{campaign.name}</span>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  isOverTarget ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                )}>
                  {isOverTarget ? "↑" : "✓"}
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-400">${cpl.toFixed(0)}</div>
              <div className="text-xs text-zinc-500 mt-1">Target: ${campaign.targetCPL}</div>
            </div>
          );
        })}
      </div>
      
      {/* Event Modal */}
      <EventModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
