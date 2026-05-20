'use client';

import { useState, useEffect, useRef, createContext } from 'react';
import WeekComparison from '@/components/WeekComparison';
import QuarterlyAnalysis from '@/components/QuarterlyAnalysis';
import L4WC4WAnalysis from '@/components/L4WC4WAnalysis';
import YearOnYearGrowth from '@/components/YearOnYearGrowth';
import AnalysisSection from '@/components/AnalysisSection';
import OutletContributionSection from '@/components/OutletContributionSection';
import DistributionSection from '@/components/DistributionSection';
import { SalesData } from '@/types/sales';
import { AreaConfig } from '@/lib/areaConfig';
import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';
import { getProductCategory } from '@/lib/productCategories';
import {
  TrendingUp, Calendar, BarChart3, PieChart,
  Activity, FileText, Store, Sun, Moon,
  ChevronLeft, Filter, X, LogOut,
  ShieldAlert, ShieldCheck, Shield,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
  PieChart as RechartsPieChart, Pie,
  BarChart,
} from 'recharts';

type Theme = 'dark' | 'light';
const ThemeCtx = createContext<Theme>('dark');

function useBreakpoint() {
  const [bp, setBp] = useState({ isMobile: false, isTablet: false });
  useEffect(() => {
    const u = () => {
      const w = window.innerWidth;
      setBp({ isMobile: w < 768, isTablet: w >= 768 && w < 1024 });
    };
    u();
    window.addEventListener('resize', u);
    return () => window.removeEventListener('resize', u);
  }, []);
  return bp;
}

const tk = {
  dark: {
    pagebg: '#07090e', sidebarbg: '#0b0d13', headerbg: 'rgba(11,13,19,0.96)',
    filterbg: '#0b0d13', cardbg: '#0e1118', bottombarbg: 'rgba(11,13,19,0.97)',
    border: 'rgba(255,255,255,0.055)', borderCard: 'rgba(255,255,255,0.075)',
    borderInput: 'rgba(255,255,255,0.09)',
    text: 'rgba(255,255,255,0.92)', textSub: 'rgba(255,255,255,0.52)',
    textMuted: 'rgba(255,255,255,0.28)', textFaint: 'rgba(255,255,255,0.13)',
    textNav: 'rgba(255,255,255,0.36)',
    navActiveBg: 'rgba(28,151,6,0.11)', navActiveText: '#4ade80', navActiveDot: '#1c9706',
    inputBg: 'rgba(255,255,255,0.035)', toggleBg: 'rgba(255,255,255,0.055)',
    toggleBorder: 'rgba(255,255,255,0.09)', optionBg: '#0b0d13',
    scrollbar: 'rgba(255,255,255,0.08)',
    chipBlue:   { bg:'rgba(59,130,246,0.11)',  text:'#93c5fd', border:'rgba(59,130,246,0.25)'  },
    chipSlate:  { bg:'rgba(100,116,139,0.11)', text:'#cbd5e1', border:'rgba(100,116,139,0.25)' },
    chipOrange: { bg:'rgba(249,115,22,0.11)',  text:'#fb923c', border:'rgba(249,115,22,0.25)'  },
    card1bg:'#0d1a28', card1border:'#1a3a5c', card1text:'#7eb8f7', card1accent:'#3b82f6',
    card2bg:'#0a1d14', card2border:'#1a4530', card2text:'#5edba8', card2accent:'#10b981',
    card3bg:'#1a1108', card3border:'#3d2b08', card3text:'#f5d060', card3accent:'#f59e0b',
    posBg:'rgba(16,185,129,0.09)',  posText:'#34d399', posBorder:'rgba(16,185,129,0.2)',
    negBg:'rgba(239,68,68,0.09)',   negText:'#f87171', negBorder:'rgba(239,68,68,0.2)',
    warnBg:'rgba(245,158,11,0.07)', warnText:'#fbbf24', warnBorder:'rgba(245,158,11,0.18)',
    red:{ bg:'rgba(239,68,68,0.08)', text:'#fca5a5', border:'rgba(239,68,68,0.18)' },
    gridStroke:'rgba(255,255,255,0.04)',
    tooltipBg:'#13161f', tooltipBorder:'rgba(255,255,255,0.09)',
    contentBg:'#07090e', shadowCard:'none',
  },
  light: {
    pagebg: '#eef1f7', sidebarbg: '#ffffff', headerbg: 'rgba(255,255,255,0.96)',
    filterbg: '#ffffff', cardbg: '#ffffff', bottombarbg: 'rgba(255,255,255,0.97)',
    border: 'rgba(0,0,0,0.065)', borderCard: 'rgba(0,0,0,0.08)',
    borderInput: 'rgba(0,0,0,0.1)',
    text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8',
    textFaint: '#cbd5e1', textNav: '#64748b',
    navActiveBg: 'rgba(28,151,6,0.07)', navActiveText: '#15803d', navActiveDot: '#1c9706',
    inputBg: 'rgba(0,0,0,0.03)', toggleBg: '#f1f5f9', toggleBorder: 'rgba(0,0,0,0.09)',
    optionBg: '#ffffff', scrollbar: 'rgba(0,0,0,0.12)',
    chipBlue:   { bg:'rgba(37,99,235,0.07)',   text:'#1d4ed8', border:'rgba(37,99,235,0.2)'   },
    chipSlate:  { bg:'rgba(100,116,139,0.07)', text:'#475569', border:'rgba(100,116,139,0.16)' },
    chipOrange: { bg:'rgba(234,88,12,0.07)',   text:'#c2410c', border:'rgba(234,88,12,0.16)'   },
    card1bg:'#eff6ff', card1border:'#bfdbfe', card1text:'#1d4ed8', card1accent:'#3b82f6',
    card2bg:'#f0fdf4', card2border:'#bbf7d0', card2text:'#15803d', card2accent:'#10b981',
    card3bg:'#fefce8', card3border:'#fde68a', card3text:'#92400e', card3accent:'#f59e0b',
    posBg:'#f0fdf4',  posText:'#15803d', posBorder:'#bbf7d0',
    negBg:'#fef2f2',  negText:'#b91c1c', negBorder:'#fecaca',
    warnBg:'#fffbeb', warnText:'#92400e', warnBorder:'#fde68a',
    red:{ bg:'#fef2f2', text:'#b91c1c', border:'#fecaca' },
    gridStroke:'rgba(0,0,0,0.045)',
    tooltipBg:'#ffffff', tooltipBorder:'rgba(0,0,0,0.1)',
    contentBg:'#eef1f7', shadowCard:'0 1px 3px rgba(0,0,0,0.06)',
  },
} as const;

const CC = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#0d9488','#f97316','#ec4899'];
const YEARS = [2022,2023,2024,2025,2026,2027,2028];
const WEEKS = Array.from({length:52},(_,i)=>i+1);

const fmtK = (v:number) => v>=1e9?`${(v/1e9).toFixed(1)}B`:v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}K`:String(Math.round(v));

// FIX: 2 desimal, tanpa pembulatan
const fmtU  = (v:number) => v.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtUF = (v:number) => v.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});

function getDetailUnitValue(d: any, unit: string, field: 'actual' | 'target'): number {
  const ud = d[unit] as { target?: number; actual?: number } | undefined;
  if (ud && ud[field] !== undefined && ud[field] !== null) return ud[field] as number;
  if (field === 'actual') {
    return d.currentYear ?? d.actual ?? d[unit + '_actual'] ?? 0;
  }
  return d.target ?? d[unit + '_target'] ?? 0;
}

function getQuarterValueFromDetails(q: any, unit: string, field: 'actual' | 'target'): number {
  if (!q.details?.length) {
    return field === 'actual' ? (q.actual ?? 0) : (q.target ?? 0);
  }
  return (q.details as any[]).reduce((sum: number, d: any) => {
    return sum + getDetailUnitValue(d, unit, field);
  }, 0);
}

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
      minHeight: '100vh', background: '#07090e',
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
  {id:'overview',  label:'Ringkasan',  shortLabel:'Ringkasan', Icon:TrendingUp},
  {id:'weekly',    label:'Mingguan',   shortLabel:'Mingguan',  Icon:Calendar  },
  {id:'quarterly', label:'Kuartal',    shortLabel:'Kuartal',   Icon:BarChart3 },
  {id:'l4wc4w',   label:'L4W vs C1W', shortLabel:'L4W',       Icon:Activity  },
  {id:'yoy',      label:'YoY Growth', shortLabel:'YoY',       Icon:PieChart  },
  {id:'outlet',   label:'Outlet',     shortLabel:'Outlet',    Icon:Store     },
  {id:'analysis', label:'Brand Performance',   shortLabel:'Brand',  Icon:FileText  },
  {id:'distribution', label:'Distribusi', shortLabel:'Distribusi', Icon:Filter},
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
              style={{display:'flex',alignItems:'center',gap:8,width:'100%',minHeight:33,padding:collapsed?'5px 0':'5px 8px',borderRadius:7,border:'none',cursor:'pointer',justifyContent:collapsed?'center':'flex-start',background:active?t.navActiveBg:'transparent',color:active?t.navActiveText:t.textNav,fontSize:12,fontWeight:active?600:400,fontFamily:'IBM Plex Sans,sans-serif',transition:'all 0.12s',marginBottom:1,position:'relative'}}>
              <Icon size={13} color={active?t.navActiveText:t.textMuted}/>
              {!collapsed&&<span style={{flex:1,textAlign:'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>}
              {active&&<span style={{position:'absolute',left:0,top:'20%',bottom:'20%',width:2,borderRadius:'0 2px 2px 0',background:t.navActiveDot}}/>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:collapsed?'8px 4px':'8px',borderTop:`1px solid ${t.border}`,flexShrink:0,display:'flex',flexDirection:'column',gap:5,alignItems:collapsed?'center':'stretch'}}>
        {collapsed ? (
          <>
            <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} style={{background:'none',border:'none',cursor:'pointer',color:t.textMuted,borderRadius:7,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>{theme==='dark'?<Sun size={13}/>:<Moon size={13}/>}</button>
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

function DesktopFilterBar({ y1,sY1,w1,sW1,y2,sY2,w2,sW2,af,sAf,areas,onApply,onReset,loading,theme }:{
  y1:number;sY1:(v:number)=>void;w1:number;sW1:(v:number)=>void;
  y2:number;sY2:(v:number)=>void;w2:number;sW2:(v:number)=>void;
  af:string;sAf:(v:string)=>void;areas:AreaConfig[];
  onApply:()=>void;onReset:()=>void;loading:boolean;theme:Theme;
}) {
  const t=tk[theme]; const dirty=w1!==0||w2!==0||!!af;
  const yO=YEARS.map(y=>({value:y,label:String(y)}));
  const wO=[{value:0,label:'Semua'},...WEEKS.map(w=>({value:w,label:`W${w}`}))];
  const aO=[{value:'',label:'Semua Area'},...areas.map(a=>({value:a.id,label:a.name}))];
  const Sep=()=><div style={{width:1,height:12,background:t.border,margin:'0 1px',flexShrink:0}}/>;
  const Lbl=({c}:{c:string})=><span style={{fontSize:8,fontWeight:700,color:t.textFaint,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>{c}</span>;
  const [dotStep, setDotStep] = useState(0);
  useEffect(() => {
    if (loading) {
      const t = setInterval(() => setDotStep(s => (s + 1) % 3), 400);
      return () => clearInterval(t);
    }
  }, [loading]);
  return (
    <div style={{flexShrink:0,background:t.filterbg,borderBottom:`1px solid ${t.border}`}}>
      <div style={{display:'flex',alignItems:'center',padding:'0 14px',height:36,gap:4}}>
        <Lbl c="P1"/>
        <Sel value={y1} onChange={v=>sY1(+v)} options={yO} theme={theme} style={{width:60}}/>
        <Sel value={w1} onChange={v=>sW1(+v)} options={wO} theme={theme} style={{width:68}}/>
        <Sep/><span style={{fontSize:8,fontWeight:800,color:t.textFaint,fontFamily:'monospace',letterSpacing:'0.12em',flexShrink:0}}>VS</span><Sep/>
        <Lbl c="P2"/>
        <Sel value={y2} onChange={v=>sY2(+v)} options={yO} theme={theme} style={{width:60}}/>
        <Sel value={w2} onChange={v=>sW2(+v)} options={wO} theme={theme} style={{width:68}}/>
        <Sep/>
        <Sel value={af} onChange={v=>sAf(String(v))} options={aO} theme={theme} style={{minWidth:106}}/>
        <div style={{flex:1}}/>
        {loading && (
  <>
    <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:4,height:4,borderRadius:'50%',background:'#4ade80',
          transition:'opacity 0.2s',opacity:i===dotStep?1:0.25}}/>
      ))}
    </div>
    <div style={{fontSize:9,fontFamily:'monospace',color:'#4ade80',letterSpacing:'0.06em',
      background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',
      borderRadius:3,padding:'0 6px',height:16,display:'flex',alignItems:'center'}}>
      mengambil data
    </div>
  </>
)}
        {dirty&&<button onClick={onReset} style={{height:22,padding:'0 7px',borderRadius:4,fontSize:10,fontFamily:'monospace',background:'transparent',border:`1px solid ${t.borderInput}`,color:t.textMuted,cursor:'pointer'}}>Reset</button>}
        <button onClick={onApply} disabled={loading}
          style={{height:22,padding:'0 11px',borderRadius:4,fontSize:10,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',background:'#1c9706',border:'none',color:'#fff',cursor:loading?'not-allowed':'pointer',opacity:loading?0.5:1,flexShrink:0,boxShadow:'0 1px 4px rgba(28,151,6,0.3)'}}>
          Terapkan
        </button>
      </div>
    </div>
  );
}

function MobileFilterBar({ y1,w1,y2,w2,af,areas,onOpen,loading,theme }:{ 
  y1:number;w1:number;y2:number;w2:number;af:string;
  areas:AreaConfig[];onOpen:()=>void;loading:boolean;theme:Theme 
}) {
  const t=tk[theme];
  const [dotStep, setDotStep] = useState(0);

  useEffect(() => {
    if (loading) {
      const id = setInterval(() => setDotStep(s => (s + 1) % 3), 400);
      return () => clearInterval(id);
    }
  }, [loading]);

  type CV='blue'|'slate'|'orange';
  const Chip=({v,ch}:{v:string;ch:CV})=>{
    const key=`chip${ch.charAt(0).toUpperCase()+ch.slice(1)}` as keyof typeof t;
    const c=t[key] as {bg:string;text:string;border:string};
    return (
      <span style={{
        padding:'1px 5px',borderRadius:4,fontSize:9,fontWeight:600,
        fontFamily:'IBM Plex Mono,monospace',background:c.bg,color:c.text,
        border:`1px solid ${c.border}`,whiteSpace:'nowrap'
      }}>{v}</span>
    );
  };

  const aName=areas.find(a=>a.id===af)?.name;

  return (
    <div style={{
      background:t.filterbg,borderBottom:`1px solid ${t.border}`,
      height:32,display:'flex',alignItems:'center',padding:'0 10px',gap:6
    }}>
      {/* Tombol buka filter */}
      <button
        onClick={onOpen}
        style={{
          display:'flex',alignItems:'center',gap:4,height:20,padding:'0 7px',
          borderRadius:4,background:t.inputBg,border:`1px solid ${t.borderInput}`,
          color:t.textSub,fontSize:9,fontFamily:'monospace',cursor:'pointer',flexShrink:0
        }}
      >
        <Filter size={8}/>Filter
      </button>

      {/* Chips periode & area */}
      <div style={{
        display:'flex',gap:4,flex:1,overflowX:'auto',alignItems:'center',scrollbarWidth:'none'
      }}>
        <Chip v={`${y1}${w1>0?` W${w1}`:''}`} ch="blue"/>
        <span style={{fontSize:8,color:t.textFaint,fontFamily:'monospace',flexShrink:0}}>vs</span>
        <Chip v={`${y2}${w2>0?` W${w2}`:''}`} ch="slate"/>
        {aName&&<Chip v={aName} ch="orange"/>}
      </div>

      {/* Loading — sama persis dengan desktop */}
      {loading && (
        <>
          <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0}}>
            {[0,1,2].map(i=>(
              <div
                key={i}
                style={{
                  width:4,height:4,borderRadius:'50%',background:'#4ade80',
                  transition:'opacity 0.2s',opacity:i===dotStep?1:0.25
                }}
              />
            ))}
          </div>
          <div style={{
            fontSize:9,fontFamily:'monospace',color:'#4ade80',letterSpacing:'0.06em',
            background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',
            borderRadius:3,padding:'0 6px',height:16,display:'flex',alignItems:'center',
            flexShrink:0
          }}>
            mengambil data
          </div>
        </>
      )}
    </div>
  );
}

function MobileFilterSheet({ open,onClose,y1,sY1,w1,sW1,y2,sY2,w2,sW2,af,sAf,areas,onApply,onReset,loading,theme }:{
  open:boolean;onClose:()=>void;
  y1:number;sY1:(v:number)=>void;w1:number;sW1:(v:number)=>void;
  y2:number;sY2:(v:number)=>void;w2:number;sW2:(v:number)=>void;
  af:string;sAf:(v:string)=>void;areas:AreaConfig[];
  onApply:()=>void;onReset:()=>void;loading:boolean;theme:Theme;
}) {
  const t=tk[theme]; const dirty=w1!==0||w2!==0||!!af;
  const yO=YEARS.map(y=>({value:y,label:String(y)}));
  const wO=[{value:0,label:'Semua'},...WEEKS.map(w=>({value:w,label:`Minggu ${w}`}))];
  const aO=[{value:'',label:'Semua Area'},...areas.map(a=>({value:a.id,label:a.name}))];
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
        maxHeight:'80vh', display:'flex', flexDirection:'column',
      }}>
        <div style={{display:'flex',justifyContent:'center',padding:'8px 0 0'}}><div style={{width:24,height:3,borderRadius:2,background:t.textFaint}}/></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 14px',borderBottom:`1px solid ${t.border}`,flexShrink:0}}>
          <span style={{fontSize:13,fontWeight:700,color:t.text}}>Filter Data</span>
          <button onClick={onClose} style={{width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:t.inputBg,border:`1px solid ${t.borderInput}`,color:t.textMuted}}><X size={11}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'0 14px 4px'}}>
          {([['P1',y1,sY1,w1,sW1],['P2',y2,sY2,w2,sW2]] as any[]).map(([lbl,y,sY,w,sW])=>(
            <div key={lbl}>
              <div style={{paddingTop:10,fontSize:8,fontWeight:800,color:t.textMuted,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.12em'}}>{lbl}</div>
              <Row l="Tahun"><Sel value={y} onChange={(v:any)=>sY(+v)} options={yO} theme={theme}/></Row>
              <Row l="Minggu"><Sel value={w} onChange={(v:any)=>sW(+v)} options={wO} theme={theme} style={{minWidth:130}}/></Row>
            </div>
          ))}
          <div style={{paddingTop:10,fontSize:8,fontWeight:800,color:t.textMuted,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.12em'}}>Area</div>
          <Row l="Filter Area"><Sel value={af} onChange={(v:any)=>sAf(String(v))} options={aO} theme={theme} style={{minWidth:130}}/></Row>
        </div>
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

function CT({ active, payload, label, theme }:any) {
  const t=tk[theme as Theme];
  if (!active||!payload?.length) return null;
  const isUnitChart = payload.some((p:any) =>
    p.name?.includes('Target') || p.name?.includes('Actual') ||
    p.name?.includes('Dos') || p.name?.includes('Bks') || p.name?.includes('Slop') || p.name?.includes('Bal')
  );
  // FIX: tooltip juga pakai 2 desimal
  const formatValue = (value: any) => {
    if (typeof value !== 'number') return value;
    return isUnitChart ? fmtU(value) : fmtK(value);
  };
  return (
    <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:8,padding:'7px 10px',fontSize:10,fontFamily:'IBM Plex Mono,monospace',boxShadow:'0 6px 20px rgba(0,0,0,0.25)'}}>
      <div style={{color:t.textMuted,marginBottom:4,fontSize:9}}>{label}</div>
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:p.color||p.fill,flexShrink:0}}/>
          <span style={{color:t.textSub,flex:1}}>{p.name}</span>
          <span style={{fontWeight:700,color:t.text}}>{formatValue(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Card({ children, theme, title, icon, color, sub, style, accent }:{
  children: React.ReactNode; theme: Theme;
  title?: string; icon?: React.ReactNode; color?: string; accent?: string;
  sub?: string; style?: React.CSSProperties;
}) {
  const t = tk[theme];
  return (
    <div style={{
      background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 13,
      padding: '10px 12px 8px', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxShadow: t.shadowCard, position: 'relative',
      transition: 'box-shadow 0.18s ease', ...style,
    }}>
      {accent && <div style={{ position:'absolute', top:0, left:16, right:16, height:2, borderRadius:'0 0 2px 2px', background:`linear-gradient(90deg, ${accent}55, ${accent}22)` }}/>}
      {title && (
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8, flexShrink:0 }}>
          {icon && color && (
            <div style={{ width:22, height:22, borderRadius:6, background:`${color}15`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:t.text, fontFamily:'IBM Plex Sans, sans-serif', lineHeight:1.25, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
            {sub && <div style={{ fontSize:8.5, color:t.textMuted, fontFamily:'IBM Plex Mono, monospace', marginTop:1 }}>{sub}</div>}
          </div>
        </div>
      )}
      <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>{children}</div>
    </div>
  );
}

function KpiMini({ bg, border, labelColor, label, value, sub, badge, theme, accent }:{
  bg:string; border:string; labelColor:string; label:string; value:string; sub?:string;
  badge?:{text:string; positive:boolean}; theme:Theme; accent?:string;
}) {
  const t = tk[theme];
  return (
    <div style={{ borderRadius:12, padding:'14px 16px 12px', background:bg, border:`1px solid ${border}`, display:'flex', flexDirection:'column', gap:6, position:'relative', overflow:'hidden' }}>
      {accent && <div style={{ position:'absolute', top:-18, right:-18, width:64, height:64, borderRadius:'50%', background:`${accent}18`, pointerEvents:'none' }}/>}
      <div style={{ fontSize:9, fontFamily:'IBM Plex Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', color:labelColor, fontWeight:700 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:800, color:t.text, fontFamily:'IBM Plex Mono, monospace', letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:9.5, color:t.textMuted, fontFamily:'IBM Plex Mono, monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</div>}
      {badge && (
        <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:10, width:'fit-content', fontSize:9, fontWeight:700, fontFamily:'IBM Plex Mono, monospace', background:badge.positive?t.posBg:t.negBg, color:badge.positive?t.posText:t.negText, border:`1px solid ${badge.positive?t.posBorder:t.negBorder}` }}>
          {badge.positive?<ArrowUpRight size={9}/>:<ArrowDownRight size={9}/>}
          {badge.text}
        </span>
      )}
    </div>
  );
}

const mkTick=(theme:Theme)=>({fontSize:8,fill:tk[theme].textMuted,fontFamily:'IBM Plex Mono,monospace'});

const UNIT_OPTIONS = [
  { value: 'units_dos', label: 'Dos',  fullLabel: 'Jual (Dos Net)'  },
  { value: 'units_bks', label: 'Bks',  fullLabel: 'Jual (Bks Net)'  },
  { value: 'units_slop',label: 'Slop', fullLabel: 'Jual (Slop Net)' },
  { value: 'units_bal', label: 'Bal',  fullLabel: 'Jual (Bal Net)'  },
];

function OverviewTab({ data, theme, y1, y2, availH, selectedUnit = 'units_dos' }:{
  data:SalesData; theme:Theme; y1:number; y2:number;
  availH:number; selectedUnit?: string;
}) {
  const t=tk[theme];
  const {isMobile,isTablet}=useBreakpoint();
  const hasData=data.weekComparisons.length>0;

  if (!hasData) return (
    <div style={{ height:availH, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
      <style>{`@keyframes emptyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
      <div style={{ width:52, height:52, borderRadius:14, background:t.inputBg, border:`1px solid ${t.borderCard}`, display:'flex', alignItems:'center', justifyContent:'center', animation:'emptyFloat 3s ease-in-out infinite' }}>
        <TrendingUp size={22} color={t.textMuted}/>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, maxWidth:320 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:t.text, fontFamily:'IBM Plex Mono, monospace', marginBottom:4 }}>:)</div>
          <div style={{ fontSize:10, color:t.textMuted, fontFamily:'IBM Plex Mono, monospace' }}>Ikuti langkah berikut untuk memulai</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0, width:'100%' }}>
          {[
            { n:1, title:'Pilih Periode',   desc:'Atur tahun & minggu untuk P1 dan P2 di filter bar atas',                  last:false },
            { n:2, title:'Pilih Area',      badge:'opsional', desc:'Kosongkan untuk semua area, atau pilih area tertentu',   last:false },
            { n:3, title:'Klik "Terapkan"', desc:'Dashboard akan memuat data sesuai filter yang dipilih',                   last:true  },
          ].map(({ n, title, badge, desc, last }) => (
            <div key={n} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:`rgba(28,151,6,${0.22 - n * 0.05})`, border:`1px solid rgba(28,151,6,${0.38 - n * 0.1})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:n===1?'#4ade80':n===2?'#86efac':'#bbf7d0', fontFamily:'IBM Plex Mono, monospace' }}>{n}</div>
                {!last && <div style={{ width:1, height:28, background:'rgba(28,151,6,0.15)' }}/>}
              </div>
              <div style={{ paddingTop:4, paddingBottom:last?0:18 }}>
                <div style={{ fontSize:12, fontWeight:700, color:t.text, fontFamily:'IBM Plex Mono, monospace', marginBottom:3 }}>
                  {title}
                  {badge && <span style={{ marginLeft:6, fontSize:9, fontWeight:400, color:t.textMuted }}>({badge})</span>}
                </div>
                <div style={{ fontSize:10, color:t.textSub, fontFamily:'IBM Plex Mono, monospace', lineHeight:1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const { yearOnYearGrowth:yoy, weekComparisons:wc, quarterlyData:qd, comparisonYears:cy, l4wc4wData:l4w, outletData=[] } = data as any;
  const pL=cy?.previousYear??y1; const cL=cy?.currentYear??y2;
  const gPct=yoy.variancePercentage; const isPos=gPct>=0;
  const posW=wc.filter((w:any)=>w.variancePercentage>0).length;

  const qDataComputed = (qd as any[]).map((q: any) => {
    const target = getQuarterValueFromDetails(q, selectedUnit, 'target');
    const actual = getQuarterValueFromDetails(q, selectedUnit, 'actual');
    const pct    = target > 0 ? Math.round((actual / target) * 100) : 0;
    return { n: q.quarter, t: target, a: actual, pct };
  });
  const hitQ = qDataComputed.filter(q => q.pct >= 100).length;

  const categoryMap = new Map<string, number>();
  wc.forEach((w: any) => {
    (w.details ?? []).forEach((d: any) => {
      if (!d.product) return;
      const cat = getProductCategory(d.product);
      const val = d[selectedUnit]?.current ?? d.units_dos?.current ?? d.currentYear ?? 0;
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + val);
    });
  });
  const catData = Array.from(categoryMap.entries())
    .map(([n, v]) => ({ n, v }))
    .filter(d => d.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 7);
  const catTotal = catData.reduce((s, d) => s + d.v, 0);

  const rows:any[] = Array.isArray(outletData) ? outletData : [];
  const ts=mkTick(theme); const gs=t.gridStroke;

  const KPI_H=108; const GAP=8; const PADBOT=10;
  const bodyH=availH-KPI_H-GAP-PADBOT;
  const cH=Math.max(64, Math.floor((bodyH-46*2-GAP)/2)-10);

  const weekData=wc.map((w:any)=>({w:`W${w.week}`,p:w.previousYear,c:w.currentYear,g:w.variancePercentage}));
  const mnths=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const mData=mnths.map((m,mi)=>{
    const s=mi*4+1;
    const ws=wc.filter((w:any)=>w.week>=s&&w.week<=s+3);
    return {m,p:ws.reduce((a:number,w:any)=>a+(w.previousYear||0),0),c:ws.reduce((a:number,w:any)=>a+(w.currentYear||0),0)};
  }).filter((d:any)=>d.p>0||d.c>0);

  const l4wAvg=l4w.l4wAverage; const c1w=l4w.c1wValue; const lPos=c1w>=l4wAvg; const lc=lPos?'#10b981':'#ef4444';
  const lData=l4w.weeklyTrendData?.map((item:any)=>({w:item.week,v:item.value,avg:l4wAvg}))||[];

  const curR=rows.filter((r:any)=>r.year===(cy?.currentYear??y2));
  const oTypes=Array.from(new Set(curR.map((r:any)=>r.outletType))).filter(Boolean) as string[];
  const totDoz=curR.reduce((s:number,r:any)=>s+(r.dozNet||0),0);
  const dData=oTypes.map((ot,i)=>({n:ot,v:curR.filter((r:any)=>r.outletType===ot).reduce((s:number,r:any)=>s+(r.dozNet||0),0),fill:CC[i%CC.length]}));
  const pMap=new Map<string,number>();
  curR.forEach((r:any)=>{if(r.product) pMap.set(r.product,(pMap.get(r.product)||0)+(r.dozNet||0));});
  const topP=Array.from(pMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n,v])=>({n,v}));

  const unitLabel=UNIT_OPTIONS.find(o=>o.value===selectedUnit)?.label??UNIT_OPTIONS[0].label;
  const bodyGrid=isMobile?'1fr':isTablet?'1fr 1fr':'2fr 1.3fr 1.4fr';
  const MOBILE_CHART_H=180;

  if (isMobile) {
    return (
      <div style={{display:'flex',flexDirection:'column',gap:GAP}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:GAP}}>
          <KpiMini bg={t.card1bg} border={t.card1border} labelColor={t.card1text} accent={t.card1accent} label={`${unitLabel} ${pL}`} value={fmtU(yoy.previousYearTotal)} sub={fmtUF(yoy.previousYearTotal)} theme={theme}/>
          <KpiMini bg={t.card2bg} border={t.card2border} labelColor={t.card2text} accent={t.card2accent} label={`${unitLabel} ${cL}`} value={fmtU(yoy.currentYearTotal)} sub={fmtUF(yoy.currentYearTotal)} theme={theme}/>
          <KpiMini bg={t.card3bg} border={t.card3border} labelColor={t.card3text} accent={t.card3accent} label="Growth YoY" value={`${isPos?'+':''}${gPct.toFixed(1)}%`} sub={`Δ ${fmtUF(yoy.variance)}`} badge={{text:isPos?'↑ Tumbuh':'↓ Turun',positive:isPos}} theme={theme}/>
        </div>

        <Card theme={theme} accent="#3b82f6" title={`Mingguan — ${pL} vs ${cL}`} icon={<Calendar size={10} color="#3b82f6"/>} color="#3b82f6" sub={`${posW}/${wc.length} minggu positif`}>
          <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
            <ComposedChart data={weekData} margin={{top:2,right:4,left:0,bottom:0}}>
              {/* <defs><linearGradient id="gCwM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs> */}
              <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
              <XAxis dataKey="w" tick={ts} axisLine={false} tickLine={false} interval={9}/>
              <YAxis yAxisId="l" tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
              <YAxis yAxisId="r" orientation="right" tickFormatter={v=>`${v.toFixed(0)}%`} tick={ts} axisLine={false} tickLine={false} width={26}/>
              <Tooltip content={<CT theme={theme}/>}/>
              <Bar yAxisId="l" dataKey="p" name={String(pL)} fill="#3b82f6" opacity={0.35} radius={[2,2,0,0]} maxBarSize={9}/>
              {/* <Area yAxisId="l" type="monotone" dataKey="c" name={String(cL)} fill="url(#gCwM)" stroke="#10b981" strokeWidth={1.8} dot={false}/> */}
              <Bar yAxisId="l" dataKey="c" name={String(cL)} fill="#10b981" opacity={0.7} radius={[2,2,0,0]} maxBarSize={9}/>
              <Line yAxisId="r" type="monotone" dataKey="g" name="Growth %" stroke="#f59e0b" strokeWidth={1.2} dot={false} strokeDasharray="3 2"/>
              <ReferenceLine yAxisId="r" y={0} stroke="rgba(239,68,68,0.3)" strokeWidth={1} strokeDasharray="3 3"/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme} accent="#f59e0b" title="L4W vs C1W" icon={<Activity size={10} color="#f59e0b"/>} color="#f59e0b" sub={`Δ ${lPos?'+':''}${l4w.variancePercentage?.toFixed(1)??'0'}% vs rata-rata`}>
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            {[{l:'L4W',v:fmtU(l4wAvg),c:'#3b82f6'},{l:'C1W',v:fmtU(c1w),c:lc}].map(p=>(
              <div key={p.l} style={{padding:'4px 8px',borderRadius:7,background:`${p.c}10`,border:`1px solid ${p.c}22`,flex:1}}>
                <div style={{fontSize:7,color:p.c,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.07em'}}>{p.l}</div>
                <div style={{fontSize:10,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace',marginTop:1}}>{p.v}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={MOBILE_CHART_H-40}>
            <ComposedChart data={lData} margin={{top:2,right:4,left:0,bottom:0}}>
              <defs><linearGradient id="gLwM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={lc} stopOpacity={0.25}/><stop offset="95%" stopColor={lc} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
              <XAxis 
  dataKey="week"           // pastikan ini sesuai dengan key di data
  tick={ts} 
  axisLine={false} 
  tickLine={false}
  interval={0}
  angle={-45}
  textAnchor="end"
  height={55}
  dy={12}
/>
              <YAxis tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
              <Tooltip content={<CT theme={theme}/>}/>
              <Area type="monotone" dataKey="v" name={`${unitLabel} ${cL}`} fill="url(#gLwM)" stroke={lc} strokeWidth={2} dot={{fill:lc,r:2.5,strokeWidth:0}}/>
              <Line type="monotone" dataKey="avg" name="L4W Avg" stroke="#3b82f6" strokeWidth={1.2} strokeDasharray="4 2" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme} accent="#8b5cf6" title="Kontribusi Tipe Produk" icon={<PieChart size={10} color="#8b5cf6"/>} color="#8b5cf6" sub={`${catData.length} kategori · ${cL}`}>
          {catData.length === 0 ? (
            <div style={{color:t.textMuted,fontSize:10,textAlign:'center',padding:'16px 0',fontFamily:'IBM Plex Mono,monospace'}}>Terapkan filter untuk melihat data</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {catData.map((d,i)=>{
                const pct=catTotal>0?(d.v/catTotal)*100:0;
                const clr=CC[i%CC.length];
                return (
                  <div key={d.n} style={{display:'flex',alignItems:'center',gap:7,padding:'5px 0',borderBottom:i<catData.length-1?`1px solid ${t.border}`:'none'}}>
                    <span style={{width:36,flexShrink:0,fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:clr}}>{d.n}</span>
                    <div style={{flex:1,height:4,borderRadius:2,background:t.borderCard,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background:clr,borderRadius:2,transition:'width 0.5s ease'}}/>
                    </div>
                    <span style={{width:38,flexShrink:0,textAlign:'right',fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:t.textSub}}>{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* FIX mobile: YoY dulu, baru Kuartal */}
        <Card theme={theme} accent={isPos?'#10b981':'#ef4444'} title={`YoY — ${pL} vs ${cL}`} icon={<TrendingUp size={10} color={isPos?'#10b981':'#ef4444'}/>} color={isPos?'#10b981':'#ef4444'} sub={`${isPos?'+':''}${gPct.toFixed(1)}% pertumbuhan tahunan`}>
          <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
            <ComposedChart data={mData} margin={{top:2,right:4,left:0,bottom:0}}>
              <defs>
                <linearGradient id="gPyM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="gCyM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.22}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
              <XAxis dataKey="m" tick={ts} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
              <Tooltip content={<CT theme={theme}/>}/>
              <Area type="monotone" dataKey="p" name={String(pL)} fill="url(#gPyM)" stroke="#3b82f6" strokeWidth={1.4} dot={false}/>
              <Area type="monotone" dataKey="c" name={String(cL)} fill="url(#gCyM)" stroke="#10b981" strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme} accent="#10b981" title={`Kuartal ${cL} · ${unitLabel}`} icon={<BarChart3 size={10} color="#10b981"/>} color="#10b981" sub={`${hitQ}/${qd.length} hit target`}>
          <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
            <BarChart data={qDataComputed} margin={{top:2,right:2,left:0,bottom:0}} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
              <XAxis dataKey="n" tick={ts} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={30}/>
              <Tooltip content={<CT theme={theme}/>}/>
              <Bar dataKey="t" name="Target" fill="#3b82f6" opacity={0.32} radius={[2,2,0,0]} maxBarSize={24}/>
              <Bar dataKey="a" name="Actual" radius={[2,2,0,0]} maxBarSize={24}>
                {qDataComputed.map((e:any,i:number)=><Cell key={i} fill={e.pct>=100?'#10b981':e.pct>=80?'#f59e0b':'#ef4444'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card theme={theme} accent="#8b5cf6" title={`Outlet Kontribusi ${cL}`} icon={<Store size={10} color="#8b5cf6"/>} color="#8b5cf6" sub={oTypes.length>0?`${oTypes.length} tipe · ${fmtK(totDoz)} DOZ`:'Belum ada data outlet'}>
          {oTypes.length===0 ? (
            <div style={{color:t.textMuted,fontSize:10,textAlign:'center',padding:'20px 0',fontFamily:'IBM Plex Mono,monospace'}}>Terapkan filter untuk melihat data</div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{position:'relative',flexShrink:0,width:'50%'}}>
                <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
                  <RechartsPieChart>
                    <Pie data={dData} cx="50%" cy="50%" innerRadius="38%" outerRadius="65%" dataKey="v" paddingAngle={2} strokeWidth={0}>
                      {dData.map((_:any,i:number)=><Cell key={i} fill={dData[i].fill}/>)}
                    </Pie>
                    <Tooltip content={({active,payload})=>{
                      if (!active||!payload?.length) return null; const d=payload[0].payload;
                      const p=totDoz>0?((d.v/totDoz)*100).toFixed(1):'0';
                      return <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:7,padding:'5px 9px',fontSize:10,fontFamily:'IBM Plex Mono,monospace'}}><div style={{color:d.fill,fontWeight:700}}>{d.n}</div><div style={{color:t.text}}>{fmtK(d.v)} DOZ</div><div style={{color:t.textMuted}}>{p}%</div></div>;
                    }}/>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                  <div style={{fontSize:11,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{fmtK(totDoz)}</div>
                  <div style={{fontSize:7,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.05em'}}>DOZ</div>
                </div>
              </div>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,minWidth:0}}>
                {dData.map((d:any,i:number)=>{
                  const pct=totDoz>0?(d.v/totDoz)*100:0;
                  return (
                    <div key={i} style={{display:'flex',flexDirection:'column',gap:2}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,minWidth:0}}>
                          <span style={{width:7,height:7,borderRadius:2,background:d.fill,flexShrink:0}}/>
                          <span style={{color:t.textSub,fontSize:9,fontFamily:'IBM Plex Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.n}</span>
                        </div>
                        <span style={{fontWeight:700,color:d.fill,fontSize:9,fontFamily:'IBM Plex Mono,monospace',flexShrink:0}}>{pct.toFixed(1)}%</span>
                      </div>
                      <div style={{height:2,borderRadius:2,background:t.borderCard,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,backgroundColor:d.fill,borderRadius:2}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card theme={theme} accent="#f97316" title="Top Produk" icon={<BarChart3 size={10} color="#f97316"/>} color="#f97316" sub={topP.length>0?String(cL):'Belum ada data produk'}>
          {topP.length>0 ? (
            <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
              <BarChart data={topP} layout="vertical" margin={{top:0,right:6,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={gs} horizontal={false}/>
                <XAxis type="number" tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="n" tick={{...ts,fontSize:8}} axisLine={false} tickLine={false} width={80}/>
                <Tooltip content={<CT theme={theme}/>}/>
                <Bar dataKey="v" name="DOZ" radius={[0,3,3,0]} maxBarSize={16}>
                  {topP.map((_:any,i:number)=><Cell key={i} fill={CC[i%CC.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{color:t.textMuted,fontSize:10,textAlign:'center',padding:'20px 0',fontFamily:'IBM Plex Mono,monospace'}}>Terapkan filter untuk melihat data</div>
          )}
        </Card>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <div style={{height:availH,display:'flex',flexDirection:'column',gap:GAP,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1.8fr',gap:GAP,height:KPI_H,flexShrink:0}}>
        <KpiMini bg={t.card1bg} border={t.card1border} labelColor={t.card1text} accent={t.card1accent} label={`${unitLabel} ${pL}`} value={fmtU(yoy.previousYearTotal)} sub={fmtUF(yoy.previousYearTotal)} theme={theme}/>
        <KpiMini bg={t.card2bg} border={t.card2border} labelColor={t.card2text} accent={t.card2accent} label={`${unitLabel} ${cL}`} value={fmtU(yoy.currentYearTotal)} sub={fmtUF(yoy.currentYearTotal)} theme={theme}/>
        <KpiMini bg={t.card3bg} border={t.card3border} labelColor={t.card3text} accent={t.card3accent} label="Growth YoY" value={`${isPos?'+':''}${gPct.toFixed(1)}%`} sub={`Δ ${fmtUF(yoy.variance)}`} badge={{text:isPos?'↑ Tumbuh':'↓ Turun',positive:isPos}} theme={theme}/>

        {(() => {
          const totalActual = qDataComputed.reduce((s:number,q:any)=>s+q.a,0);
          const totalTarget = qDataComputed.reduce((s:number,q:any)=>s+q.t,0);
          const achGap      = Math.max(0, totalTarget - totalActual);
          const achPct      = totalTarget > 0 ? Math.min(100, Math.round((totalActual / totalTarget) * 100)) : 0;
          const achColor    = achPct >= 100 ? '#10b981' : achPct >= 80 ? '#f59e0b' : '#ef4444';
          const pieAchKpi   = [
            { name:'Actual', value:totalActual, fill:achColor },
            { name:'Gap',    value:achGap,      fill:t.borderCard },
          ];
          return (
            <div style={{
  borderRadius:12, padding:'10px 12px', background:t.cardbg,
  border:`1px solid ${t.borderCard}`, display:'flex', alignItems:'center',
  gap:10, overflow:'hidden', position:'relative',
  minWidth:0, // ← TAMBAH INI
}}>
  <div style={{position:'absolute',top:0,left:12,right:12,height:2,borderRadius:'0 0 2px 2px',background:`linear-gradient(90deg,${achColor}55,${achColor}22)`}}/>

  {/* Pie chart — kurangi dari 88 → 72 */}
  <div style={{position:'relative', flexShrink:0, width:72, height:72}}>
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie data={pieAchKpi} cx="50%" cy="50%" innerRadius="38%" outerRadius="82%"
             dataKey="value" paddingAngle={2} strokeWidth={0} startAngle={90} endAngle={-270}>
          {pieAchKpi.map((entry,i)=><Cell key={i} fill={entry.fill}/>)}
        </Pie>
        <Tooltip content={({active,payload})=>{
          if (!active||!payload?.length) return null;
          const d=payload[0].payload;
          return <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:6,padding:'4px 8px',fontSize:9,fontFamily:'IBM Plex Mono,monospace'}}><div style={{fontWeight:700,color:t.textSub}}>{d.name}</div><div style={{color:t.text}}>{fmtU(d.value)} {unitLabel}</div></div>;
        }}/>
      </RechartsPieChart>
    </ResponsiveContainer>
    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
      <div style={{fontSize:16,fontWeight:800,color:achColor,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{achPct}%</div>
      <div style={{fontSize:7,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.04em',marginTop:2}}>ach.</div>
    </div>
  </div>

  <div style={{width:1,height:60,background:t.border,flexShrink:0}}/>

  {/* Quarterly bars — GANTI width:200 jadi flex:1 minWidth:0 */}
  <div style={{display:'flex',flexDirection:'column',gap:0, flex:1, minWidth:0}}>
    <div style={{fontSize:8,fontWeight:700,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:7}}>
      Achievement {cL}
    </div>
    {qDataComputed.map((q:any,i:number)=>{
      const pct=q.t>0?Math.min(100,Math.round((q.a/q.t)*100)):0;
      const clr=pct>=100?'#10b981':pct>=80?'#f59e0b':'#ef4444';
      return (
        <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:i<qDataComputed.length-1?6:0}}>
          <span style={{width:20,fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:clr,flexShrink:0}}>{q.n}</span>

          {/* GANTI width:100 jadi flex:1 */}
          <div style={{flex:1,height:4,borderRadius:2,background:t.borderCard,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:clr,borderRadius:2,transition:'width 0.5s ease'}}/>
          </div>

          <span style={{width:32,textAlign:'right',fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:clr,flexShrink:0}}>{pct}%</span>
        </div>
      );
    })}
  </div>

  <div style={{width:1,height:60,background:t.border,flexShrink:0}}/>

  {/* Actual/Target — sudah flex:1 tapi kurangi font size */}
  <div style={{display:'flex',flexDirection:'column',gap:8,flex:1,minWidth:0}}>
    <div style={{display:'flex',flexDirection:'column',gap:2}}>
      <span style={{fontSize:8,fontWeight:700,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>Actual</span>
      <span style={{fontSize:16,fontWeight:800,color:achColor,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{fmtU(totalActual)}</span>
    </div>
    <div style={{width:'100%',height:1,background:t.border}}/>
    <div style={{display:'flex',flexDirection:'column',gap:2}}>
      <span style={{fontSize:8,fontWeight:700,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>Target</span>
      <span style={{fontSize:12,fontWeight:700,color:t.textSub,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{fmtU(totalTarget)}</span>
    </div>
  </div>
</div>
          );
        })()}
      </div>

      <div style={{flex:1,minHeight:0,display:'grid',gridTemplateColumns:bodyGrid,gap:GAP}}>

        {/* Kolom kiri — chart mingguan + L4W + tipe produk */}
        <div style={{display:'flex',flexDirection:'column',gap:GAP,minHeight:0,overflow:'hidden'}}>
          <Card theme={theme} accent="#3b82f6" title={`Mingguan — ${pL} vs ${cL}`} icon={<Calendar size={10} color="#3b82f6"/>} color="#3b82f6" sub={`${posW}/${wc.length} minggu positif`} style={{flex:'1 1 0'}}>
            <ResponsiveContainer width="100%" height={cH}>
              <ComposedChart data={weekData} margin={{top:2,right:4,left:0,bottom:0}}>
                {/* <defs><linearGradient id="gCw" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs> */}
                <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
                <XAxis dataKey="w" tick={ts} axisLine={false} tickLine={false} interval={5}/>
                <YAxis yAxisId="l" tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
                <YAxis yAxisId="r" orientation="right" tickFormatter={v=>`${v.toFixed(0)}%`} tick={ts} axisLine={false} tickLine={false} width={26}/>
                <Tooltip content={<CT theme={theme}/>}/>
                <Bar yAxisId="l" dataKey="p" name={String(pL)} fill="#3b82f6" opacity={0.35} radius={[2,2,0,0]} maxBarSize={9}/>
                {/* <Area yAxisId="l" type="monotone" dataKey="c" name={String(cL)} fill="url(#gCw)" stroke="#10b981" strokeWidth={1.8} dot={false}/> */}
                <Bar yAxisId="l" dataKey="c" name={String(cL)} fill="#10b981" opacity={0.7} radius={[2,2,0,0]} maxBarSize={9}/>
                <Line yAxisId="r" type="monotone" dataKey="g" name="Growth %" stroke="#f59e0b" strokeWidth={1.2} dot={false} strokeDasharray="3 2"/>
                <ReferenceLine yAxisId="r" y={0} stroke="rgba(239,68,68,0.3)" strokeWidth={1} strokeDasharray="3 3"/>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <div style={{display:'flex',gap:GAP,flex:'1 1 0',minHeight:0,overflow:'hidden'}}>
            <Card theme={theme} accent="#f59e0b" title="L4W vs C1W" icon={<Activity size={10} color="#f59e0b"/>} color="#f59e0b" sub={`Δ ${lPos?'+':''}${l4w.variancePercentage?.toFixed(1)??'0'}% vs rata-rata`} style={{flex:'1 1 0',minWidth:0,overflow:'hidden'}}>
              <div style={{display:'flex',gap:6,marginBottom:6,flexShrink:0}}>
                {[{l:'L4W',v:fmtU(l4wAvg),c:'#3b82f6'},{l:'C1W',v:fmtU(c1w),c:lc}].map(p=>(
                  <div key={p.l} style={{padding:'4px 8px',borderRadius:7,background:`${p.c}10`,border:`1px solid ${p.c}22`,flex:1}}>
                    <div style={{fontSize:7,color:p.c,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.07em'}}>{p.l}</div>
                    <div style={{fontSize:10,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace',marginTop:1}}>{p.v}</div>
                  </div>
                ))}
              </div>
              <div style={{flex:1,minHeight:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lData} margin={{top:2,right:4,left:0,bottom:0}}>
                    <defs><linearGradient id="gLw" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={lc} stopOpacity={0.25}/><stop offset="95%" stopColor={lc} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
                    <XAxis dataKey="w" tick={ts} axisLine={false} tickLine={false}/>
                    <YAxis tickFormatter={fmtU} tick={ts} axisLine={false} tickLine={false} width={32}/>
                    <Tooltip content={<CT theme={theme}/>}/>
                    <Area type="monotone" dataKey="v" name={`${unitLabel} ${cL}`} fill="url(#gLw)" stroke={lc} strokeWidth={2} dot={{fill:lc,r:2.5,strokeWidth:0}}/>
                    <Line type="monotone" dataKey="avg" name="L4W Avg" stroke="#3b82f6" strokeWidth={1.2} strokeDasharray="4 2" dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card theme={theme} accent="#8b5cf6" title="Tipe Produk" icon={<PieChart size={10} color="#8b5cf6"/>} color="#8b5cf6" sub={`${catData.length} kategori · ${cL}`} style={{flex:'1 1 0',minWidth:0,overflow:'hidden'}}>
              {catData.length===0 ? (
                <div style={{color:t.textMuted,fontSize:10,textAlign:'center',paddingTop:16,fontFamily:'IBM Plex Mono,monospace'}}>Belum ada data</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:0,flex:1,justifyContent:'center'}}>
                  {catData.map((d,i)=>{
                    const pct=catTotal>0?(d.v/catTotal)*100:0;
                    const clr=CC[i%CC.length];
                    return (
                      <div key={d.n} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',borderBottom:i<catData.length-1?`1px solid ${t.border}`:'none'}}>
                        <span style={{width:32,flexShrink:0,fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:clr,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.n}</span>
                        <div style={{flex:1,height:4,borderRadius:2,background:t.borderCard,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:clr,borderRadius:2,transition:'width 0.5s ease'}}/>
                        </div>
                        <span style={{width:36,flexShrink:0,textAlign:'right',fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:t.textSub}}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Kolom tengah — FIX: YoY dulu, baru Kuartal */}
        <div style={{display:'flex',flexDirection:'column',gap:GAP,minHeight:0,overflow:'hidden'}}>

          {/* FIX: YoY naik ke atas */}
          <Card theme={theme} accent={isPos?'#10b981':'#ef4444'} title={`YoY — ${pL} vs ${cL}`} icon={<TrendingUp size={10} color={isPos?'#10b981':'#ef4444'}/>} color={isPos?'#10b981':'#ef4444'} sub={`${isPos?'+':''}${gPct.toFixed(1)}% pertumbuhan tahunan`} style={{flex:'1 1 0'}}>
            <ResponsiveContainer width="100%" height={cH}>
              <ComposedChart data={mData} margin={{top:2,right:4,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gPy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gCy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.22}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
                <XAxis dataKey="m" tick={ts} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
                <Tooltip content={<CT theme={theme}/>}/>
                <Area type="monotone" dataKey="p" name={String(pL)} fill="url(#gPy)" stroke="#3b82f6" strokeWidth={1.4} dot={false}/>
                <Area type="monotone" dataKey="c" name={String(cL)} fill="url(#gCy)" stroke="#10b981" strokeWidth={2} dot={false}/>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* FIX: Kuartal turun ke bawah */}
          
          <Card theme={theme} accent="#8b5cf6" title={`Outlet Kontribusi ${cL}`} icon={<Store size={10} color="#8b5cf6"/>} color="#8b5cf6" sub={`${oTypes.length} tipe · ${fmtK(totDoz)} DOZ`} style={{flex:'1 1 0'}}>
              {oTypes.length===0 ? (
                <div style={{color:t.textMuted,fontSize:10,textAlign:'center',paddingTop:16}}>Tidak ada data</div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minHeight:0}}>
                  <div style={{position:'relative',flexShrink:0,width:'52%'}}>
                    <ResponsiveContainer width="100%" height={Math.floor(bodyH*0.32)}>
                      <RechartsPieChart>
                        <Pie data={dData} cx="50%" cy="50%" innerRadius="38%" outerRadius="65%" dataKey="v" paddingAngle={2} strokeWidth={0}>
                          {dData.map((_:any,i:number)=><Cell key={i} fill={dData[i].fill}/>)}
                        </Pie>
                        <Tooltip content={({active,payload})=>{
                          if (!active||!payload?.length) return null; const d=payload[0].payload;
                          const p=totDoz>0?((d.v/totDoz)*100).toFixed(1):'0';
                          return <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:7,padding:'5px 9px',fontSize:10,fontFamily:'IBM Plex Mono,monospace'}}><div style={{color:d.fill,fontWeight:700}}>{d.n}</div><div style={{color:t.text}}>{fmtK(d.v)} DOZ</div><div style={{color:t.textMuted}}>{p}%</div></div>;
                        }}/>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                      <div style={{fontSize:11,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{fmtK(totDoz)}</div>
                      <div style={{fontSize:7,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.05em'}}>DOZ</div>
                    </div>
                  </div>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:7,minWidth:0}}>
                    {dData.map((d:any,i:number)=>{
                      const pct=totDoz>0?(d.v/totDoz)*100:0;
                      return (
                        <div key={i} style={{display:'flex',flexDirection:'column',gap:2}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:4}}>
                            <div style={{display:'flex',alignItems:'center',gap:5,minWidth:0}}>
                              <span style={{width:7,height:7,borderRadius:2,background:d.fill,flexShrink:0}}/>
                              <span style={{color:t.textSub,fontSize:9,fontFamily:'IBM Plex Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.n}</span>
                            </div>
                            <span style={{fontWeight:700,color:d.fill,fontSize:9,fontFamily:'IBM Plex Mono,monospace',flexShrink:0}}>{pct.toFixed(1)}%</span>
                          </div>
                          <div style={{height:2,borderRadius:2,background:t.borderCard,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${pct}%`,backgroundColor:d.fill,borderRadius:2,transition:'width 0.4s ease'}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

        </div>

        {/* Kolom kanan — Outlet + Top Produk */}
        {!isMobile&&(
          <div style={{display:'flex',flexDirection:'column',gap:GAP,minHeight:0,overflow:'hidden'}}>

            <Card theme={theme} accent="#10b981" title={`Kuartal ${cL} · ${unitLabel}`} icon={<BarChart3 size={10} color="#10b981"/>} color="#10b981" sub={`${hitQ}/${qd.length} hit target`} style={{flex:'1 1 0'}}>
            <ResponsiveContainer width="100%" height={cH}>
              <BarChart data={qDataComputed} margin={{top:2,right:2,left:0,bottom:0}} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
                <XAxis dataKey="n" tick={ts} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmtU} tick={ts} axisLine={false} tickLine={false} width={30}/>
                <Tooltip content={<CT theme={theme}/>}/>
                <Bar dataKey="t" name="Target" fill="#3b82f6" opacity={0.32} radius={[2,2,0,0]} maxBarSize={28}/>
                <Bar dataKey="a" name="Actual" radius={[2,2,0,0]} maxBarSize={28}>
                  {qDataComputed.map((e:any,i:number)=><Cell key={i} fill={e.pct>=100?'#10b981':e.pct>=80?'#f59e0b':'#ef4444'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

            <Card theme={theme} accent="#f97316" title="Top Produk" icon={<BarChart3 size={10} color="#f97316"/>} color="#f97316" sub={String(cL)} style={{flex:'1 1 0'}}>
              {topP.length>0 ? (
                <ResponsiveContainer width="100%" height={cH}>
                  <BarChart data={topP} layout="vertical" margin={{top:0,right:6,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gs} horizontal={false}/>
                    <XAxis type="number" tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="n" tick={{...ts,fontSize:8}} axisLine={false} tickLine={false} width={76}/>
                    <Tooltip content={<CT theme={theme}/>}/>
                    <Bar dataKey="v" name="DOZ" radius={[0,3,3,0]} maxBarSize={14}>
                      {topP.map((_:any,i:number)=><Cell key={i} fill={CC[i%CC.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{color:t.textMuted,fontSize:10,textAlign:'center',paddingTop:16}}>Tidak ada data</div>
              )}
            </Card>

          </div>
        )}
      </div>
    </div>
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
  weeklyData:[],quarterlyData:[],weekComparisons:[],
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
  const {user} = useAuth();

  const [y1, sY1] = useState(2025);
  const [y2, sY2] = useState(2026);
  const [w1, sW1] = useState(0);
  const [w2, sW2] = useState(0);
  const [af, sAf] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('units_dos');
  const [areas,setAreas]=useState<AreaConfig[]>([]);
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

  const doApply = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.append('year1', String(y1));
      p.append('year2', String(y2));
      if (w1 > 0) { p.append('weekStart1', '1'); p.append('weekEnd1', String(w1)); }
      if (w2 > 0) { p.append('weekStart2', '1'); p.append('weekEnd2', String(w2)); }
      if (af.trim()) p.append('area', af.trim());
      p.append('selectedUnit', selectedUnit);
      const r = await fetch(`/api/sales-analysis?${p}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j.success) setData(j.data);
      else console.error('API error:', j.error);
    } catch (e) {
      console.error('doApply failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const doReset = () => {
    sW1(0);
    sW2(0);
    sAf('');
    setSelectedUnit('units_dos');
    setData(EMPTY_DATA);
  };

  const sideW=isMobile?0:(collapsed?52:200);
  const pad=isMobile?10:12;
  const isRO=user?.role==='user';

  const renderContent=()=>{
    switch(tab){
      case 'weekly':    return <WeekComparison data={data.weekComparisons} comparisonYears={data.comparisonYears} comparisonWeeks={data.comparisonWeeks} theme={theme}/>;
      case 'quarterly': return <QuarterlyAnalysis data={data.quarterlyData} theme={theme} selectedUnit={selectedUnit} onUnitChange={setSelectedUnit}/>;
      case 'l4wc4w':   return <L4WC4WAnalysis data={data.l4wc4wData} theme={theme}/>;
      case 'yoy':       return <YearOnYearGrowth data={data.yearOnYearGrowth} comparisonYears={data.comparisonYears} theme={theme}/>;
      case 'outlet':    return <OutletContributionSection data={data} theme={theme}/>;
      case 'analysis':  return <AnalysisSection data={data} theme={theme}/>;
      case 'distribution': return ( <DistributionSection theme={theme} areas={areas} areaFilter={af} weekStart={distWeekStart} weekEnd={distWeekEnd} onWeekStartChange={setDistWeekStart} onWeekEndChange={setDistWeekEnd} cachedData={distData} onDataLoaded={(d) => { setDistData(d); setDistLoaded(true); }} loaded={distLoaded} loading={distLoading} onLoadingChange={setDistLoading}/>);
      default: return <OverviewTab data={data} theme={theme} y1={y1} y2={y2} availH={availH} selectedUnit={selectedUnit}/>;
    }
  };

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{width:'100%',background:t.pagebg,fontFamily:'IBM Plex Sans,sans-serif',height:'100vh',display:'flex',position:'relative',overflow:'hidden'}}>
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
          marginLeft:sideW, display:'flex', flexDirection:'column', height:'100vh', flex:1,
          transition:isMobile?'none':'margin-left 0.2s cubic-bezier(.4,0,.2,1)',
          overflow:'hidden', minWidth:0,
        }}>
          {isMobile&&<MobileHeader theme={theme} setTheme={applyTheme}/>}

          {isRO&&(
            <div style={{padding:'3px 12px',background:t.warnBg,borderBottom:`1px solid ${t.warnBorder}`,display:'flex',alignItems:'center',gap:5,fontSize:10,color:t.warnText,flexShrink:0}}>
              <Shield size={10}/> Login sebagai <strong>User</strong> — hanya bisa melihat.
            </div>
          )}

          {isMobile?(
            <>
              <MobileFilterBar y1={y1} w1={w1} y2={y2} w2={w2} af={af} areas={areas} onOpen={()=>setSheet(true)} loading={loading} theme={theme}/>
              <MobileFilterSheet open={sheetOpen} onClose={()=>setSheet(false)} y1={y1} sY1={sY1} w1={w1} sW1={sW1} y2={y2} sY2={sY2} w2={w2} sW2={sW2} af={af} sAf={sAf} areas={areas} onApply={doApply} onReset={doReset} loading={loading} theme={theme}/>
            </>
          ):(
            <DesktopFilterBar y1={y1} sY1={sY1} w1={w1} sW1={sW1} y2={y2} sY2={sY2} w2={w2} sW2={sW2} af={af} sAf={sAf} areas={areas} onApply={doApply} onReset={doReset} loading={loading} theme={theme}/>
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
            }}
          >
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