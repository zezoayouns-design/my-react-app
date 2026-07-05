import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Moon, Dumbbell, Briefcase, Coins, BrainCircuit, Flame, Settings as SettingsIcon,
  Check, Plus, Trash2, X, CalendarDays, Sparkles, ChevronRight, Target, Compass,
  Timer, BookOpen, TrendingUp, Search, Pin, Archive, Play, Pause, RotateCcw, ChevronDown
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

/* =============================================================================
   AZ LIFE OS — منظومة عبدالعزيز علاء
   عادات + مهام ورؤى + فوكس/بومودورو + دفتر وعقل ثاني + إحصائيات
   Palette: oxblood / burgundy / aged gold / cream — لغة AZ ATELIER البصرية
============================================================================= */

const COLORS = {
  bg: "#150C0E",
  surface: "#221317",
  surface2: "#2C171C",
  line: "#3D2228",
  cream: "#EDE1CC",
  muted: "#A8967D",
  gold: "#C79A56",
  goldSoft: "#8B6B37",
  burgundy: "#7A2333",
  burgundyBright: "#9A2E42",
  amber: "#D98C4A",
};

const FONT_DISPLAY = "'Aref Ruqaa', serif";
const FONT_BODY = "'Tajawal', sans-serif";

const ICONS = { spirit: Moon, health: Dumbbell, work: Briefcase, finance: Coins, mind: BrainCircuit };

const DEFAULT_HABIT_CONFIG = {
  domains: [
    { id: "spirit", name: "روحانيات", habits: [
      { id: "spirit-1", text: "الصلاة في وقتها" },
      { id: "spirit-2", text: "قراءة أو سماع قرآن" },
      { id: "spirit-3", text: "أذكار الصباح والمساء" },
    ]},
    { id: "health", name: "لياقة وصحة", habits: [
      { id: "health-1", text: "30 دقيقة حركة أو رياضة" },
      { id: "health-2", text: "مياه كفاية على مدار اليوم" },
      { id: "health-3", text: "نوم قبل الساعة 12" },
    ]},
    { id: "work", name: "شغل وإنتاجية", habits: [
      { id: "work-1", text: "أهم مهمة في اليوم (MIT)" },
      { id: "work-2", text: "بلوك تركيز عميق بدون تشتيت" },
      { id: "work-3", text: "صفر تسويف على حاجة مهمة" },
    ]},
    { id: "finance", name: "مالية", habits: [
      { id: "finance-1", text: "تسجيل مصاريف اليوم" },
      { id: "finance-2", text: "لا شراء عشوائي أو مندفع" },
      { id: "finance-3", text: "مراجعة سريعة للميزانية أو الادخار" },
    ]},
    { id: "mind", name: "عقلية ونفسية", habits: [
      { id: "mind-1", text: "يوميات أو تأمل قصير" },
      { id: "mind-2", text: "لحظة صمت أو تنفس واعي" },
      { id: "mind-3", text: "10 صفحات قراءة" },
    ]},
  ],
};

const MOOD_LABELS = ["ضايق", "متعب", "عادي", "كويس", "مبسوط"];

const LEVELS = [
  { name: "بذرة", min: 0 },
  { name: "غارس", min: 250 },
  { name: "مجتهد", min: 700 },
  { name: "راسخ", min: 1500 },
  { name: "حكيم", min: 3000 },
];

const MISSION_TYPES = [
  { id: "vision", label: "رؤية حياة" },
  { id: "annual", label: "هدف سنوي" },
  { id: "quarterly", label: "هدف ربع سنوي" },
  { id: "project", label: "مشروع" },
];

const PRIORITIES = [
  { id: "high", label: "عالية", color: "#D98C4A" },
  { id: "med", label: "متوسطة", color: "#C79A56" },
  { id: "low", label: "منخفضة", color: "#A8967D" },
];

function todayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function dayLabelAr(dateStr) {
  const days = ["أحد", "اتنين", "تلات", "أربع", "خميس", "جمعة", "سبت"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function emptyEntry() { return { checks: {}, mood: null, note: "" }; }

function computeEntryPoints(entry, config) {
  if (!entry) return 0;
  let pts = 0;
  const validIds = new Set(config.domains.flatMap(d => d.habits.map(h => h.id)));
  for (const id of Object.keys(entry.checks || {})) {
    if (entry.checks[id] && validIds.has(id)) pts += 10;
  }
  if (entry.mood) pts += 5;
  if (entry.note && entry.note.trim().length > 0) pts += 5;
  return pts;
}
function getLevel(totalPoints) {
  let current = LEVELS[0], next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalPoints >= LEVELS[i].min) { current = LEVELS[i]; next = LEVELS[i + 1] || null; }
  }
  return { current, next };
}
function domainStreak(logs, domain, uptoDate) {
  let streak = 0;
  let cursor = new Date(uptoDate + "T00:00:00");
  for (let i = 0; i < 400; i++) {
    const ds = cursor.toISOString().slice(0, 10);
    const entry = logs[ds];
    const hasAny = entry && domain.habits.some(h => entry.checks && entry.checks[h.id]);
    if (hasAny) { streak += 1; cursor.setDate(cursor.getDate() - 1); } else break;
  }
  return streak;
}

/* ------------------------------- Seal ring --------------------------------- */
function SealRing({ pct, size = 128, label = "AZ", sub = "" }) {
  const r = size / 2 - 10, c = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill={COLORS.surface2} stroke={COLORS.line} strokeWidth="1" />
        <circle cx={c} cy={c} r={r} fill="none" stroke={COLORS.gold} strokeWidth="4"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 2 * Math.PI;
          const x1 = c + (r + 8) * Math.cos(angle), y1 = c + (r + 8) * Math.sin(angle);
          const x2 = c + (r + 11) * Math.cos(angle), y2 = c + (r + 11) * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.goldSoft} strokeWidth="1.5" />;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.cream, letterSpacing: 1 }}>{label}</span>
        {sub && <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{sub}</span>}
      </div>
    </div>
  );
}

function SectionHeader({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.cream }}>{children}</span>
      {action}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 999, fontFamily: FONT_BODY, fontSize: 12.5, whiteSpace: "nowrap",
      border: `1px solid ${active ? COLORS.gold : COLORS.line}`,
      background: active ? "rgba(199,154,86,0.12)" : "transparent",
      color: active ? COLORS.gold : COLORS.muted, cursor: "pointer"
    }}>{children}</button>
  );
}

/* ------------------------------- Domain Card -------------------------------- */
function DomainCard({ domain, entry, streak, onToggle }) {
  const Icon = ICONS[domain.id] || Sparkles;
  const doneCount = domain.habits.filter(h => entry?.checks?.[h.id]).length;
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: COLORS.surface2, border: `1px solid ${COLORS.goldSoft}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={17} color={COLORS.gold} />
          </div>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: COLORS.cream }}>{domain.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.amber, fontSize: 13 }}>
          <Flame size={14} /><span style={{ fontFamily: FONT_BODY }}>{streak}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {domain.habits.map(h => {
          const checked = !!entry?.checks?.[h.id];
          return (
            <button key={h.id} onClick={() => onToggle(h.id)} style={{
              display: "flex", alignItems: "center", gap: 10, textAlign: "right",
              background: checked ? "rgba(199,154,86,0.1)" : "transparent",
              border: `1px solid ${checked ? COLORS.goldSoft : "transparent"}`,
              borderRadius: 10, padding: "8px 10px", cursor: "pointer", width: "100%"
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `1.5px solid ${checked ? COLORS.gold : COLORS.line}`,
                background: checked ? COLORS.gold : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>{checked && <Check size={13} color={COLORS.bg} strokeWidth={3} />}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: checked ? COLORS.cream : COLORS.muted }}>{h.text}</span>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: COLORS.muted, fontFamily: FONT_BODY }}>{doneCount} من {domain.habits.length}</div>
    </div>
  );
}

/* --------------------------------- Today view -------------------------------- */
function TodayView({ config, logs, date, toggleHabit, setMood, setNote, globalStreak, todayGregorian, pctToday }) {
  const todayEntry = logs[date] || emptyEntry();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 4px" }}>
        <SealRing pct={pctToday} sub={`${Math.round(pctToday)}٪ النهارده`} />
      </div>
      {config.domains.map(domain => (
        <DomainCard key={domain.id} domain={domain} entry={todayEntry}
          streak={domainStreak(logs, domain, date)} onToggle={(hid) => toggleHabit(hid)} />
      ))}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.cream }}>حالتك النهارده</span>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {MOOD_LABELS.map((label, i) => {
            const val = i + 1, active = todayEntry.mood === val;
            return (
              <button key={val} onClick={() => setMood(val)} style={{
                flex: 1, margin: "0 3px", padding: "8px 4px", borderRadius: 10,
                border: `1px solid ${active ? COLORS.gold : COLORS.line}`,
                background: active ? "rgba(199,154,86,0.12)" : "transparent",
                color: active ? COLORS.gold : COLORS.muted, fontFamily: FONT_BODY, fontSize: 12, cursor: "pointer"
              }}>{label}</button>
            );
          })}
        </div>
        <textarea value={todayEntry.note || ""} onChange={e => setNote(e.target.value)}
          placeholder="سطرين عن يومك... حاجة اتعلمتها، حاجة ممتن لها، حاجة عايز تحسنها بكرة"
          style={{ minHeight: 70, resize: "vertical", background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 10, color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13.5, outline: "none" }} />
      </div>
    </div>
  );
}

/* -------------------------------- Missions view ------------------------------ */
function MissionForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("annual");
  const [priority, setPriority] = useState("med");
  const [deadline, setDeadline] = useState("");

  return (
    <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الهدف أو الرؤية..."
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 14, outline: "none" }} />
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {MISSION_TYPES.map(t => <Chip key={t.id} active={type === t.id} onClick={() => setType(t.id)}>{t.label}</Chip>)}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {PRIORITIES.map(p => <Chip key={p.id} active={priority === p.id} onClick={() => setPriority(p.id)}>{p.label}</Chip>)}
      </div>
      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "transparent", color: COLORS.muted, fontFamily: FONT_BODY, cursor: "pointer" }}>إلغاء</button>
        <button onClick={() => { if (title.trim()) onSubmit({ title: title.trim(), type, priority, deadline }); }}
          style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none", background: COLORS.gold, color: COLORS.bg, fontFamily: FONT_BODY, fontWeight: 700, cursor: "pointer" }}>حفظ</button>
      </div>
    </div>
  );
}

function MissionCard({ mission, tasks, onDelete, onProgress, onOpenTasks }) {
  const linkedTasks = tasks.filter(t => t.missionId === mission.id);
  const done = linkedTasks.filter(t => t.done).length;
  const computedProgress = linkedTasks.length ? Math.round((done / linkedTasks.length) * 100) : mission.progress || 0;
  const typeLabel = MISSION_TYPES.find(t => t.id === mission.type)?.label || "";
  const pr = PRIORITIES.find(p => p.id === mission.priority) || PRIORITIES[1];
  const daysLeft = mission.deadline ? Math.ceil((new Date(mission.deadline) - new Date(todayStr())) / 86400000) : null;

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.cream }}>{mission.title}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.muted }}>{typeLabel}</span>
            <span style={{ width: 4, height: 4, borderRadius: 999, background: COLORS.line }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: pr.color }}>أولوية {pr.label}</span>
          </div>
        </div>
        <button onClick={() => onDelete(mission.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Trash2 size={15} color={COLORS.burgundyBright} />
        </button>
      </div>
      <div style={{ height: 6, background: COLORS.surface2, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${computedProgress}%`, height: "100%", background: COLORS.gold, transition: "width 0.4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.muted }}>
          {linkedTasks.length ? `${done} من ${linkedTasks.length} مهمة` : `${computedProgress}٪`}
          {daysLeft !== null && ` · ${daysLeft >= 0 ? `${daysLeft} يوم متبقي` : "انتهى الموعد"}`}
        </span>
        <button onClick={() => onOpenTasks(mission.id)} style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", color: COLORS.gold, fontFamily: FONT_BODY, fontSize: 12, cursor: "pointer" }}>
          المهام <ChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </div>
  );
}

function TaskForm({ missions, defaultMissionId, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [priority, setPriority] = useState("med");
  const [missionId, setMissionId] = useState(defaultMissionId || "");

  return (
    <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مهمة جديدة..."
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 14, outline: "none" }} />
      <div style={{ display: "flex", gap: 6 }}>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {PRIORITIES.map(p => <Chip key={p.id} active={priority === p.id} onClick={() => setPriority(p.id)}>{p.label}</Chip>)}
      </div>
      {missions.length > 0 && (
        <select value={missionId} onChange={e => setMissionId(e.target.value)}
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13 }}>
          <option value="">بدون هدف مرتبط</option>
          {missions.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "transparent", color: COLORS.muted, fontFamily: FONT_BODY, cursor: "pointer" }}>إلغاء</button>
        <button onClick={() => { if (title.trim()) onSubmit({ title: title.trim(), dueDate, priority, missionId: missionId || null }); }}
          style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none", background: COLORS.gold, color: COLORS.bg, fontFamily: FONT_BODY, fontWeight: 700, cursor: "pointer" }}>إضافة</button>
      </div>
    </div>
  );
}

function TaskRow({ task, mission, onToggle, onDelete }) {
  const pr = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[1];
  const isOverdue = !task.done && task.dueDate && task.dueDate < todayStr();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: `1px solid ${COLORS.line}` }}>
      <button onClick={() => onToggle(task.id)} style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${task.done ? COLORS.gold : COLORS.line}`,
        background: task.done ? COLORS.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
      }}>{task.done && <Check size={13} color={COLORS.bg} strokeWidth={3} />}</button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: task.done ? COLORS.muted : COLORS.cream, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          {task.dueDate && <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: isOverdue ? COLORS.burgundyBright : COLORS.muted }}>{task.dueDate}</span>}
          {mission && <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.goldSoft }}>· {mission.title}</span>}
          <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: pr.color }}>· {pr.label}</span>
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
        <Trash2 size={14} color={COLORS.muted} />
      </button>
    </div>
  );
}

function MissionsView({ missions, tasks, addMission, deleteMission, addTask, toggleTask, deleteTask }) {
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFilter, setTaskFilter] = useState("today");
  const [focusMissionId, setFocusMissionId] = useState(null);

  const today = todayStr();
  const weekEnd = todayStr(7);

  const filteredTasks = useMemo(() => {
    let base = tasks;
    if (focusMissionId) base = base.filter(t => t.missionId === focusMissionId);
    switch (taskFilter) {
      case "today": return base.filter(t => !t.done && t.dueDate === today);
      case "week": return base.filter(t => !t.done && t.dueDate && t.dueDate > today && t.dueDate <= weekEnd);
      case "upcoming": return base.filter(t => !t.done && (!t.dueDate || t.dueDate > weekEnd));
      case "overdue": return base.filter(t => !t.done && t.dueDate && t.dueDate < today);
      case "done": return base.filter(t => t.done);
      default: return base;
    }
  }, [tasks, taskFilter, focusMissionId, today, weekEnd]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <SectionHeader action={
          <button onClick={() => setShowMissionForm(s => !s)} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.goldSoft}`, borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <Plus size={15} color={COLORS.gold} />
          </button>
        }>الرؤى والأهداف</SectionHeader>
        {showMissionForm && (
          <div style={{ marginBottom: 12 }}>
            <MissionForm onCancel={() => setShowMissionForm(false)} onSubmit={(m) => { addMission(m); setShowMissionForm(false); }} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {missions.length === 0 && !showMissionForm && (
            <div style={{ color: COLORS.muted, fontFamily: FONT_BODY, fontSize: 13, textAlign: "center", padding: "20px 0" }}>لسه مفيش أهداف مسجلة. ابدأ برؤية حياة أو هدف سنوي.</div>
          )}
          {missions.map(m => (
            <MissionCard key={m.id} mission={m} tasks={tasks}
              onDelete={deleteMission}
              onOpenTasks={(id) => { setFocusMissionId(id === focusMissionId ? null : id); setTaskFilter("today"); }} />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader action={
          <button onClick={() => setShowTaskForm(s => !s)} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.goldSoft}`, borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <Plus size={15} color={COLORS.gold} />
          </button>
        }>المهام {focusMissionId && missions.find(m => m.id === focusMissionId) ? `· ${missions.find(m => m.id === focusMissionId).title}` : ""}</SectionHeader>
        {showTaskForm && (
          <div style={{ marginBottom: 12 }}>
            <TaskForm missions={missions} defaultMissionId={focusMissionId}
              onCancel={() => setShowTaskForm(false)}
              onSubmit={(t) => { addTask(t); setShowTaskForm(false); }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 2 }}>
          {[
            { id: "today", label: "النهاردة" }, { id: "week", label: "الأسبوع" },
            { id: "upcoming", label: "قادم" }, { id: "overdue", label: "متأخر" }, { id: "done", label: "مكتمل" },
          ].map(f => <Chip key={f.id} active={taskFilter === f.id} onClick={() => setTaskFilter(f.id)}>{f.label}</Chip>)}
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "4px 12px" }}>
          {filteredTasks.length === 0 && (
            <div style={{ color: COLORS.muted, fontFamily: FONT_BODY, fontSize: 13, textAlign: "center", padding: "20px 0" }}>مفيش مهام هنا.</div>
          )}
          {filteredTasks.map(t => (
            <TaskRow key={t.id} task={t} mission={missions.find(m => m.id === t.missionId)}
              onToggle={toggleTask} onDelete={deleteTask} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Focus view --------------------------------- */
function FocusView({ focusMinutesByDate, addFocusMinutes, pomodoroLength, setPomodoroLength }) {
  const [secondsLeft, setSecondsLeft] = useState(pomodoroLength * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => { if (!running) setSecondsLeft(pomodoroLength * 60); }, [pomodoroLength]); // eslint-disable-line

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setSessions(n => n + 1);
            addFocusMinutes(pomodoroLength);
            return pomodoroLength * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]); // eslint-disable-line

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const pct = 100 - (secondsLeft / (pomodoroLength * 60)) * 100;
  const todayMinutes = focusMinutesByDate[todayStr()] || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[25, 50, 90].map(len => (
          <Chip key={len} active={pomodoroLength === len && !running} onClick={() => { if (!running) setPomodoroLength(len); }}>{len} د</Chip>
        ))}
      </div>

      <div style={{ padding: "10px 0" }}>
        <SealRing pct={pct} size={200} label={`${mins}:${secs}`} sub={running ? "جاري التركيز..." : "جاهز"} />
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <button onClick={() => { setRunning(false); setSecondsLeft(pomodoroLength * 60); }}
          style={{ width: 52, height: 52, borderRadius: 999, border: `1px solid ${COLORS.line}`, background: COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <RotateCcw size={18} color={COLORS.muted} />
        </button>
        <button onClick={() => setRunning(r => !r)}
          style={{ width: 72, height: 72, borderRadius: 999, border: "none", background: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {running ? <Pause size={26} color={COLORS.bg} /> : <Play size={26} color={COLORS.bg} style={{ marginRight: -3 }} />}
        </button>
        <div style={{ width: 52 }} />
      </div>

      <div style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.gold }}>{todayMinutes}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.muted }}>دقيقة النهارده</div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.gold }}>{sessions}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.muted }}>جلسة دلوقتي</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Journal view --------------------------------- */
function NoteForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");
  return (
    <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان..."
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 14, outline: "none" }} />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="اكتب فكرتك أو ملاحظتك هنا..."
        style={{ minHeight: 90, resize: "vertical", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10, color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13.5, outline: "none" }} />
      <input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="تاجات مفصولة بفاصلة، مثال: أفكار، شغل"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "9px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${COLORS.line}`, background: "transparent", color: COLORS.muted, fontFamily: FONT_BODY, cursor: "pointer" }}>إلغاء</button>
        <button onClick={() => { if (title.trim() || content.trim()) onSubmit({ title: title.trim() || "بدون عنوان", content: content.trim(), tags: tagsText.split(",").map(t => t.trim()).filter(Boolean) }); }}
          style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none", background: COLORS.gold, color: COLORS.bg, fontFamily: FONT_BODY, fontWeight: 700, cursor: "pointer" }}>حفظ</button>
      </div>
    </div>
  );
}

function NoteCard({ note, onTogglePin, onToggleArchive, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${note.pinned ? COLORS.goldSoft : COLORS.line}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "right", flex: 1 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.cream }}>{note.title}</span>
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onTogglePin(note.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Pin size={14} color={note.pinned ? COLORS.gold : COLORS.muted} fill={note.pinned ? COLORS.gold : "none"} />
          </button>
          <button onClick={() => onToggleArchive(note.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Archive size={14} color={note.archived ? COLORS.gold : COLORS.muted} />
          </button>
          <button onClick={() => onDelete(note.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Trash2 size={14} color={COLORS.burgundyBright} />
          </button>
        </div>
      </div>
      <p style={{
        fontFamily: FONT_BODY, fontSize: 13.5, color: COLORS.muted, margin: 0, whiteSpace: "pre-wrap",
        display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 3, WebkitBoxOrient: "vertical", overflow: "hidden"
      }}>{note.content}</p>
      {note.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {note.tags.map(tag => (
            <span key={tag} style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: COLORS.gold, background: "rgba(199,154,86,0.1)", padding: "3px 8px", borderRadius: 999 }}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function JournalView({ notes, addNote, togglePin, toggleArchive, deleteNote }) {
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    return notes
      .filter(n => !!n.archived === showArchived)
      .filter(n => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags?.some(t => t.toLowerCase().includes(q));
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
  }, [notes, query, showArchived]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionHeader action={
        <button onClick={() => setShowForm(s => !s)} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.goldSoft}`, borderRadius: 8, padding: 6, cursor: "pointer" }}>
          <Plus size={15} color={COLORS.gold} />
        </button>
      }>الدفتر والعقل الثاني</SectionHeader>

      {showForm && <NoteForm onCancel={() => setShowForm(false)} onSubmit={(n) => { addNote(n); setShowForm(false); }} />}

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "8px 12px" }}>
        <Search size={15} color={COLORS.muted} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث في الملاحظات والتاجات..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13.5 }} />
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Chip active={!showArchived} onClick={() => setShowArchived(false)}>الملاحظات</Chip>
        <Chip active={showArchived} onClick={() => setShowArchived(true)}>الأرشيف</Chip>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ color: COLORS.muted, fontFamily: FONT_BODY, fontSize: 13, textAlign: "center", padding: "20px 0" }}>مفيش ملاحظات هنا لسه.</div>
        )}
        {filtered.map(n => (
          <NoteCard key={n.id} note={n} onTogglePin={togglePin} onToggleArchive={toggleArchive} onDelete={deleteNote} />
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Stats view -------------------------------- */
function StatsView({ logs, config, tasks, focusMinutesByDate }) {
  const days = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const ds = todayStr(-i);
      arr.push({
        date: ds, label: dayLabelAr(ds),
        points: computeEntryPoints(logs[ds], config),
        focus: focusMinutesByDate[ds] || 0,
      });
    }
    return arr;
  }, [logs, config, focusMinutesByDate]);

  const totalPoints = Object.values(logs).reduce((s, e) => s + computeEntryPoints(e, config), 0);
  const { current, next } = getLevel(totalPoints);
  const pctToNext = next ? Math.min(100, Math.round(((totalPoints - current.min) / (next.min - current.min)) * 100)) : 100;
  const doneTasks = tasks.filter(t => t.done).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: COLORS.gold }}>{current.name}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: COLORS.muted }}>
            {totalPoints} نقطة{next ? ` · ${next.min - totalPoints} للمستوى الجاي` : " · أعلى مستوى"}
          </span>
        </div>
        <div style={{ height: 6, background: COLORS.surface2, borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: `${pctToNext}%`, height: "100%", background: COLORS.gold, transition: "width 0.5s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.gold }}>{doneTasks}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.muted }}>مهمة اتنجزت</div>
        </div>
        <div style={{ flex: 1, background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: COLORS.gold }}>
            {Object.values(focusMinutesByDate).reduce((s, v) => s + v, 0)}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.muted }}>دقيقة فوكس إجمالي</div>
        </div>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "18px 10px 8px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.cream, padding: "0 10px 8px" }}>نقاط آخر 7 أيام</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={days} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "Tajawal" }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontFamily: "Tajawal" }} labelStyle={{ color: COLORS.cream }} itemStyle={{ color: COLORS.gold }} />
            <Bar dataKey="points" radius={[4, 4, 0, 0]} fill={COLORS.gold} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: "18px 10px 8px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: COLORS.cream, padding: "0 10px 8px" }}>دقائق الفوكس آخر 7 أيام</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={days} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.line} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: COLORS.muted, fontSize: 11, fontFamily: "Tajawal" }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontFamily: "Tajawal" }} labelStyle={{ color: COLORS.cream }} itemStyle={{ color: COLORS.amber }} />
            <Bar dataKey="focus" radius={[4, 4, 0, 0]} fill={COLORS.amber} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* -------------------------------- Settings view ------------------------------ */
function SettingsView({ config, setConfig, onClose }) {
  const [newHabitText, setNewHabitText] = useState({});
  function addHabit(domainId) {
    const text = (newHabitText[domainId] || "").trim();
    if (!text) return;
    setConfig(prev => ({ ...prev, domains: prev.domains.map(d => d.id === domainId ? { ...d, habits: [...d.habits, { id: `${domainId}-${uid()}`, text }] } : d) }));
    setNewHabitText(p => ({ ...p, [domainId]: "" }));
  }
  function removeHabit(domainId, habitId) {
    setConfig(prev => ({ ...prev, domains: prev.domains.map(d => d.id === domainId ? { ...d, habits: d.habits.filter(h => h.id !== habitId) } : d) }));
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: COLORS.bg, zIndex: 50, overflowY: "auto" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 18px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: COLORS.cream }}>الإعدادات</span>
          <button onClick={onClose} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: 8, cursor: "pointer" }}>
            <X size={16} color={COLORS.muted} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {config.domains.map(domain => {
            const Icon = ICONS[domain.id] || Sparkles;
            return (
              <div key={domain.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Icon size={16} color={COLORS.gold} />
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.cream }}>{domain.name}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {domain.habits.map(h => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted }}>{h.text}</span>
                      <button onClick={() => removeHabit(domain.id, h.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <Trash2 size={15} color={COLORS.burgundyBright} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <input value={newHabitText[domain.id] || ""} onChange={e => setNewHabitText(p => ({ ...p, [domain.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addHabit(domain.id)} placeholder="عادة جديدة..."
                    style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 10px", color: COLORS.cream, fontFamily: FONT_BODY, fontSize: 13.5, outline: "none" }} />
                  <button onClick={() => addHabit(domain.id)} style={{ background: COLORS.gold, border: "none", borderRadius: 8, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={16} color={COLORS.bg} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------- App ------------------------------------ */
export default function App() {
  const [config, setConfig] = useState(DEFAULT_HABIT_CONFIG);
  const [logs, setLogs] = useState({});
  const [missions, setMissions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [focusMinutesByDate, setFocusMinutesByDate] = useState({});
  const [pomodoroLength, setPomodoroLength] = useState(25);

  const [tab, setTab] = useState("today");
  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const saveTimer = useRef(null);
  const date = todayStr();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Tajawal:wght@300;400;500;700;900&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("az-life-os-state");
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed.config) setConfig(parsed.config);
          if (parsed.logs) setLogs(parsed.logs);
          if (parsed.missions) setMissions(parsed.missions);
          if (parsed.tasks) setTasks(parsed.tasks);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.focusMinutesByDate) setFocusMinutesByDate(parsed.focusMinutesByDate);
          if (parsed.pomodoroLength) setPomodoroLength(parsed.pomodoroLength);
        }
      } catch (e) { /* fresh start */ }
      finally { setLoaded(true); }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const result = await window.storage.set("az-life-os-state", JSON.stringify({
          config, logs, missions, tasks, notes, focusMinutesByDate, pomodoroLength
        }));
        setSaveError(!result);
      } catch (e) { setSaveError(true); }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [config, logs, missions, tasks, notes, focusMinutesByDate, pomodoroLength, loaded]);

  const todayEntry = logs[date] || emptyEntry();

  function toggleHabit(habitId) {
    setLogs(prev => {
      const entry = prev[date] || emptyEntry();
      return { ...prev, [date]: { ...entry, checks: { ...entry.checks, [habitId]: !entry.checks[habitId] } } };
    });
  }
  function setMood(mood) {
    setLogs(prev => { const entry = prev[date] || emptyEntry(); return { ...prev, [date]: { ...entry, mood } }; });
  }
  function setNote(note) {
    setLogs(prev => { const entry = prev[date] || emptyEntry(); return { ...prev, [date]: { ...entry, note } }; });
  }

  function addMission(m) { setMissions(prev => [...prev, { id: uid(), progress: 0, status: "active", ...m }]); }
  function deleteMission(id) { setMissions(prev => prev.filter(m => m.id !== id)); setTasks(prev => prev.map(t => t.missionId === id ? { ...t, missionId: null } : t)); }

  function addTask(t) { setTasks(prev => [...prev, { id: uid(), done: false, createdAt: Date.now(), ...t }]); }
  function toggleTask(id) { setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id) { setTasks(prev => prev.filter(t => t.id !== id)); }

  function addNote(n) { setNotes(prev => [...prev, { id: uid(), pinned: false, archived: false, createdAt: Date.now(), ...n }]); }
  function togglePin(id) { setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)); }
  function toggleArchive(id) { setNotes(prev => prev.map(n => n.id === id ? { ...n, archived: !n.archived } : n)); }
  function deleteNote(id) { setNotes(prev => prev.filter(n => n.id !== id)); }

  function addFocusMinutes(mins) { setFocusMinutesByDate(prev => ({ ...prev, [date]: (prev[date] || 0) + mins })); }

  const totalHabitsToday = config.domains.reduce((s, d) => s + d.habits.length, 0);
  const doneHabitsToday = config.domains.reduce((s, d) => s + d.habits.filter(h => todayEntry.checks?.[h.id]).length, 0);
  const pctToday = totalHabitsToday ? (doneHabitsToday / totalHabitsToday) * 100 : 0;
  const globalStreak = domainStreak(logs, { habits: config.domains.flatMap(d => d.habits) }, date);
  const todayGregorian = new Date(date + "T00:00:00").toLocaleDateString("ar-EG", { day: "numeric", month: "long" });

  if (!loaded) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: COLORS.muted, fontFamily: FONT_BODY }}>...جاري التحميل</span>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: "today", label: "النهاردة", icon: Sparkles },
    { id: "missions", label: "الأهداف", icon: Compass },
    { id: "focus", label: "فوكس", icon: Timer },
    { id: "journal", label: "الدفتر", icon: BookOpen },
    { id: "stats", label: "إحصائيات", icon: TrendingUp },
  ];

  return (
    <div dir="rtl" style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.cream, fontFamily: FONT_BODY, paddingBottom: 90 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.cream, letterSpacing: 0.5 }}>منظومة AZ اليومية</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: COLORS.muted, fontSize: 12.5 }}>
              <CalendarDays size={13} /><span>{todayGregorian}</span>
              <span style={{ color: COLORS.line }}>·</span>
              <Flame size={13} color={COLORS.amber} /><span>{globalStreak} يوم متتالي</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: 9, cursor: "pointer" }}>
            <SettingsIcon size={16} color={COLORS.muted} />
          </button>
        </div>

        {saveError && <div style={{ fontSize: 11, color: COLORS.burgundyBright, marginBottom: 10 }}>تعذر الحفظ التلقائي — البيانات لسه محفوظة في الجلسة الحالية.</div>}

        {tab === "today" && (
          <TodayView config={config} logs={logs} date={date} toggleHabit={toggleHabit} setMood={setMood} setNote={setNote}
            globalStreak={globalStreak} todayGregorian={todayGregorian} pctToday={pctToday} />
        )}
        {tab === "missions" && (
          <MissionsView missions={missions} tasks={tasks} addMission={addMission} deleteMission={deleteMission}
            addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} />
        )}
        {tab === "focus" && (
          <FocusView focusMinutesByDate={focusMinutesByDate} addFocusMinutes={addFocusMinutes}
            pomodoroLength={pomodoroLength} setPomodoroLength={setPomodoroLength} />
        )}
        {tab === "journal" && (
          <JournalView notes={notes} addNote={addNote} togglePin={togglePin} toggleArchive={toggleArchive} deleteNote={deleteNote} />
        )}
        {tab === "stats" && (
          <StatsView logs={logs} config={config} tasks={tasks} focusMinutesByDate={focusMinutesByDate} />
        )}
      </div>

      {showSettings && <SettingsView config={config} setConfig={setConfig} onClose={() => setShowSettings(false)} />}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: COLORS.surface, borderTop: `1px solid ${COLORS.line}`, display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 480, width: "100%", display: "flex" }}>
          {NAV_ITEMS.map(t => {
            const Icon = t.icon, active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, background: "none", border: "none", padding: "12px 0 14px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                color: active ? COLORS.gold : COLORS.muted, cursor: "pointer"
              }}>
                <Icon size={18} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 10.5 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
