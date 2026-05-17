import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RT,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
  RadialBarChart, RadialBar,
} from 'recharts';

/* ── Greet ── */
function greet() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/* ── Theme-aware colors ── */
function getColors(isDark) {
  return {
    todo:       isDark ? '#5B7FFF' : '#4361EE',
    inProgress: '#F59E0B',
    review:     isDark ? '#22D3EE' : '#06B6D4',
    done:       '#10B981',
    low:        isDark ? '#4B5563' : '#94A3B8',
    medium:     isDark ? '#60A5FA' : '#3B82F6',
    high:       isDark ? '#FB923C' : '#F97316',
    critical:   isDark ? '#F87171' : '#EF4444',
    grid:       isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,27,61,0.05)',
    tick:       isDark ? '#383F60' : '#9AA5C5',
    tooltipBg:  isDark ? '#0E1018' : '#F8F9FF',
    tooltipBorder: isDark ? '#1E2235' : '#D8DDEF',
  };
}

/* ── Custom Tooltip ── */
function Tip({ active, payload, label, colors }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: colors?.tooltipBg || '#fff',
      border: `1px solid ${colors?.tooltipBorder || '#ddd'}`,
      borderRadius: 10, padding: '10px 14px',
      fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 5, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color || p.stroke, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── KPI Card ── */
function KPI({ label, value, sub, icon, gradient, delay = 0, accentColor }) {
  return (
    <div className="kpi-card" style={{
      background: gradient,
      animationDelay: `${delay}s`,
      opacity: 0,
      animation: `fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
      boxShadow: `0 8px 28px ${accentColor}30`,
    }}>
      {/* Decorative orb */}
      <div style={{
        position: 'absolute', width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', top: -20, right: -20,
        animation: 'orb 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 50, height: 50, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)', bottom: 10, left: 10,
        animation: 'orb 11s ease-in-out infinite reverse',
      }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: 'rgba(255,255,255,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', marginBottom: '0.9rem',
        backdropFilter: 'blur(8px)',
        position: 'relative',
      }}>{icon}</div>

      {/* Value */}
      <div style={{
        fontSize: '2.1rem', fontWeight: 800, color: 'white',
        letterSpacing: '-2px', lineHeight: 1, marginBottom: 4,
        fontFamily: 'Outfit, sans-serif', position: 'relative',
      }}>{value}</div>

      {/* Label */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 0.6, position: 'relative' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, position: 'relative' }}>{sub}</div>}
    </div>
  );
}

/* ── Panel ── */
function Panel({ title, sub, right, children, delay = 0, style = {} }) {
  return (
    <div className="dash-panel" style={{
      opacity: 0, animation: `fadeUp 0.4s ease ${delay}s forwards`, ...style
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 3 }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ── Thin progress bar ── */
function HBar({ pct, color, height = 6 }) {
  return (
    <div style={{ height, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`, borderRadius: 99,
        background: color, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 8px ${color}55`,
      }} />
    </div>
  );
}

/* ── Status legend row ── */
function StatusRow({ name, value, total, color }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}80` }} />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{name}</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>
          {value} <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>· {pct}%</span>
        </span>
      </div>
      <HBar pct={pct} color={color} />
    </div>
  );
}

/* ── Task row ── */
function TRow({ task, onClick, colors }) {
  const today = new Date().toISOString().split('T')[0];
  const od = task.due_date && task.due_date < today && task.status !== 'done';
  const sMap = { todo: colors.todo, 'in-progress': colors.inProgress, review: colors.review, done: colors.done };
  const pMap = { low: colors.low, medium: colors.medium, high: colors.high, critical: colors.critical };
  const sc = sMap[task.status] || colors.low;
  const pc = pMap[task.priority] || colors.low;
  const sLabel = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };

  return (
    <div onClick={onClick} className="task-table-row">
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: od ? colors.critical : sc, flexShrink: 0, boxShadow: `0 0 6px ${od ? colors.critical : sc}88` }} />
      <span style={{ flex: 2, fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{task.title}</span>
      <span style={{ flex: 1, fontSize: 11, color: 'var(--text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{task.project_name}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${pc}18`, color: pc, textTransform: 'capitalize', flexShrink: 0 }}>{task.priority}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: od ? `${colors.critical}18` : `${sc}18`, color: od ? colors.critical : sc, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {od ? 'Overdue' : sLabel[task.status] || task.status}
      </span>
      {task.due_date && <span style={{ fontSize: 10.5, color: od ? colors.critical : 'var(--text-subtle)', flexShrink: 0, minWidth: 74, textAlign: 'right' }}>{task.due_date}</span>}
    </div>
  );
}

/* ── Empty ── */
const Empty = ({ msg, icon = '📭' }) => (
  <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
    <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>
    <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{msg}</p>
  </div>
);

/* ── Skeleton ── */
function Skeleton() {
  const s = (h) => <div className="skeleton" style={{ height: h, borderRadius: 14 }} />;
  return (
    <div style={{ padding: '2rem', maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ height: 120, background: 'var(--surface-1)', borderRadius: 20, border: '1px solid var(--border)' }}>{s(120)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '1rem' }}>{[...Array(6)].map((_, i) => <div key={i}>{s(120)}</div>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>{[...Array(3)].map((_, i) => <div key={i}>{s(310)}</div>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>{[...Array(2)].map((_, i) => <div key={i}>{s(300)}</div>)}</div>
    </div>
  );
}

/* ── Donut center label ── */
function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-7" style={{ fill: 'var(--text-primary)', fontSize: 24, fontWeight: 800 }}>{total}</tspan>
      <tspan x={cx} dy="20" style={{ fill: 'var(--text-subtle)', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>TASKS</tspan>
    </text>
  );
}

/* ── 3D Bar shape ── */
function Bar3D({ x, y, width, height, fill }) {
  if (!height || height <= 0) return null;
  const r = 5;
  return (
    <g>
      <path d={`M${x},${y+r} Q${x},${y} ${x+r},${y} L${x+width-r},${y} Q${x+width},${y} ${x+width},${y+r} L${x+width},${y+height} L${x},${y+height} Z`}
        fill={fill} opacity={0.92} />
      <path d={`M${x},${y+r} Q${x},${y} ${x+r},${y} L${x+width-r},${y} Q${x+width},${y} ${x+width},${y+r} L${x+width},${y+r+8} Q${x+width/2},${y+16} ${x},${y+r+8} Z`}
        fill="rgba(255,255,255,0.2)" />
      <rect x={x+width-5} y={y} width={5} height={height} fill="rgba(0,0,0,0.1)" />
    </g>
  );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute('data-theme') || 'light')
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const isDark = theme === 'dark';
  const C = getColors(isDark);

  if (!data) return <Skeleton />;

  const {
    stats = {}, recentTasks = [], overdueTasks = [],
    workspaceCount = 0, tasksByPriority = [],
    projectWorkload = [], completionRate = 0,
  } = data;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const healthScore = stats.total > 0
    ? Math.max(0, Math.round(100 - (stats.overdue / stats.total) * 40 + (stats.done / stats.total) * 20))
    : 100;
  const healthColor = healthScore >= 80 ? C.done : healthScore >= 60 ? C.inProgress : C.critical;

  const statusData = [
    { name: 'To Do',       value: stats.todo || 0,       color: C.todo },
    { name: 'In Progress', value: stats.inProgress || 0, color: C.inProgress },
    { name: 'In Review',   value: stats.review || 0,     color: C.review },
    { name: 'Done',        value: stats.done || 0,       color: C.done },
  ].filter(s => s.value > 0);

  const priorityData = [
    { name: 'Low',    value: tasksByPriority.find(p => p.name==='Low')?.value||0,    color: C.low },
    { name: 'Medium', value: tasksByPriority.find(p => p.name==='Medium')?.value||0, color: C.medium },
    { name: 'High',   value: tasksByPriority.find(p => p.name==='High')?.value||0,   color: C.high },
    { name: 'Crit.',  value: tasksByPriority.find(p => p.name==='Critical')?.value||0,color: C.critical },
  ];

  const spark = [0,1,2,3,4,5,6].map(i => ({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    done: Math.max(0, (stats.done||0) - (6-i) * Math.ceil((stats.done||0)/7)),
  }));

  const gaugeData = [{ value: healthScore, fill: healthColor }];
  const navTo = t => nav(`/projects/${t.project_id}`);

  const TH = ({ cols }) => (
    <div style={{ display:'flex', gap:10, padding:'0 10px 8px', borderBottom:'1px solid var(--border)', marginBottom:4 }}>
      {cols.map(h => (
        <span key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-subtle)', textTransform:'uppercase', letterSpacing:0.5, flex: h==='Task'?2:h==='Project'?1:0 }}>{h}</span>
      ))}
    </div>
  );

  /* gradient helpers */
  const kpiGrads = [
    { gradient: isDark ? 'linear-gradient(135deg,#3451D1,#5B7FFF)' : 'linear-gradient(135deg,#4361EE,#3A86FF)', accent: C.todo },
    { gradient: isDark ? 'linear-gradient(135deg,#059669,#10B981)' : 'linear-gradient(135deg,#059669,#34D399)', accent: C.done },
    { gradient: isDark ? 'linear-gradient(135deg,#D97706,#F59E0B)' : 'linear-gradient(135deg,#D97706,#FBBF24)', accent: C.inProgress },
    { gradient: isDark ? 'linear-gradient(135deg,#0284C7,#22D3EE)' : 'linear-gradient(135deg,#0284C7,#06B6D4)', accent: C.review },
    { gradient: isDark ? 'linear-gradient(135deg,#DC2626,#F87171)' : 'linear-gradient(135deg,#DC2626,#EF4444)', accent: C.critical },
    { gradient: isDark ? 'linear-gradient(135deg,#7C3AED,#A78BFA)' : 'linear-gradient(135deg,#6D28D9,#8B5CF6)', accent: isDark?'#A78BFA':'#8B5CF6' },
  ];

  return (
    <div style={{ maxWidth:1440, margin:'0 auto', padding:'1.75rem 2rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* ━━ HERO HEADER ━━ */}
      <div style={{
        background: isDark
          ? 'linear-gradient(135deg, #0E1018 0%, #141720 100%)'
          : 'linear-gradient(135deg, #4361EE 0%, #3A86FF 60%, #06B6D4 100%)',
        borderRadius: 20,
        padding: '2rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        border: isDark ? '1px solid var(--border)' : 'none',
        boxShadow: isDark ? 'var(--shadow-md)' : '0 12px 40px rgba(67,97,238,0.35)',
        opacity: 0,
        animation: 'fadeUp 0.4s ease forwards',
      }}>
        {/* BG orbs */}
        {[
          { w:180, h:180, top:-40, right:60, op:0.15 },
          { w:120, h:120, top:30, right:220, op:0.10 },
          { w:80, h:80, bottom:-20, left:200, op:0.10 },
        ].map((o,i) => (
          <div key={i} style={{
            position:'absolute', width:o.w, height:o.h, borderRadius:'50%',
            background: isDark ? `rgba(91,127,255,${o.op})` : `rgba(255,255,255,${o.op})`,
            top:o.top, right:o.right, bottom:o.bottom, left:o.left,
            animation:`orb ${10+i*3}s ease-in-out infinite`,
            pointerEvents:'none',
          }}/>
        ))}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem', position:'relative' }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:6,
              color: isDark ? 'var(--text-muted)' : 'rgba(255,255,255,0.75)' }}>{today}</p>
            <h1 style={{ fontSize:'1.9rem', fontWeight:800, letterSpacing:'-0.6px', margin:0, fontFamily:'Outfit,sans-serif',
              color: isDark ? 'var(--text-primary)' : 'white' }}>
              {greet()}, <span style={{ opacity:0.9 }}>{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ marginTop:6, fontSize:13.5,
              color: isDark ? 'var(--text-secondary)' : 'rgba(255,255,255,0.8)' }}>
              Here's your complete workspace overview for today.
            </p>
          </div>

          {/* Health pill + summary */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              background: isDark ? 'var(--surface-2)' : 'rgba(255,255,255,0.18)',
              backdropFilter:'blur(12px)',
              border: isDark ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.25)',
              borderRadius:12, padding:'10px 18px',
            }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:healthColor, boxShadow:`0 0 10px ${healthColor}` }} />
              <span style={{ fontSize:13, fontWeight:600, color: isDark ? 'var(--text-secondary)' : 'rgba(255,255,255,0.9)' }}>
                Health: <strong style={{ color: isDark ? healthColor : 'white' }}>{healthScore}/100</strong>
              </span>
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background: isDark ? 'var(--surface-2)' : 'rgba(255,255,255,0.18)',
              backdropFilter:'blur(12px)',
              border: isDark ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.25)',
              borderRadius:12, padding:'10px 18px', fontSize:13,
              color: isDark ? 'var(--text-secondary)' : 'rgba(255,255,255,0.9)',
            }}>
              📋 {stats.total} tasks · ✅ {completionRate}% · ⚠️ {stats.overdue||0} overdue
            </div>
          </div>
        </div>

        {/* Segmented progress */}
        <div style={{ marginTop:'1.5rem', position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ display:'flex', gap:18, flexWrap:'wrap' }}>
              {[['To Do', stats.todo, C.todo],['In Progress', stats.inProgress, C.inProgress],['Review', stats.review, C.review],['Done', stats.done, C.done]].map(([l,v,c])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:c }} />
                  <span style={{ fontSize:11.5, color: isDark?'var(--text-muted)':'rgba(255,255,255,0.75)' }}>{l}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: isDark?'var(--text-primary)':'white' }}>{v||0}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, color: isDark?'var(--text-subtle)':'rgba(255,255,255,0.6)' }}>
              Distribution
            </span>
          </div>
          <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', gap:2, background: isDark?'var(--surface-3)':'rgba(255,255,255,0.2)' }}>
            {stats.total > 0
              ? [{v:stats.todo,c:C.todo},{v:stats.inProgress,c:C.inProgress},{v:stats.review,c:C.review},{v:stats.done,c:C.done}]
                  .filter(s=>s.v>0)
                  .map((s,i)=><div key={i} style={{ flex:s.v, background:s.c, borderRadius:2, boxShadow:`0 0 8px ${s.c}80` }} />)
              : <div style={{ flex:1, background:'rgba(255,255,255,0.1)' }} />}
          </div>
        </div>
      </div>

      {/* ━━ KPI GRID ━━ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem' }}>
        <KPI label="Total Tasks"  value={stats.total}          icon="📋" delay={0.05} sub={`${stats.todo||0} pending`}    {...kpiGrads[0]} />
        <KPI label="Completion"   value={`${completionRate}%`} icon="🎯" delay={0.10} sub={`${stats.done||0} completed`}   {...kpiGrads[1]} />
        <KPI label="In Progress"  value={stats.inProgress||0}  icon="⚡" delay={0.15} sub="being worked on"               {...kpiGrads[2]} />
        <KPI label="In Review"    value={stats.review||0}      icon="🔍" delay={0.20} sub="awaiting approval"             {...kpiGrads[3]} />
        <KPI label="Overdue"      value={stats.overdue||0}     icon="⚠️" delay={0.25} sub={stats.overdue>0?'needs action':'all on track'} {...kpiGrads[4]} />
        <KPI label="Workspaces"   value={workspaceCount}       icon="🏢" delay={0.30} sub="you're a member of"            {...kpiGrads[5]} />
      </div>

      {/* ━━ CHARTS ROW ━━ */}
      <div className="dash-grid-3" style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:'1.25rem' }}>

        {/* ── Donut Status ── */}
        <Panel title="Task Status" sub="Breakdown by current status" delay={0.35}>
          {stats.total === 0 ? <Empty msg="No tasks yet" /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ height:210, filter:`drop-shadow(0 8px 24px ${C.todo}22)` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {statusData.map((s,i) => (
                        <radialGradient key={i} id={`donut${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={s.color} stopOpacity={1} />
                          <stop offset="100%" stopColor={s.color} stopOpacity={0.7} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {statusData.map((e,i) => (
                        <Cell key={i} fill={`url(#donut${i})`}
                          style={{ filter:`drop-shadow(0 4px 10px ${e.color}55)` }} />
                      ))}
                      <DonutLabel cx={0} cy={0} total={stats.total} />
                    </Pie>
                    <RT content={<Tip colors={C} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                {[['To Do',stats.todo||0,C.todo],['In Progress',stats.inProgress||0,C.inProgress],['Review',stats.review||0,C.review],['Done',stats.done||0,C.done]].map(([n,v,c])=>(
                  <StatusRow key={n} name={n} value={v} total={stats.total} color={c} />
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* ── 3D Priority Bar ── */}
        <Panel title="Priority Breakdown" sub="Tasks by urgency level" delay={0.40}>
          {stats.total === 0 ? <Empty msg="No tasks yet" /> : (
            <div style={{ height:340, filter:`drop-shadow(0 6px 20px rgba(0,0,0,0.08))` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barSize={36} margin={{ top:8, right:8, left:-18, bottom:0 }}>
                  <defs>
                    {priorityData.map((p,i)=>(
                      <linearGradient key={i} id={`pg${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={p.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={p.color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill:C.tick, fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:C.tick, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RT content={<Tip colors={C} />} cursor={{ fill:'var(--accent-subtle)' }} />
                  <Bar dataKey="value" name="Tasks" radius={[6,6,0,0]} shape={<Bar3D />}>
                    {priorityData.map((_,i)=><Cell key={i} fill={`url(#pg${i})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* ── Area Trend ── */}
        <Panel title="Completion Trend" sub="Tasks done over this week" delay={0.45}>
          <div style={{ height:340, filter:`drop-shadow(0 6px 20px ${C.todo}18)` }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top:8, right:8, left:-18, bottom:0 }}>
                <defs>
                  <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.todo} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C.todo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fill:C.tick, fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:C.tick, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RT content={<Tip colors={C} />} />
                <Area type="monotone" dataKey="done" name="Done"
                  stroke={C.todo} strokeWidth={2.5} fill="url(#areaG)"
                  dot={{ fill:C.todo, r:4, strokeWidth:2, stroke:'var(--surface-1)' }}
                  activeDot={{ r:6, fill:C.todo, stroke:'var(--surface-1)', strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ━━ WORKLOAD + HEALTH ROW ━━ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:'1.25rem' }}>

        {/* Horizontal workload */}
        {projectWorkload.length > 0 && (
          <Panel title="Project Workload" sub="Your tasks per project" delay={0.5}>
            <div style={{ height:210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectWorkload} layout="vertical" barSize={16} margin={{ top:0, right:20, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="wlG" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.todo} stopOpacity={1} />
                      <stop offset="100%" stopColor={C.review} stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill:C.tick, fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="project" tick={{ fill:C.tick, fontSize:11, fontWeight:600 }} axisLine={false} tickLine={false} width={108}
                    tickFormatter={v => v.length>14 ? v.slice(0,14)+'…':v} />
                  <RT content={<Tip colors={C} />} cursor={{ fill:'var(--surface-2)' }} />
                  <Bar dataKey="tasks" name="Tasks" fill="url(#wlG)" radius={[0,6,6,0]}
                    background={{ fill:'var(--surface-2)', radius:[0,6,6,0] }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}

        {/* Health gauge */}
        <Panel title="Health" sub="Workspace score" delay={0.52} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ height:180, width:'100%', position:'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="58%" outerRadius="88%"
                data={gaugeData} startAngle={225} endAngle={-45}>
                <defs>
                  <linearGradient id="hG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={healthColor} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={healthColor} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <RadialBar dataKey="value" cornerRadius={8} fill="url(#hG)"
                  background={{ fill:'var(--surface-2)' }} max={100} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:'2rem', fontWeight:800, color:healthColor, lineHeight:1, fontFamily:'Outfit,sans-serif' }}>{healthScore}</span>
              <span style={{ fontSize:10, color:'var(--text-subtle)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>/100</span>
            </div>
          </div>
          <div style={{ marginTop:8 }}>
            <span style={{ fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:20, background:`${healthColor}18`, color:healthColor }}>
              {healthScore>=80?'🟢 Healthy':healthScore>=60?'🟡 Moderate':'🔴 At Risk'}
            </span>
          </div>
        </Panel>
      </div>

      {/* ━━ TASK TABLES ━━ */}
      <div className="dash-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>

        <Panel title="Recent Tasks" sub={`${recentTasks.length} most recent assignments`} delay={0.55}
          right={<button onClick={()=>nav('/projects')} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:12.5, cursor:'pointer', fontWeight:700 }}>View all →</button>}>
          {recentTasks.length===0 ? <Empty msg="No tasks assigned yet" /> : (
            <div>
              <TH cols={['Task','Project','Pri.','Status','Due']} />
              {recentTasks.map(t => <TRow key={t.id} task={t} onClick={()=>navTo(t)} colors={C} />)}
            </div>
          )}
        </Panel>

        <Panel title="Overdue Tasks"
          sub={overdueTasks.length>0 ? `${overdueTasks.length} past deadline` : 'All caught up!'}
          delay={0.60}
          right={overdueTasks.length>0 && (
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${C.critical}14`, color:C.critical }}>
              {overdueTasks.length} overdue
            </span>
          )}>
          {overdueTasks.length===0
            ? <Empty msg="No overdue tasks — great work! 🎉" icon="✅" />
            : (
              <div>
                <TH cols={['Task','Project','Pri.','Status','Due']} />
                {overdueTasks.map(t => <TRow key={t.id} task={t} onClick={()=>navTo(t)} colors={C} />)}
              </div>
            )}
        </Panel>
      </div>

      {/* Footer */}
      <p style={{ textAlign:'center', fontSize:11, color:'var(--text-subtle)', paddingBottom:'0.5rem', opacity:0, animation:'fadeUp .4s ease .7s forwards' }}>
        TaskFlow · Refreshed on load · Data reflects your assigned tasks
      </p>
    </div>
  );
}
