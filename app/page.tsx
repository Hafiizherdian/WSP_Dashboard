'use client';

import { useState, useEffect, useRef, createContext } from 'react';
import { createPortal } from 'react-dom';
import WeekComparison from '@/components/WeekComparison';
import QuarterlyAnalysis from '@/components/QuarterlyAnalysis';
import QuarterlyAnalysisYearly from '@/components/QuarterlyAnalysisYearly';
import L4WC4WAnalysis from '@/components/L4WC4WAnalysis';
import YearOnYearGrowth from '@/components/YearOnYearGrowth';
import AnalysisSection from '@/components/AnalysisSection';
import OutletContributionSection from '@/components/OutletContributionSection';
import DistributionSection from '@/components/DistributionSection';
import PiutangComponent from '@/components/PiutangSections';
import OverviewTab from '@/components/OverviewTab';
import { SalesData } from '@/types/sales';
import { AreaConfig } from '@/lib/areaConfig';
import { RegionConfig, getAccessibleRegions } from '@/lib/regionConfig';
import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';
import { tk, Theme, YEARS, WEEKS, UNIT_OPTIONS, useBreakpoint } from '@/lib/dashboard-theme';
import {
  Calendar, CalendarDays, PieChart, Calendars,
  Activity, FileText, Store, Sun, Moon,
  ChevronLeft, Filter, X, LogOut,
  ShieldAlert, ShieldCheck, Shield,
  Boxes, NotepadTextDashed, WalletCards,
} from 'lucide-react';

const ThemeCtx = createContext<Theme>('dark');

function RoleIcon({ role, size=12 }:{ role:UserRole; size?:number }) {
  const c:Record<UserRole,string>={root:'#a78bfa',admin:'#60a5fa',user:'#34d399'};
  if (role==='root')  return <ShieldAlert  size={size} color={c.root}/>;
  if (role==='admin') return <ShieldCheck size={size} color={c.admin}/>;
  return <Shield size={size} color={c.user}/>;
}

function SessionGuard({ children }:{ children:React.ReactNode }) {
  const { user, loading } = useAuth();
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!loading && !user) window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname);
  }, [user, loading]);

  if (loading || !user) return (
    <div style={{
      minHeight: '100dvh', background: '#07090e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0,
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes sgPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes sgRing  { to{transform:rotate(360deg)} }
        @keyframes sgFadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sgBar   { 0%{width:0%} 40%{width:60%} 70%{width:82%} 100%{width:96%} }
      `}</style>
      <div style={{ animation: 'sgFadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <svg style={{ position: 'absolute', inset: 0, animation: 'sgRing 1.4s linear infinite' }}
            width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="rgba(28,151,6,0.15)" strokeWidth="2.5"/>
            <path d="M32 4 a28 28 0 0 1 24.2 14" stroke="#1c9706" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{
            position: 'absolute', inset: 10, borderRadius: 12,
            background: 'rgba(28,151,6,0.12)', border: '1px solid rgba(28,151,6,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'sgPulse 2s ease-in-out infinite',
          }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{width:28,height:28,objectFit:'contain'}}/>
          </div>
        </div>
        <div style={{ textAlign: 'center', animation: 'sgFadeUp 0.5s 0.1s ease both', opacity: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.03em', lineHeight: 1 }}>CGKN</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 }}>Dashboard</div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.2s ease both', opacity: 0, width: 160 }}>
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #1c9706, #4ade80)', borderRadius: 2, animation: 'sgBar 2.5s cubic-bezier(0.4,0,0.2,1) forwards' }}/>
          </div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.3s ease both', opacity: 0, fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em' }}>
          Memverifikasi sesi{'.' .repeat(dots)}
        </div>
      </div>
    </div>
  );
  return <>{children}</>;
}

function ThemeToggle({ theme, setTheme, compact=false }:{ theme:Theme; setTheme:(t:Theme)=>void; compact?:boolean }) {
  const t=tk[theme]; const isDark=theme==='dark';
  if (compact) return (
    <button onClick={()=>setTheme(isDark?'light':'dark')}
      style={{width:30,height:30,borderRadius:7,background:t.toggleBg,border:`1px solid ${t.toggleBorder}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:t.textMuted,flexShrink:0}}>
      {isDark?<Sun size={13}/>:<Moon size={13}/>}
    </button>
  );
  return (
    <button onClick={()=>setTheme(isDark?'light':'dark')}
      style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px 4px 4px',background:t.toggleBg,border:`1px solid ${t.toggleBorder}`,borderRadius:16,cursor:'pointer',flexShrink:0}}>
      <span style={{position:'relative',display:'inline-flex',width:26,height:15,borderRadius:8,background:isDark?'#1e2d1a':'#e8f0fe',flexShrink:0}}>
        <span style={{position:'absolute',top:2,left:isDark?13:2,width:9,height:9,borderRadius:'50%',background:isDark?'#4ade80':'#2563eb',transition:'left 0.2s',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {isDark?<Moon size={5} color="#07090e"/>:<Sun size={5} color="white"/>}
        </span>
      </span>
      <span style={{fontSize:10,fontWeight:600,color:t.textSub,fontFamily:'IBM Plex Mono,monospace'}}>{isDark?'Dark':'Light'}</span>
    </button>
  );
}

const TABS=[
  {id:'overview',      label:'Ringkasan',       shortLabel:'Ringkasan',  Icon:NotepadTextDashed},
  {id:'weekly',        label:'Mingguan',        shortLabel:'Mingguan',   Icon:Calendar  },
  {id:'quarterly',     label:'Kuartal Target',  shortLabel:'Kuartal',    Icon:CalendarDays },
  {id:'quarterly2',    label:'Kuartal Aktual',  shortLabel:'Kuartal',    Icon:Calendars },
  {id:'l4wc4w',        label:'L4W vs C1W',      shortLabel:'L4W',        Icon:Activity  },
  {id:'yoy',           label:'YoY Growth',      shortLabel:'YoY',        Icon:PieChart  },
  {id:'outlet',        label:'Outlet',          shortLabel:'Outlet',     Icon:Store     },
  {id:'analysis',      label:'Brand Performance',shortLabel:'Brand',     Icon:FileText  },
  {id:'distribution',  label:'Distribusi',      shortLabel:'Distribusi', Icon:Boxes    },
  {id:'piutang',       label:'Piutang',         shortLabel:'Piutang',    Icon:WalletCards}
] as const;
type TabId = typeof TABS[number]['id'];

function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, theme, setTheme }:{
  activeTab:TabId; setActiveTab:(id:TabId)=>void;
  collapsed:boolean; setCollapsed:(v:boolean)=>void;
  theme:Theme; setTheme:(t:Theme)=>void;
}) {
  const t=tk[theme]; const {user,logout}=useAuth();
  return (
    <aside style={{position:'fixed',left:0,top:0,height:'100vh',zIndex:40,display:'flex',flexDirection:'column',width:collapsed?52:200,background:t.sidebarbg,borderRight:`1px solid ${t.border}`,transition:'width 0.2s cubic-bezier(.4,0,.2,1)',overflowX:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:collapsed?'center':'space-between',padding:collapsed?'0':'0 8px 0 12px',borderBottom:`1px solid ${t.border}`,flexShrink:0,minHeight:46}}>
        {collapsed ? (
          <button onClick={()=>setCollapsed(false)} style={{background:'none',border:'none',cursor:'pointer',padding:6,display:'flex'}}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{width:26,height:26,borderRadius:7,objectFit:'contain'}}/>
          </button>
        ) : (
          <>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <img src="/logo-cgkn.png" alt="CGKN" style={{width:26,height:26,borderRadius:7,objectFit:'contain',flexShrink:0}}/>
              <div>
                <div style={{color:t.text,fontSize:12,fontWeight:800,fontFamily:'IBM Plex Mono,monospace',lineHeight:1.1}}>CGKN</div>
                <div style={{color:t.textMuted,fontSize:8,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.1em',textTransform:'uppercase'}}>Dashboard</div>
              </div>
            </div>
            <button onClick={()=>setCollapsed(true)} style={{background:t.inputBg,border:`1px solid ${t.borderInput}`,cursor:'pointer',color:t.textMuted,borderRadius:6,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <ChevronLeft size={11}/>
            </button>
          </>
        )}
      </div>
      <nav style={{flex:1,padding:'6px 4px',overflowY:'auto'}}>
        {TABS.map(({id,label,Icon})=>{
          const active=activeTab===id;
          return (
            <button key={id} onClick={()=>setActiveTab(id)} title={collapsed?label:undefined}
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',minHeight:33,padding:collapsed?'5px 0':'5px 8px',borderRadius:7,border:'none',cursor:'pointer',justifyContent:collapsed?'center':'flex-start',background:active?t.navActiveBg:'transparent',color:active?t.navActiveText:t.text,fontSize:12,fontWeight:active?600:400,fontFamily:'IBM Plex Sans,sans-serif',transition:'all 0.12s',marginBottom:1,position:'relative'}}>
              <Icon size={13} color={active?t.navActiveText:t.text}/>
              {!collapsed&&<span style={{flex:1,textAlign:'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>}
              {active&&<span style={{position:'absolute',left:0,top:'20%',bottom:'20%',width:2,borderRadius:'0 2px 2px 0',background:t.navActiveDot}}/>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:collapsed?'8px 4px':'8px',borderTop:`1px solid ${t.border}`,flexShrink:0,display:'flex',flexDirection:'column',gap:5,alignItems:collapsed?'center':'stretch'}}>
        {collapsed ? (
          <>
            <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} style={{background:'none',border:'none',cursor:'pointer',color:t.text,borderRadius:7,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>{theme==='dark'?<Sun size={13}/>:<Moon size={13}/>}</button>
            <button onClick={logout} style={{background:t.red.bg,border:`1px solid ${t.red.border}`,cursor:'pointer',borderRadius:7,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}><LogOut size={12} color={t.red.text}/></button>
          </>
        ) : (
          <>
            {user&&(
              <div style={{padding:'6px 8px',borderRadius:8,background:t.inputBg,border:`1px solid ${t.borderInput}`,display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:24,height:24,borderRadius:6,background:user.role==='root'?'rgba(139,92,246,0.14)':user.role==='admin'?'rgba(37,99,235,0.12)':'rgba(16,185,129,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><RoleIcon role={user.role} size={11}/></div>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:11,fontWeight:700,color:t.text,fontFamily:'IBM Plex Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</div>
                  <div style={{fontSize:8,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>{user.role}</div>
                </div>
                <button onClick={logout} style={{background:t.red.bg,border:`1px solid ${t.red.border}`,cursor:'pointer',borderRadius:5,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><LogOut size={10} color={t.red.text}/></button>
              </div>
            )}
            <ThemeToggle theme={theme} setTheme={setTheme}/>
          </>
        )}
      </div>
    </aside>
  );
}

function MobileHeader({ theme, setTheme }:{ theme:Theme; setTheme:(t:Theme)=>void }) {
  const t=tk[theme]; const {user,logout}=useAuth();
  return (
    <header style={{background:t.headerbg,backdropFilter:'blur(12px)',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',height:44,flexShrink:0}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <img src="/logo-cgkn.png" alt="CGKN" style={{width:26,height:26,borderRadius:7,objectFit:'contain'}}/>
        <span style={{fontSize:12,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace'}}>CGKN</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:5}}>
        {user&&<span style={{fontSize:10,fontWeight:600,color:t.textSub,fontFamily:'IBM Plex Mono,monospace',padding:'2px 6px',borderRadius:10,background:t.inputBg,border:`1px solid ${t.borderInput}`}}>{user.username}</span>}
        <ThemeToggle theme={theme} setTheme={setTheme} compact/>
        <button onClick={logout} style={{width:28,height:28,borderRadius:7,background:t.red.bg,border:`1px solid ${t.red.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><LogOut size={11} color={t.red.text}/></button>
      </div>
    </header>
  );
}

function MobileBottomNav({ activeTab, setActiveTab, theme }:{ activeTab:TabId; setActiveTab:(id:TabId)=>void; theme:Theme }) {
  const t=tk[theme];
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0,
      zIndex:9999,
      background:t.bottombarbg, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
      borderTop:`1px solid ${t.border}`, display:'flex',
      paddingBottom:'env(safe-area-inset-bottom,0px)', willChange:'transform',
    }}>
      {TABS.map(({id,shortLabel,Icon})=>{
        const active=activeTab===id;
        return (
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'7px 2px',border:'none',background:'transparent',cursor:'pointer',minHeight:48,gap:2,color:active?t.navActiveText:t.textMuted,position:'relative'}}>
            <Icon size={16} color={active?t.navActiveText:t.textMuted}/>
            <span style={{fontSize:8,fontWeight:active?700:400,fontFamily:'IBM Plex Sans,sans-serif'}}>{shortLabel}</span>
            {active&&<span style={{position:'absolute',top:0,width:16,height:2,background:t.navActiveText,borderRadius:'0 0 2px 2px'}}/>}
          </button>
        );
      })}
    </nav>
  );
}

function Sel({ value, onChange, options, theme, style }:{ value:string|number; onChange:(v:string|number)=>void; options:{value:string|number;label:string}[]; theme:Theme; style?:React.CSSProperties }) {
  const t=tk[theme]; const a=theme==='light'?'%23555':'%23aaa';
  return (
    <select value={value} onChange={e=>{const r=e.target.value;onChange(r===''?r:isNaN(Number(r))?r:Number(r));}}
      style={{height:24,padding:'0 20px 0 7px',backgroundColor:t.inputBg,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='${a}' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 6px center',backgroundSize:'auto',border:`1px solid ${t.borderInput}`,borderRadius:5,color:t.text,fontSize:10,fontFamily:'IBM Plex Mono,monospace',cursor:'pointer',outline:'none',appearance:'none',minWidth:0,...style}}>
      {options.map(o=><option key={String(o.value)} value={o.value} style={{background:t.optionBg,color:t.text}}>{o.label}</option>)}
    </select>
  );
}

// DesktopFilterBar
function DesktopFilterBar({
  y1,sY1,wStart1,sWStart1,w1,sW1,
  y2,sY2,wStart2,sWStart2,w2,sW2,
  af,sAf,areas,
  rf,sRf,regions,canRegional,
  onApply,onReset,loading,theme,
  sSelectedUnit,
  selectedUnit,
  unapplied,
}:{
  y1:number; sY1:(v:number)=>void;
  wStart1:number; sWStart1:(v:number)=>void;
  w1:number; sW1:(v:number)=>void;
  y2:number; sY2:(v:number)=>void;
  wStart2:number; sWStart2:(v:number)=>void;
  w2:number; sW2:(v:number)=>void;
  af:string; sAf:(v:string)=>void; areas:AreaConfig[];
  rf:string; sRf:(v:string)=>void; regions:RegionConfig[]; canRegional:boolean;
  selectedUnit:string; sSelectedUnit:(v:string)=>void;
  unapplied:boolean; // snapshot terakhir yang sukses di-fetch (untuk warning)
  onApply:()=>void; onReset:()=>void; loading:boolean; theme:Theme;

}) {
  const t=tk[theme];
  // "dirty" = beda dari DEFAULT (untuk tombol Reset).
  const dirty = wStart1!==0 || w1!==0 || wStart2!==0 || w2!==0 || !!af || !!rf || selectedUnit!=='units_dos';
  const yO=YEARS.map(y=>({value:y,label:String(y)}));
  const aO=[{value:'',label:'Semua Area'},...areas.map(a=>({value:a.id,label:a.name}))];
  const rO=[{value:'',label:'Semua Regional'},...regions.map(r=>({value:r.id,label:r.name}))];

  // weekStart options: hanya tampilkan minggu <= weekEnd (jika weekEnd sudah dipilih)
  const wStartOpts = (end: number) => [
    { value: 0, label: 'W1' },
    ...WEEKS.filter(w => end === 0 || w <= end).map(w => ({ value: w, label: `W${w}` })),
  ];

  // weekEnd options: hanya tampilkan minggu >= weekStart
  const wEndOpts = (start: number) => [
    { value: 0, label: 'Semua' },
    ...WEEKS.filter(w => w >= (start || 1)).map(w => ({ value: w, label: `W${w}` })),
  ];

  const Sep=()=><div style={{width:1,height:12,background:t.border,margin:'0 1px',flexShrink:0}}/>;
  const Lbl=({c}:{c:string})=><span style={{fontSize:8,fontWeight:700,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>{c}</span>;

  return (
    <div style={{flexShrink:0,background:t.filterbg,borderBottom:`1px solid ${t.border}`}}>
      <style>{`@keyframes fbPulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{display:'flex',alignItems:'center',padding:'0 14px',height:36,gap:4,overflowX:'auto',scrollbarWidth:'none'}}>

        {/* P1 */}
        <Lbl c="P1"/>
        <Sel value={y1} onChange={v=>sY1(+v)} options={yO} theme={theme} style={{width:60}}/>
        <Sel
          value={wStart1}
          onChange={v=>{
            const s=+v; sWStart1(s);
            if(w1>0 && s>=w1) sW1(0);
          }}
          options={wStartOpts(w1)}
          theme={theme}
          style={{width:60}}
        />
        <span style={{fontSize:9,color:t.textFaint,fontFamily:'monospace',flexShrink:0}}>–</span>
        <Sel
          value={w1}
          onChange={v=>{
            const e=+v; sW1(e);
            if(e>0 && wStart1>e) sWStart1(0);
          }}
          options={wEndOpts(wStart1)}
          theme={theme}
          style={{width:68}}
        />

        <Sep/>
        <span style={{fontSize:8,fontWeight:800,color:t.textFaint,fontFamily:'monospace',letterSpacing:'0.12em',flexShrink:0}}>VS</span>
        <Sep/>

        {/* P2 */}
        <Lbl c="P2"/>
        <Sel value={y2} onChange={v=>sY2(+v)} options={yO} theme={theme} style={{width:60}}/>
        <Sel
          value={wStart2}
          onChange={v=>{
            const s=+v; sWStart2(s);
            if(w2>0 && s>=w2) sW2(0);
          }}
          options={wStartOpts(w2)}
          theme={theme}
          style={{width:60}}
        />
        <span style={{fontSize:9,color:t.textFaint,fontFamily:'monospace',flexShrink:0}}>–</span>
        <Sel
          value={w2}
          onChange={v=>{
            const e=+v; sW2(e);
            if(e>0 && wStart2>e) sWStart2(0);
          }}
          options={wEndOpts(wStart2)}
          theme={theme}
          style={{width:68}}
        />

        <Sep/>
        {/* Dropdown Area */}
        <Lbl c="Area"/>
        <Sel value={af} onChange={v=>sAf(String(v))} options={aO} theme={theme} style={{minWidth:106}}/>

        {/* Dropdown Regional hanya untuk user yang boleh pakai filter regional */}
        {canRegional && (
          <>
            <Sep/>
            <Lbl c="Regional"/>
            <Sel value={rf} onChange={v=>sRf(String(v))} options={rO} theme={theme} style={{minWidth:112}}/>
          </>
        )}

        <Sep/>

        {/* Unit selector */}
        <Lbl c="Value"/>
        <div style={{display:'flex',alignItems:'center',gap:0,background:t.toggleBg,border:`1px solid ${t.toggleBorder}`,borderRadius:5,padding:1,flexShrink:0}}>
          {UNIT_OPTIONS.map(opt=>{
            const active = selectedUnit === opt.value;
            return (
              <button
                key={opt.value}
                onClick={()=>sSelectedUnit(opt.value)}
                title={opt.fullLabel}
                style={{
                  height:20,
                  padding:'0 7px',
                  borderRadius:4,
                  border:'none',
                  background: active ? '#1c9706' : 'transparent',
                  color: active ? '#fff' : t.textMuted,
                  fontSize:9,
                  fontWeight: active ? 700 : 400,
                  fontFamily:'IBM Plex Mono,monospace',
                  cursor:'pointer',
                  transition:'all 0.12s',
                  flexShrink:0,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div style={{flex:1}}/>

        {/* Klaster kanan: sticky agar Terapkan/warning selalu kelihatan walau filter di scroll */}
        <div style={{
          display:'flex', alignItems:'center', gap:6, flexShrink:0,
          position:'sticky', right:0, paddingLeft:8, background:t.filterbg,
          boxShadow: theme==='dark' ? '-14px 0 12px -10px rgba(0,0,0,0.45)' : '-14px 0 12px -10px rgba(0,0,0,0.08)',
        }}>
          {unapplied && !loading && (
            <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0,
              background:t.warnBg,border:`1px solid ${t.warnBorder}`,
              borderRadius:3,padding:'0 7px',height:18}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:t.warnText,animation:'fbPulseDot 1.3s ease-in-out infinite'}}/>
              <span style={{fontSize:9,fontFamily:'monospace',color:t.warnText,fontWeight:700,letterSpacing:'0.02em'}}>Belum diterapkan</span>
            </div>
          )}

          {dirty&&<button onClick={onReset} style={{height:22,padding:'0 7px',borderRadius:4,fontSize:10,fontFamily:'monospace',background:'transparent',border:`1px solid ${t.borderInput}`,color:t.textMuted,cursor:'pointer'}}>Reset</button>}

          <div style={{position:'relative'}}>
            <button onClick={onApply} disabled={loading}
              style={{height:22,padding:'0 11px',borderRadius:4,fontSize:10,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',background:'#1c9706',border:'none',color:'#fff',cursor:loading?'not-allowed':'pointer',opacity:loading?0.5:1,flexShrink:0,boxShadow:'0 1px 4px rgba(28,151,6,0.3)'}}>
              {loading ? 'Memuat…' : 'Terapkan'}
            </button>
            {unapplied && !loading && (
              <span style={{position:'absolute',top:-3,right:-3,width:7,height:7,borderRadius:'50%',background:t.warnText,border:`1.5px solid ${t.filterbg}`}}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// MobileFilterBar
function MobileFilterBar({
  applied, unapplied, areas, regions, onOpen, loading, theme,
}:{
  applied: { y1:number; wStart1:number; w1:number; y2:number; wStart2:number; w2:number; af:string; regional:string; unit:string };
  unapplied: boolean;
  areas:AreaConfig[]; regions:RegionConfig[];
  onOpen:()=>void; loading:boolean; theme:Theme;
}) {
  const t=tk[theme];

  type CV='blue'|'green'|'orange';
  const Chip=({v,ch}:{v:string;ch:CV})=>{
    const key=`chip${ch.charAt(0).toUpperCase()+ch.slice(1)}` as keyof typeof t;
    const c=t[key] as {bg:string;text:string;border:string};
    return (
      <span style={{
        padding:'1px 5px',borderRadius:4,fontSize:9,fontWeight:600,
        fontFamily:'IBM Plex Mono,monospace',background:c.bg,color:c.text,
        border:`1px solid ${c.border}`,whiteSpace:'nowrap',
      }}>{v}</span>
    );
  };

  const rangeLabel = (start:number, end:number) =>
    end > 0 ? `W${start > 0 ? start : 1}–W${end}` : 'Semua';

  const aName=areas.find(a=>a.id===applied.af)?.name;
  const rName=regions.find(r=>r.id===applied.regional)?.name;

  return (
    <div style={{
      background:t.filterbg,borderBottom:`1px solid ${t.border}`,
      height:32,display:'flex',alignItems:'center',padding:'0 10px',gap:6,
    }}>
      <style>{`@keyframes fbPulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <button
        onClick={onOpen}
        style={{
          position:'relative',
          display:'flex',alignItems:'center',gap:4,height:20,padding:'0 7px',
          borderRadius:4,background:t.inputBg,border:`1px solid ${t.borderInput}`,
          color:t.textSub,fontSize:9,fontFamily:'monospace',cursor:'pointer',flexShrink:0,
        }}
      >
        <Filter size={8}/>Filter
        {unapplied && (
          <span style={{position:'absolute',top:-3,right:-3,width:6,height:6,borderRadius:'50%',background:t.warnText,border:`1.5px solid ${t.filterbg}`}}/>
        )}
      </button>

      <div style={{display:'flex',gap:4,flex:1,overflowX:'auto',alignItems:'center',scrollbarWidth:'none'}}>
        {unapplied && (
          <span style={{
            display:'flex',alignItems:'center',gap:4,padding:'1px 6px',borderRadius:4,fontSize:9,fontWeight:700,
            fontFamily:'IBM Plex Mono,monospace',background:t.warnBg,color:t.warnText,border:`1px solid ${t.warnBorder}`,
            whiteSpace:'nowrap',flexShrink:0,
          }}>
            <span style={{width:5,height:5,borderRadius:'50%',background:t.warnText,animation:'fbPulseDot 1.3s ease-in-out infinite'}}/>
            Belum diterapkan
          </span>
        )}
        <Chip v={`${applied.y1} ${rangeLabel(applied.wStart1,applied.w1)}`} ch="blue"/>
        <span style={{fontSize:8,color:t.textFaint,fontFamily:'monospace',flexShrink:0}}>vs</span>
        <Chip v={`${applied.y2} ${rangeLabel(applied.wStart2,applied.w2)}`} ch="green"/>
        {aName&&<Chip v={aName} ch="orange"/>}
        {rName&&<Chip v={rName} ch="orange"/>}
        {applied.unit!=='units_dos'&&(
          <Chip v={UNIT_OPTIONS.find(o=>o.value===applied.unit)?.label??applied.unit} ch="orange"/>
        )}
      </div>
    </div>
  );
}

// MobileFilterSheet
function MobileFilterSheet({
  open,onClose,
  y1,sY1,wStart1,sWStart1,w1,sW1,
  y2,sY2,wStart2,sWStart2,w2,sW2,
  af,sAf,areas,
  rf,sRf,regions,canRegional,
  onApply,onReset,loading,theme,
  sSelectedUnit,
  selectedUnit,
  unapplied,
}:{
  open:boolean; onClose:()=>void;
  y1:number; sY1:(v:number)=>void;
  wStart1:number; sWStart1:(v:number)=>void;
  w1:number; sW1:(v:number)=>void;
  y2:number; sY2:(v:number)=>void;
  wStart2:number; sWStart2:(v:number)=>void;
  w2:number; sW2:(v:number)=>void;
  af:string; sAf:(v:string)=>void; areas:AreaConfig[];
  rf:string; sRf:(v:string)=>void; regions:RegionConfig[]; canRegional:boolean;
  selectedUnit:string; sSelectedUnit:(v:string)=>void;
  unapplied:boolean;
  onApply:()=>void; onReset:()=>void; loading:boolean; theme:Theme;
}) {

  const t=tk[theme];
  // "dirty" = beda dari DEFAULT (untuk tombol Reset) beda konsep dengan "unapplied"
  const dirty = wStart1!==0 || w1!==0 || wStart2!==0 || w2!==0 || !!af || !!rf || selectedUnit!=='units_dos';
  const yO=YEARS.map(y=>({value:y,label:String(y)}));
  const aO=[{value:'',label:'Semua Area'},...areas.map(a=>({value:a.id,label:a.name}))];
  const rO=[{value:'',label:'Semua Regional'},...regions.map(r=>({value:r.id,label:r.name}))];

  const Row=({l,children}:{l:string;children:React.ReactNode})=>(
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',minHeight:38,borderBottom:`1px solid ${t.border}`}}>
      <span style={{fontSize:13,color:t.textSub}}>{l}</span>
      {children}
    </div>
  );

  return (
    <>
      {open&&<div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:10000}}/>}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        zIndex:10001,
        background:t.filterbg, borderRadius:'14px 14px 0 0',
        borderTop:`1px solid ${t.border}`,
        transform:open?'translateY(0)':'translateY(100%)',
        transition:'transform 0.22s cubic-bezier(0.32,0.72,0,1)',
        maxHeight:'90vh', display:'flex', flexDirection:'column',
      }}>
        <style>{`@keyframes fbPulseDot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        <div style={{display:'flex',justifyContent:'center',padding:'8px 0 0'}}>
          <div style={{width:24,height:3,borderRadius:2,background:t.textFaint}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 14px',borderBottom:`1px solid ${t.border}`,flexShrink:0}}>
          <span style={{fontSize:13,fontWeight:700,color:t.text}}>Filter Data</span>
          <button onClick={onClose} style={{width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:t.inputBg,border:`1px solid ${t.borderInput}`,color:t.textMuted}}><X size={11}/></button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'0 14px 4px'}}>
          {([
            ['P1', y1, sY1, wStart1, sWStart1, w1, sW1],
            ['P2', y2, sY2, wStart2, sWStart2, w2, sW2],
          ] as any[]).map(([lbl,y,sY,wS,sWS,w,sW])=>(
            <div key={lbl}>
              <div style={{paddingTop:10,fontSize:8,fontWeight:800,color:t.textMuted,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.12em'}}>{lbl}</div>
              <Row l="Tahun">
                <Sel value={y} onChange={(v:any)=>sY(+v)} options={yO} theme={theme}/>
              </Row>
              <Row l="Minggu Awal">
                <Sel
                  value={wS}
                  onChange={(v:any)=>{
                    const s=+v; sWS(s);
                    if(w>0 && s>w) sW(0);
                  }}
                  options={[
                    {value:0, label:'W1 (awal)'},
                    ...WEEKS.filter((x:number)=>w===0||x<=w).map((x:number)=>({value:x,label:`Minggu ${x}`})),
                  ]}
                  theme={theme}
                  style={{minWidth:130}}
                />
              </Row>
              <Row l="Minggu Akhir">
                <Sel
                  value={w}
                  onChange={(v:any)=>{
                    const e=+v; sW(e);
                    if(e>0 && wS>e) sWS(0);
                  }}
                  options={[
                    {value:0, label:'Semua'},
                    ...WEEKS.filter((x:number)=>x>=(wS||1)).map((x:number)=>({value:x,label:`Minggu ${x}`})),
                  ]}
                  theme={theme}
                  style={{minWidth:130}}
                />
              </Row>
            </div>
          ))}

          <div style={{paddingTop:10,fontSize:8,fontWeight:800,color:t.textMuted,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.12em'}}>Area</div>
          <Row l="Filter Area">
            <Sel value={af} onChange={(v:any)=>sAf(String(v))} options={aO} theme={theme} style={{minWidth:130}}/>
          </Row>

          {canRegional && (
            <>
              <div style={{paddingTop:10,fontSize:8,fontWeight:800,color:t.textMuted,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.12em'}}>Regional</div>
              <Row l="Filter Regional">
                <Sel value={rf} onChange={(v:any)=>sRf(String(v))} options={rO} theme={theme} style={{minWidth:130}}/>
              </Row>
            </>
          )}

          <div style={{paddingTop:10,fontSize:8,fontWeight:800,color:t.textMuted,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.12em'}}>Unit</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5,padding:'10px 0'}}>
            {UNIT_OPTIONS.map(opt=>{
              const active = selectedUnit === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={()=>sSelectedUnit(opt.value)}
                  style={{
                    height:36,padding:'0 14px',borderRadius:9,
                    background: active ? '#1c9706' : t.inputBg,
                    border: active ? 'none' : `1px solid ${t.borderInput}`,
                    color: active ? '#fff' : t.textSub,
                    fontSize:13,fontWeight:active?700:400,
                    fontFamily:'IBM Plex Mono,monospace',cursor:'pointer',
                  }}
                >
                  {opt.fullLabel}
                </button>
              );
            })}
          </div>
        </div>

        {unapplied && (
          <div style={{
            margin:'0 14px 8px', padding:'7px 10px', borderRadius:8,
            background:t.warnBg, border:`1px solid ${t.warnBorder}`,
            display:'flex', alignItems:'center', gap:7, flexShrink:0,
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:t.warnText,flexShrink:0,animation:'fbPulseDot 1.3s ease-in-out infinite'}}/>
            <span style={{fontSize:11,color:t.warnText,fontFamily:'IBM Plex Mono,monospace',fontWeight:600,lineHeight:1.4}}>
              Filter berubah — klik "Terapkan" untuk memperbarui data
            </span>
          </div>
        )}

        <div style={{
          padding:'8px 14px',
          paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 12px)',
          borderTop:`1px solid ${t.border}`,
          display:'flex', gap:7, flexShrink:0,
        }}>
          {dirty&&<button onClick={()=>{onReset();onClose();}} style={{height:44,flex:1,borderRadius:10,background:'transparent',border:`1px solid ${t.borderInput}`,color:t.textSub,fontSize:13,cursor:'pointer'}}>Reset</button>}
          <button onClick={()=>{onApply();onClose();}} disabled={loading}
            style={{height:44,flex:2,borderRadius:10,background:'#1c9706',border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1}}>
            {loading?'Memuat…':'Terapkan'}
          </button>
        </div>
      </div>
    </>
  );
}

// LoadingOverlay
function LoadingOverlay({ theme, targetRef }: { theme: Theme; targetRef: React.RefObject<HTMLDivElement | null> }) {
  const t = tk[theme];
  const [dots, setDots] = useState(0);
  const [rect, setRect] = useState<{top:number; left:number; width:number; height:number} | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const update = () => {
      if (!targetRef.current) return;
      const r = targetRef.current.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const ro = new ResizeObserver(update);
    if (targetRef.current) ro.observe(targetRef.current);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro.disconnect();
    };
  }, [targetRef]);

  if (!rect || typeof document === 'undefined') return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: rect.top, left: rect.left, width: rect.width, height: rect.height,
      zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme === 'dark' ? 'rgba(7,9,14,0.62)' : 'rgba(238,241,247,0.68)',
      backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
      pointerEvents: 'auto',
    }}>
      <style>{`
        @keyframes lcPulse { 0%,100%{ opacity:0.7; transform:scale(1) } 50%{ opacity:1; transform:scale(1.06) } }
        @keyframes lcRing  { to { transform: rotate(360deg) } }
        @keyframes lcPop   { from{ opacity:0; transform:translateY(10px) scale(0.95) } to{ opacity:1; transform:translateY(0) scale(1) } }
        @keyframes lcBar   { 0%{ width:0% } 40%{ width:60% } 70%{ width:82% } 100%{ width:96% } }
      `}</style>
      <div style={{
        background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16,
        padding: '26px 34px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        boxShadow: theme === 'dark' ? '0 24px 64px rgba(0,0,0,0.5)' : '0 24px 64px rgba(15,23,42,0.16)',
        animation: 'lcPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        minWidth: 210,
      }}>
        <div style={{ position:'relative', width:56, height:56 }}>
          <svg style={{ position:'absolute', inset:0, animation:'lcRing 1.4s linear infinite' }}
            width="56" height="56" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="rgba(28,151,6,0.15)" strokeWidth="2.5"/>
            <path d="M32 4 a28 28 0 0 1 24.2 14" stroke="#1c9706" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{
            position:'absolute', inset:9, borderRadius:11,
            display:'flex', alignItems:'center', justifyContent:'center',
            animation:' infinite',
          }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{ width:24, height:24, objectFit:'contain' }}/>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ fontSize:13, fontWeight:700, color:t.text, fontFamily:'IBM Plex Mono,monospace', letterSpacing:'-0.01em' }}>
            Mengambil Data
          </div>
          <div style={{ fontSize:9.5, color:t.textMuted, fontFamily:'IBM Plex Mono,monospace' }}>
            Menyesuaikan tampilan dashboard
          </div>
        </div>

        <div style={{ width:150 }}>
          <div style={{ height:2, borderRadius:2, background:t.borderCard, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg, #1c9706, #4ade80)', borderRadius:2, animation:'lcBar 2.2s cubic-bezier(0.4,0,0.2,1) forwards' }}/>
          </div>
        </div>

        <div style={{ fontSize:9.5, color:t.textMuted, fontFamily:'IBM Plex Mono,monospace', letterSpacing:'0.04em' }}>
          Mengambil data{'.'.repeat(dots)}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ContentWrapper({ children, theme }:{ children:React.ReactNode; theme:Theme }) {
  return (
    <>
      {theme==='dark'&&<style>{`
        .tc .bg-white{background:#0e1118!important}
        .tc .border-gray-200{border-color:rgba(255,255,255,0.07)!important}
      `}</style>}
      {theme==='light'&&<style>{`
        .tc .bg-white{background:#fff!important}
      `}</style>}
      <div className="tc">{children}</div>
    </>
  );
}

const EMPTY_DATA: SalesData = {
  weeklyData:[],quarterlyData:[], QuarterlyYoYData: [], weekComparisons:[],
  l4wc4wData:{l4wAverage:0,c4wAverage:0,c1wValue:0,variance:0,variancePercentage:0},
  yearOnYearGrowth:{previousYearTotal:0,currentYearTotal:0,variance:0,variancePercentage:0},
  comparisonYears:{previousYear:null,currentYear:null},
  comparisonWeeks:{previousYear:null,currentYear:null},
};

function DashboardInner() {
  const [theme,setTheme]   = useState<Theme>('dark');
  const [tab,setTab]       = useState<TabId>('overview');
  const [collapsed,setCol] = useState(false);
  const [sheetOpen,setSheet] = useState(false);
  const {isMobile,isTablet} = useBreakpoint();
  const {user, canUseRegionalFilter} = useAuth();
  const canRegional = canUseRegionalFilter();

  const [y1,    sY1]    = useState(2025);
  const [wStart1, sWStart1] = useState(0);
  const [w1,    sW1]    = useState(0);
  const [y2,    sY2]    = useState(2026);
  const [wStart2, sWStart2] = useState(0);
  const [w2,    sW2]    = useState(0);
  const [af,    sAf]    = useState('');
  const [rf,    sRf]    = useState(''); // filter regional, mutually exclusive dengan `af`
  const [selectedUnit, setSelectedUnit] = useState('units_dos'); // draft, dikontrol tombol unit

  // Area & regional mutually exclusive: pilih salah satu akan mengosongkan yang lain,
  // biar backend gak bingung mesti filter berdasarkan mana.
  const handleAfChange = (v: string) => { sAf(v); if (v) sRf(''); };
  const handleRfChange = (v: string) => { sRf(v); if (v) sAf(''); };

  // Snapshot filter yang TERAKHIR SUKSES di-fetch. Dipakai untuk render & untuk
  // menghitung "unapplied" (filter sudah diubah tapi belum diterapkan).
  const [applied, setApplied] = useState({
    y1: 2025, wStart1: 0, w1: 0,
    y2: 2026, wStart2: 0, w2: 0,
    af: '', regional: '', unit: 'units_dos',
  });

  const unapplied =
    y1 !== applied.y1 || wStart1 !== applied.wStart1 || w1 !== applied.w1 ||
    y2 !== applied.y2 || wStart2 !== applied.wStart2 || w2 !== applied.w2 ||
    af !== applied.af || rf !== applied.regional || selectedUnit !== applied.unit;

  const [areas,setAreas]=useState<AreaConfig[]>([]);
  const [regions,setRegions]=useState<RegionConfig[]>([]);
  const [loading,setLoading]=useState(false);
  const [availH,setAvailH]=useState(600);
  const mainRef=useRef<HTMLDivElement>(null);

  const [distWeekStart, setDistWeekStart] = useState(1);
  const [distWeekEnd,   setDistWeekEnd]   = useState(52);
  const [distData, setDistData] = useState<any>(null);
  const [distLoaded,    setDistLoaded]    = useState(false);
  const [distLoading,   setDistLoading]  = useState(false);

  const [data,setData]=useState<SalesData>(EMPTY_DATA);
  const t=tk[theme];

  // Regional yang boleh dilihat user ini (root lihat semua)
  const accessibleRegions = user
    ? getAccessibleRegions(regions, user.allowed_areas ?? [], user.role === 'root')
    : [];

  useEffect(()=>{
    try {
      const s=localStorage.getItem('dashboard-theme') as Theme|null;
      if(s==='dark'||s==='light') setTheme(s);
    } catch {}
  },[]);

  const applyTheme=(v:Theme)=>{
    setTheme(v);
    try { localStorage.setItem('dashboard-theme',v); } catch {}
  };

  useEffect(()=>{
    if(isTablet) setCol(true);
  },[isTablet]);

  useEffect(()=>{
    const measure=()=>{ if(!mainRef.current) return; setAvailH(mainRef.current.clientHeight); };
    measure();
    const ro=new ResizeObserver(measure);
    if(mainRef.current) ro.observe(mainRef.current);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    (async()=>{
      try {
        const r=await fetch('/api/areas');
        if(!r.ok) throw new Error();
        const j=await r.json();
        setAreas(j.data?.areas??[]);
      } catch { setAreas([]); }
    })();
  },[]);

  useEffect(()=>{
    if (!canRegional) return; // jangan fetch kalau user gak punya izin, hemat request
    (async()=>{
      try {
        const r=await fetch('/api/regions');
        if(!r.ok) throw new Error();
        const j=await r.json();
        setRegions(j.data?.regions??[]);
      } catch { setRegions([]); }
    })();
  },[canRegional]);

  const doApply = async () => {
  setLoading(true);
  try {
    const p = new URLSearchParams();
    p.append('year1', String(y1));
    p.append('year2', String(y2));

    // P1
    if (wStart1 > 0) p.append('weekStart1', String(wStart1));
    if (w1 > 0)      p.append('weekEnd1',   String(w1));

    // P2
    if (wStart2 > 0) p.append('weekStart2', String(wStart2));
    if (w2 > 0)      p.append('weekEnd2',   String(w2));

    // Area & regional mutually exclusive regional diprioritaskan kalau somehow keduanya terisi
    if (rf.trim())       p.append('regional', rf.trim());
    else if (af.trim())  p.append('area', af.trim());

    if (selectedUnit) p.append('selectedUnit', selectedUnit);

    const r = await fetch(`/api/sales-analysis?${p}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (j.success) {
      setData(j.data);
      // Snapshot disimpan HANYA setelah fetch sukses, ini sumber
      // untuk chip mobile, KPI/chart (selectedUnit di OverviewTab), dan "unapplied".
      setApplied({ y1, wStart1, w1, y2, wStart2, w2, af, regional: rf, unit: selectedUnit });
    }
    else console.error('API error:', j.error);
  } catch (e) {
    console.error('doApply failed:', e);
  } finally {
    setLoading(false);
  }
};

  const doReset = () => {
    sWStart1(0); sW1(0);
    sWStart2(0); sW2(0);
    sAf(''); sRf('');
    setSelectedUnit('units_dos');
    setApplied({ y1, wStart1:0, w1:0, y2, wStart2:0, w2:0, af:'', regional:'', unit:'units_dos' });
    setData(EMPTY_DATA);
  };

  const sideW=isMobile?0:(collapsed?52:200);
  const pad=isMobile?10:12;
  const isRO=user?.role==='user';

  const renderContent=()=>{
    switch(tab){
      case 'weekly':    return <WeekComparison data={data.weekComparisons} comparisonYears={data.comparisonYears} comparisonWeeks={data.comparisonWeeks} theme={theme}/>;
      case 'quarterly': return <QuarterlyAnalysis data={data.quarterlyData} theme={theme} selectedUnit={selectedUnit} onUnitChange={setSelectedUnit}/>;
      case 'quarterly2': return <QuarterlyAnalysisYearly data={data.QuarterlyYoYData ?? []} theme={theme} selectedUnit={selectedUnit} onUnitChange={setSelectedUnit} previousYearLabel={applied.y1} currentYearLabel={applied.y2}/>;
      case 'l4wc4w':   return <L4WC4WAnalysis data={data.l4wc4wData} theme={theme}/>;
      case 'yoy':       return <YearOnYearGrowth data={data.yearOnYearGrowth} comparisonYears={data.comparisonYears} theme={theme}/>;
      case 'outlet':    return <OutletContributionSection data={data} theme={theme}/>;
      case 'analysis':  return <AnalysisSection data={data} theme={theme}/>;
      case 'distribution': return (<DistributionSection theme={theme} areas={areas} areaFilter={applied.af} weekStart={distWeekStart} weekEnd={distWeekEnd} onWeekStartChange={setDistWeekStart} onWeekEndChange={setDistWeekEnd}
                                    cachedData={distData} onDataLoaded={(d) => { setDistData(d); setDistLoaded(true); }} loaded={distLoaded} loading={distLoading} onLoadingChange={setDistLoading} />);
      case 'piutang': return <PiutangComponent data={data.piutangList ?? []} weeklyData={data.weeklyData} theme={theme}/>
      default: return <OverviewTab data={data} theme={theme} y1={y1} y2={y2} availH={availH} selectedUnit={applied.unit}/>;
    }
  };

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{width:'100%',background:t.pagebg,fontFamily:'IBM Plex Sans,sans-serif',height:'100dvh',display:'flex',position:'relative',overflow:'hidden'}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap');
          html,body{margin:0;padding:0;height:100%}
          body{overflow:hidden}
          *,*::before,*::after{box-sizing:border-box}
          ::-webkit-scrollbar{width:3px;height:3px}
          ::-webkit-scrollbar-track{background:transparent}
          ::-webkit-scrollbar-thumb{background:${t.scrollbar};border-radius:2px}
          @keyframes spin{to{transform:rotate(360deg)}}
          button{-webkit-tap-highlight-color:transparent}
          select:focus{outline:2px solid rgba(28,151,6,0.38);outline-offset:1px}
        `}</style>

        {!isMobile&&<Sidebar activeTab={tab} setActiveTab={setTab} collapsed={collapsed} setCollapsed={setCol} theme={theme} setTheme={applyTheme}/>}

        <div style={{
          marginLeft:sideW, display:'flex', flexDirection:'column', height:'100dvh', flex:1,
          transition:isMobile?'none':'margin-left 0.2s cubic-bezier(.4,0,.2,1)',
          overflow:'hidden', minWidth:0,
        }}>
          {isMobile&&<MobileHeader theme={theme} setTheme={applyTheme}/>}

          {isMobile?(
            <>
              <MobileFilterBar
                applied={applied} unapplied={unapplied} areas={areas} regions={accessibleRegions}
                onOpen={()=>setSheet(true)} loading={loading} theme={theme}
              />
               <MobileFilterSheet
                open={sheetOpen} onClose={()=>setSheet(false)}
                y1={y1} sY1={sY1} wStart1={wStart1} sWStart1={sWStart1} w1={w1} sW1={sW1}
                y2={y2} sY2={sY2} wStart2={wStart2} sWStart2={sWStart2} w2={w2} sW2={sW2}
                af={af} sAf={handleAfChange} areas={areas}
                rf={rf} sRf={handleRfChange} regions={accessibleRegions} canRegional={canRegional}
                selectedUnit={selectedUnit} sSelectedUnit={setSelectedUnit}
                unapplied={unapplied}
                onApply={doApply} onReset={doReset} loading={loading} theme={theme}
              />

            </>
          ):(
            <DesktopFilterBar
              y1={y1} sY1={sY1} wStart1={wStart1} sWStart1={sWStart1} w1={w1} sW1={sW1}
              y2={y2} sY2={sY2} wStart2={wStart2} sWStart2={sWStart2} w2={w2} sW2={sW2}
              af={af} sAf={handleAfChange} areas={areas}
              rf={rf} sRf={handleRfChange} regions={accessibleRegions} canRegional={canRegional}
              selectedUnit={selectedUnit} sSelectedUnit={setSelectedUnit}
              unapplied={unapplied}
              onApply={doApply} onReset={doReset} loading={loading} theme={theme}
            />
          )}

          <main
            ref={mainRef}
            style={{
              flex:1, minHeight:0, padding:pad,
              paddingBottom: isMobile
                ? `calc(48px + env(safe-area-inset-bottom,0px) + ${pad}px)`
                : `${pad}px`,
              background:t.contentBg,
              overflow:(tab==='overview'&&!isMobile)?'hidden':'auto',
              position:'relative',
            }}
          >
            {loading && <LoadingOverlay theme={theme} targetRef={mainRef}/>}
            {tab==='overview'
              ? renderContent()
              : <ContentWrapper theme={theme}>{renderContent()}</ContentWrapper>
            }
          </main>
        </div>

        {isMobile&&<MobileBottomNav activeTab={tab} setActiveTab={setTab} theme={theme}/>}
      </div>
    </ThemeCtx.Provider>
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <SessionGuard>
        <DashboardInner/>
      </SessionGuard>
    </AuthProvider>
  );
}