import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RT,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts';

const P_COLORS = ['#64748b','#eab308','#ef4444','#dc2626'];
const S_MAP = { todo:'#6366f1','in-progress':'#eab308',review:'#3b82f6',done:'#10b981' };
const S_LABEL = { todo:'To Do','in-progress':'In Progress',review:'Review',done:'Done' };
const PR_MAP = { low:'#64748b',medium:'#eab308',high:'#ef4444',critical:'#dc2626' };

function greet() {
  const h = new Date().getHours();
  return h<12?'Good morning':h<17?'Good afternoon':'Good evening';
}

/* ── Tooltip ── */
function Tip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:'#1c1c1f',border:'1px solid #2e2e32',borderRadius:8,padding:'10px 14px',fontSize:12,boxShadow:'0 8px 32px rgba(0,0,0,.6)'}}>
      {label&&<div style={{color:'#71717a',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,fontSize:10}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:p.fill||p.color||p.stroke,display:'inline-block'}}/>
          <span style={{color:'#a1a1aa'}}>{p.name}:</span>
          <span style={{fontWeight:700,color:'#fafafa'}}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── KPI card with accent border ── */
function KPI({ label, value, sub, color, icon, badge, badgeColor, delay=0 }) {
  return (
    <div style={{
      background:'#111113',border:'1px solid #222225',borderRadius:12,
      padding:'1.25rem',position:'relative',overflow:'hidden',
      opacity:0,animation:`fadeUp .4s ease ${delay}s forwards`,
      borderLeft:`3px solid ${color}`,transition:'border-color .2s,background .2s',
    }}
    onMouseEnter={e=>{e.currentTarget.style.background='#18181b';}}
    onMouseLeave={e=>{e.currentTarget.style.background='#111113';}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.9rem'}}>
        <div style={{width:36,height:36,borderRadius:8,background:color+'18',border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem'}}>{icon}</div>
        {badge!==undefined&&<span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:(badgeColor||color)+'18',color:badgeColor||color,letterSpacing:.3}}>{badge}</span>}
      </div>
      <div style={{fontSize:'2rem',fontWeight:800,color:'#fafafa',letterSpacing:'-1.5px',lineHeight:1,marginBottom:4}}>{value}</div>
      <div style={{fontSize:12,fontWeight:600,color:'#71717a',textTransform:'uppercase',letterSpacing:.5}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:'#3f3f46',marginTop:3}}>{sub}</div>}
    </div>
  );
}

/* ── Panel container ── */
function Panel({ title, sub, right, children, delay=0, style={} }) {
  return (
    <div style={{background:'#111113',border:'1px solid #222225',borderRadius:12,padding:'1.25rem 1.5rem',opacity:0,animation:`fadeUp .4s ease ${delay}s forwards`,...style}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.25rem'}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#fafafa',letterSpacing:'-.2px'}}>{title}</div>
          {sub&&<div style={{fontSize:11,color:'#52525b',marginTop:2}}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ── Horizontal progress bar ── */
function HBar({ pct, color }) {
  return (
    <div style={{height:5,background:'#222225',borderRadius:3,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width .8s ease'}}/>
    </div>
  );
}

/* ── Status legend row ── */
function StatusRow({ name, value, total, color }) {
  const pct = total>0?Math.round(value/total*100):0;
  return (
    <div style={{marginBottom:'.6rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:7,height:7,borderRadius:2,background:color,flexShrink:0}}/>
          <span style={{fontSize:12,color:'#a1a1aa'}}>{name}</span>
        </div>
        <span style={{fontSize:12,color:'#e4e4e7',fontWeight:700}}>{value} <span style={{color:'#3f3f46',fontWeight:400}}>({pct}%)</span></span>
      </div>
      <HBar pct={pct} color={color}/>
    </div>
  );
}

/* ── Task table row ── */
function TRow({ task, onClick }) {
  const today=new Date().toISOString().split('T')[0];
  const od=task.due_date&&task.due_date<today&&task.status!=='done';
  const sc=S_MAP[task.status]||'#52525b';
  const pc=PR_MAP[task.priority]||'#52525b';
  return (
    <div onClick={onClick} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,cursor:'pointer',transition:'background .15s'}}
      onMouseEnter={e=>{e.currentTarget.style.background='#18181b';}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:od?'#ef4444':sc,flexShrink:0,boxShadow:od?'0 0 6px #ef444488':undefined}}/>
      <span style={{flex:2,fontSize:12.5,fontWeight:500,color:'#e4e4e7',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{task.title}</span>
      <span style={{flex:1,fontSize:11,color:'#3f3f46',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{task.project_name}</span>
      <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:pc+'18',color:pc,textTransform:'capitalize',flexShrink:0}}>{task.priority}</span>
      <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:od?'rgba(239,68,68,.1)':sc+'18',color:od?'#ef4444':sc,flexShrink:0,textTransform:'uppercase',letterSpacing:.3}}>
        {od?'Overdue':S_LABEL[task.status]||task.status}
      </span>
      {task.due_date&&<span style={{fontSize:10.5,color:od?'#ef4444':'#3f3f46',flexShrink:0,minWidth:72,textAlign:'right'}}>{task.due_date}</span>}
    </div>
  );
}

const TH = ['Task','Project','Priority','Status','Due Date'];

/* ── Empty ── */
const Empty = ({ msg, icon='📭' }) => (
  <div style={{textAlign:'center',padding:'2.5rem 0'}}>
    <div style={{fontSize:'1.6rem',marginBottom:8}}>{icon}</div>
    <p style={{fontSize:12,color:'#3f3f46'}}>{msg}</p>
  </div>
);

/* ── Skeleton ── */
function Skeleton() {
  const skel = h => <div className="skeleton" style={{height:h,borderRadius:12}}/>;
  return (
    <div style={{padding:'2rem',maxWidth:1400,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem'}}>{[...Array(6)].map((_,i)=>(<div key={i}>{skel(110)}</div>))}</div>
      {skel(52)}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>{[...Array(2)].map((_,i)=>(<div key={i}>{skel(260)}</div>))}</div>
      {skel(210)}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>{[...Array(2)].map((_,i)=>(<div key={i}>{skel(310)}</div>))}</div>
    </div>
  );
}

/* ── DonutCenter label ── */
function DonutCenter({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-5" style={{fill:'#fafafa',fontSize:22,fontWeight:800}}>{total}</tspan>
      <tspan x={cx} dy="20" style={{fill:'#52525b',fontSize:10,fontWeight:600,letterSpacing:1}}>TOTAL</tspan>
    </text>
  );
}

/* ── Dashboard ── */
export default function Dashboard() {
  const [data,setData]=useState(null);
  const {user}=useAuth();
  const nav=useNavigate();

  useEffect(()=>{ api.get('/dashboard').then(r=>setData(r.data)).catch(()=>{}); },[]);

  if(!data) return <Skeleton/>;

  const {
    stats={},recentTasks=[],overdueTasks=[],workspaceCount=0,
    tasksByStatus=[],tasksByPriority=[],projectWorkload=[],completionRate=0
  }=data;

  const today=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const healthScore = stats.total>0 ? Math.max(0,Math.round(100 - (stats.overdue/stats.total)*40 + (stats.done/stats.total)*20)) : 100;
  const healthColor = healthScore>=80?'#10b981':healthScore>=60?'#eab308':'#ef4444';

  /* Simulated 7-day sparkline data for completion trend */
  const spark = [0,1,2,3,4,5,6].map(i=>({
    day:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    done: Math.max(0, (stats.done||0) - (6-i)*Math.ceil((stats.done||0)/7)),
    total: stats.total||0,
  }));

  const navToProject = t => nav(`/workspaces/${t.workspace_id}/projects/${t.project_id}`);

  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:'1.75rem 2rem',display:'flex',flexDirection:'column',gap:'1.25rem'}}>

      {/* ── Header ── */}
      <div style={{opacity:0,animation:'fadeUp .35s ease forwards'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <p style={{fontSize:11,color:'#3f3f46',fontWeight:500,marginBottom:4,textTransform:'uppercase',letterSpacing:.8}}>{today}</p>
            <h1 style={{fontSize:'1.55rem',fontWeight:800,color:'#fafafa',letterSpacing:'-.5px',margin:0}}>
              {greet()}, <span style={{color:'#6366f1'}}>{user?.name?.split(' ')[0]}</span>
            </h1>
            <p style={{fontSize:12.5,color:'#52525b',marginTop:4}}>Here's a full overview of your task workspace and team activity.</p>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#111113',border:'1px solid #222225',borderRadius:8,padding:'8px 14px',fontSize:12,color:'#71717a'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:healthColor,display:'inline-block',boxShadow:`0 0 6px ${healthColor}88`}}/>
              Workspace Health: <strong style={{color:healthColor,marginLeft:4}}>{healthScore}/100</strong>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#111113',border:'1px solid #222225',borderRadius:8,padding:'8px 14px',fontSize:12,color:'#71717a'}}>
              📋 {stats.total} tasks · ✅ {completionRate}% done · ⚠️ {stats.overdue} overdue
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))',gap:'1rem'}}>
        <KPI label="Total Tasks"     value={stats.total}          color="#6366f1" icon="📋" delay={.05} sub={`${stats.todo} not started`}/>
        <KPI label="Completion Rate" value={`${completionRate}%`} color="#10b981" icon="🎯" delay={.1}  badge={`${stats.done} done`} badgeColor="#10b981" sub="of all assigned tasks"/>
        <KPI label="In Progress"     value={stats.inProgress}     color="#eab308" icon="⚡" delay={.15} sub="actively being worked on"/>
        <KPI label="In Review"       value={stats.review}         color="#3b82f6" icon="🔍" delay={.2}  sub="awaiting approval"/>
        <KPI label="Overdue"         value={stats.overdue}        color="#ef4444" icon="⚠️" delay={.25} badge={stats.overdue>0?'Action needed':'On track'} badgeColor={stats.overdue>0?'#ef4444':'#10b981'}/>
        <KPI label="Workspaces"      value={workspaceCount}       color="#a78bfa" icon="🏢" delay={.3}  sub="you're a member of"/>
      </div>

      {/* ── Segmented Task Bar ── */}
      <div style={{background:'#111113',border:'1px solid #222225',borderRadius:12,padding:'1rem 1.5rem',opacity:0,animation:'fadeUp .4s ease .35s forwards'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[['To Do',stats.todo,'#6366f1'],['In Progress',stats.inProgress,'#eab308'],['In Review',stats.review,'#3b82f6'],['Done',stats.done,'#10b981']].map(([l,v,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:8,height:8,borderRadius:2,background:c}}/><span style={{fontSize:11,color:'#52525b'}}>{l}</span><span style={{fontSize:11,fontWeight:700,color:'#a1a1aa',marginLeft:2}}>{v}</span>
              </div>
            ))}
          </div>
          <span style={{fontSize:10,color:'#3f3f46',fontWeight:600,textTransform:'uppercase',letterSpacing:.8}}>Task Distribution</span>
        </div>
        <div style={{display:'flex',height:8,borderRadius:4,overflow:'hidden',gap:2}}>
          {stats.total>0?[{v:stats.todo,c:'#6366f1'},{v:stats.inProgress,c:'#eab308'},{v:stats.review,c:'#3b82f6'},{v:stats.done,c:'#10b981'}].filter(s=>s.v>0).map((s,i)=>(
            <div key={i} style={{flex:s.v,background:s.c,borderRadius:2}}/>
          )):<div style={{flex:1,background:'#222225'}}/>}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1.25rem'}}>

        {/* Donut — Status */}
        <Panel title="Task Status" sub="Breakdown by current status" delay={.4}>
          {stats.total===0?<Empty msg="No tasks yet"/>:(
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{height:170}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                    {tasksByStatus.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
                    <DonutCenter cx={0} cy={0} total={stats.total}/>
                  </Pie><RT content={<Tip/>}/></PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                {[['To Do',stats.todo,'#6366f1'],['In Progress',stats.inProgress,'#eab308'],['In Review',stats.review,'#3b82f6'],['Done',stats.done,'#10b981']].map(([n,v,c])=>(
                  <StatusRow key={n} name={n} value={v} total={stats.total} color={c}/>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Bar — Priority */}
        <Panel title="Priority Distribution" sub="Tasks grouped by urgency" delay={.45}>
          {stats.total===0?<Empty msg="No tasks yet"/>:(
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority} barSize={32} margin={{top:4,right:4,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e21" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <RT content={<Tip/>} cursor={{fill:'rgba(255,255,255,0.02)'}}/>
                  <Bar dataKey="value" name="Tasks" radius={[5,5,0,0]}>
                    {tasksByPriority.map((e,i)=><Cell key={i} fill={P_COLORS[i]||'#6366f1'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Area — Completion Trend */}
        <Panel title="Completion Trend" sub="Cumulative tasks done (estimate)" delay={.5}>
          <div style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e21" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <RT content={<Tip/>}/>
                <Area type="monotone" dataKey="done" name="Done" stroke="#6366f1" strokeWidth={2} fill="url(#gc)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* ── Project Workload Full Width ── */}
      {projectWorkload.length>0&&(
        <Panel title="Project Workload" sub="Your tasks distributed across projects" delay={.55}>
          <div style={{height:180}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectWorkload} barSize={36} margin={{top:4,right:4,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e21" vertical={false}/>
                <XAxis dataKey="project" tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>v.length>14?v.slice(0,14)+'…':v}/>
                <YAxis tick={{fill:'#52525b',fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <RT content={<Tip/>} cursor={{fill:'rgba(255,255,255,0.02)'}}/>
                <Bar dataKey="tasks" name="Tasks" fill="url(#gp)" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {/* ── Task Tables ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>

        <Panel title="Recent Tasks" sub={`${recentTasks.length} most recent`} delay={.6}
          right={<button onClick={()=>nav('/projects')} style={{background:'none',border:'none',color:'#6366f1',fontSize:12,cursor:'pointer',fontWeight:600}}>View all →</button>}>
          {recentTasks.length===0?<Empty msg="No tasks assigned yet"/>:(
            <div>
              <div style={{display:'flex',gap:10,padding:'0 10px 8px',borderBottom:'1px solid #1c1c1f',marginBottom:4}}>
                {['Task','Project','Pri.','Status','Due'].map(h=><span key={h} style={{fontSize:10,fontWeight:700,color:'#3f3f46',textTransform:'uppercase',letterSpacing:.5,flex:h==='Task'?2:h==='Project'?1:0}}>{h}</span>)}
              </div>
              {recentTasks.map(t=><TRow key={t.id} task={t} onClick={()=>navToProject(t)}/>)}
            </div>
          )}
        </Panel>

        <Panel title="Overdue Tasks" sub={overdueTasks.length>0?`${overdueTasks.length} past deadline`:'All caught up!'} delay={.65}
          right={overdueTasks.length>0&&<span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4,background:'rgba(239,68,68,.1)',color:'#ef4444'}}>{overdueTasks.length} overdue</span>}>
          {overdueTasks.length===0
            ?<Empty msg="No overdue tasks — great work! 🎉" icon="✅"/>
            :(
              <div>
                <div style={{display:'flex',gap:10,padding:'0 10px 8px',borderBottom:'1px solid #1c1c1f',marginBottom:4}}>
                  {['Task','Project','Pri.','Status','Due'].map(h=><span key={h} style={{fontSize:10,fontWeight:700,color:'#3f3f46',textTransform:'uppercase',letterSpacing:.5,flex:h==='Task'?2:h==='Project'?1:0}}>{h}</span>)}
                </div>
                {overdueTasks.map(t=><TRow key={t.id} task={t} onClick={()=>navToProject(t)}/>)}
              </div>
            )}
        </Panel>
      </div>

      {/* ── Footer ── */}
      <p style={{textAlign:'center',fontSize:11,color:'#222225',paddingBottom:'0.5rem',opacity:0,animation:'fadeUp .4s ease .7s forwards'}}>
        TaskFlow · Data reflects your assigned tasks · Refreshed on load
      </p>
    </div>
  );
}
