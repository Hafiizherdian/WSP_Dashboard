'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, MapPin, CheckCircle2,
  AlertCircle, ChevronDown, ChevronRight, Package, RefreshCw, Search,
} from 'lucide-react';
import { getProductCategory, defaultProductUnitMapping } from '@/lib/productCategories';
import { useAuth } from '@/lib/auth/AuthContext';

type Theme = 'dark' | 'light';

// ─── Window width ─────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const T = {
  dark: {
    page:'#05060d', card:'#0c0d16', cardRaised:'#10111e', modal:'#0e0f1c',
    input:'rgba(255,255,255,0.04)', inputHover:'rgba(255,255,255,0.07)', selectBg:'#0c0d16',
    line:'rgba(255,255,255,0.07)', lineStrong:'rgba(255,255,255,0.12)', lineInput:'rgba(255,255,255,0.11)',
    tx1:'rgba(255,255,255,0.93)', tx2:'rgba(255,255,255,0.60)', tx3:'rgba(255,255,255,0.35)', tx4:'rgba(255,255,255,0.18)',
    thead:'#0a0b14', theadTx:'rgba(255,255,255,0.55)',
    rowAlt:'#0e0f1c', rowHov:'#131527', rowEdit:'#0f172a', rowSub:'#08090f',
    areaHdr:'linear-gradient(90deg,#0f1022 0%,#0c0d16 100%)', areaLine:'rgba(99,102,241,0.25)',
    grandRow:'#090a12', grandTot:'#1a1760',
    btnSave:'#1d6a3e', btnSaveTx:'#6ee7b7', btnSaveBd:'rgba(16,185,129,0.3)',
    btnEdit:'rgba(59,130,246,0.08)', btnEditTx:'#93c5fd', btnEditBd:'rgba(59,130,246,0.22)',
    btnDel:'rgba(239,68,68,0.07)', btnDelTx:'#fca5a5', btnDelBd:'rgba(239,68,68,0.2)',
    btnGhost:'transparent', btnGhostTx:'rgba(255,255,255,0.45)', btnGhostBd:'rgba(255,255,255,0.11)',
    btnGreen:'rgba(16,185,129,0.09)', btnGreenTx:'#34d399', btnGreenBd:'rgba(16,185,129,0.28)',
    toastOk:'#14532d', toastOkBd:'#16a34a', toastErr:'#450a0a', toastErrBd:'#dc2626',
    toastInf:'#1e1b4b', toastInfBd:'#4f46e5',
    drop:'#0e0f1c', dropBd:'rgba(255,255,255,0.1)', dropHov:'rgba(255,255,255,0.04)', dropSel:'rgba(99,102,241,0.12)',
    balBg:'rgba(16,185,129,0.05)', balTx:'#34d399', balBd:'rgba(16,185,129,0.18)', balHd:'rgba(16,185,129,0.14)',
    slopBg:'rgba(234,179,8,0.05)', slopTx:'#fbbf24', slopBd:'rgba(234,179,8,0.18)', slopHd:'rgba(234,179,8,0.14)',
    bksBg:'rgba(249,115,22,0.05)', bksTx:'#fb923c', bksBd:'rgba(249,115,22,0.18)', bksHd:'rgba(249,115,22,0.14)',
    stickBg:'rgba(168,85,247,0.05)', stickTx:'#c084fc', stickBd:'rgba(168,85,247,0.18)', stickHd:'rgba(168,85,247,0.14)',
    addBg:'rgba(16,185,129,0.04)', addBd:'rgba(16,185,129,0.2)',
    shadow:'0 0 0 1px rgba(0,0,0,0.5)',
  },
  light: {
    page:'#eef0f6', card:'#ffffff', cardRaised:'#f5f6fa', modal:'#ffffff',
    input:'rgba(0,0,0,0.04)', inputHover:'rgba(0,0,0,0.07)', selectBg:'#ffffff',
    line:'rgba(0,0,0,0.09)', lineStrong:'rgba(0,0,0,0.15)', lineInput:'rgba(0,0,0,0.14)',
    tx1:'#0f172a', tx2:'#1e293b', tx3:'#475569', tx4:'#94a3b8',
    thead:'#1e2035', theadTx:'rgba(255,255,255,0.82)',
    rowAlt:'#f8f9fc', rowHov:'#f0f1f8', rowEdit:'#eff6ff', rowSub:'#1e2035',
    areaHdr:'linear-gradient(90deg,#1e2035 0%,#2d3055 100%)', areaLine:'rgba(99,102,241,0.4)',
    grandRow:'#1e2035', grandTot:'#1e3a8a',
    btnSave:'#f0fdf4', btnSaveTx:'#15803d', btnSaveBd:'#86efac',
    btnEdit:'#eff6ff', btnEditTx:'#1d4ed8', btnEditBd:'#bfdbfe',
    btnDel:'#fef2f2', btnDelTx:'#b91c1c', btnDelBd:'#fecaca',
    btnGhost:'transparent', btnGhostTx:'#4b5563', btnGhostBd:'rgba(0,0,0,0.15)',
    btnGreen:'#f0fdf4', btnGreenTx:'#15803d', btnGreenBd:'#86efac',
    toastOk:'#f0fdf4', toastOkBd:'#16a34a', toastErr:'#fef2f2', toastErrBd:'#dc2626',
    toastInf:'#eef2ff', toastInfBd:'#4f46e5',
    drop:'#ffffff', dropBd:'rgba(0,0,0,0.12)', dropHov:'rgba(0,0,0,0.04)', dropSel:'#eef2ff',
    balBg:'#f0fdf4', balTx:'#15803d', balBd:'#86efac', balHd:'#bbf7d0',
    slopBg:'#fefce8', slopTx:'#92400e', slopBd:'#fcd34d', slopHd:'#fef08a',
    bksBg:'#fff7ed', bksTx:'#c2410c', bksBd:'#fdba74', bksHd:'#fed7aa',
    stickBg:'#faf5ff', stickTx:'#7e22ce', stickBd:'#d8b4fe', stickHd:'#e9d5ff',
    addBg:'#f0fdf4', addBd:'#86efac',
    shadow:'0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.06)',
  },
} as const;

interface Tok {
  page:string; card:string; cardRaised:string; modal:string;
  input:string; inputHover:string; selectBg:string;
  line:string; lineStrong:string; lineInput:string;
  tx1:string; tx2:string; tx3:string; tx4:string;
  thead:string; theadTx:string;
  rowAlt:string; rowHov:string; rowEdit:string; rowSub:string;
  areaHdr:string; areaLine:string;
  grandRow:string; grandTot:string;
  btnSave:string; btnSaveTx:string; btnSaveBd:string;
  btnEdit:string; btnEditTx:string; btnEditBd:string;
  btnDel:string; btnDelTx:string; btnDelBd:string;
  btnGhost:string; btnGhostTx:string; btnGhostBd:string;
  btnGreen:string; btnGreenTx:string; btnGreenBd:string;
  toastOk:string; toastOkBd:string; toastErr:string; toastErrBd:string; toastInf:string; toastInfBd:string;
  drop:string; dropBd:string; dropHov:string; dropSel:string;
  balBg:string; balTx:string; balBd:string; balHd:string;
  slopBg:string; slopTx:string; slopBd:string; slopHd:string;
  bksBg:string; bksTx:string; bksBd:string; bksHd:string;
  stickBg:string; stickTx:string; stickBd:string; stickHd:string;
  addBg:string; addBd:string; shadow:string;
}

// ─── Quarter color coding ─────────────────────────────────────────
const QC_DARK = {
  Q1:{dot:'#818cf8',band:'rgba(99,102,241,0.12)',bandHd:'rgba(99,102,241,0.22)',line:'rgba(99,102,241,0.28)',tx:'#a5b4fc',txHd:'#c7d2fe',muted:'rgba(99,102,241,0.06)'},
  Q2:{dot:'#34d399',band:'rgba(16,185,129,0.09)',bandHd:'rgba(16,185,129,0.18)',line:'rgba(16,185,129,0.26)',tx:'#6ee7b7',txHd:'#a7f3d0',muted:'rgba(16,185,129,0.05)'},
  Q3:{dot:'#fb923c',band:'rgba(249,115,22,0.09)',bandHd:'rgba(249,115,22,0.18)',line:'rgba(249,115,22,0.26)',tx:'#fdba74',txHd:'#fcd9a8',muted:'rgba(249,115,22,0.05)'},
  Q4:{dot:'#f472b6',band:'rgba(236,72,153,0.09)',bandHd:'rgba(236,72,153,0.18)',line:'rgba(236,72,153,0.26)',tx:'#f9a8d4',txHd:'#fbcfe8',muted:'rgba(236,72,153,0.05)'},
} as const;
const QC_LIGHT = {
  Q1:{dot:'#4f46e5',band:'rgba(99,102,241,0.08)',bandHd:'rgba(99,102,241,0.16)',line:'rgba(99,102,241,0.25)',tx:'#3730a3',txHd:'#312e81',muted:'rgba(99,102,241,0.05)'},
  Q2:{dot:'#059669',band:'rgba(16,185,129,0.07)',bandHd:'rgba(16,185,129,0.15)',line:'rgba(16,185,129,0.25)',tx:'#065f46',txHd:'#064e3b',muted:'rgba(16,185,129,0.04)'},
  Q3:{dot:'#d97706',band:'rgba(249,115,22,0.07)',bandHd:'rgba(249,115,22,0.15)',line:'rgba(249,115,22,0.25)',tx:'#92400e',txHd:'#78350f',muted:'rgba(249,115,22,0.04)'},
  Q4:{dot:'#be185d',band:'rgba(236,72,153,0.07)',bandHd:'rgba(236,72,153,0.15)',line:'rgba(236,72,153,0.25)',tx:'#831843',txHd:'#500724',muted:'rgba(236,72,153,0.04)'},
} as const;

type QKey = 'Q1'|'Q2'|'Q3'|'Q4';
function getQC(theme:'dark'|'light') { return theme==='dark' ? QC_DARK : QC_LIGHT; }

// ─── Constants ────────────────────────────────────────────────────
const QUARTERS = ['Q1','Q2','Q3','Q4'] as const;
type Quarter   = typeof QUARTERS[number];
const QUARTER_INDEX: Record<Quarter,number> = { Q1:1, Q2:2, Q3:3, Q4:4 };

type DerivedKey = 'bal'|'slop'|'bks'|'stick';
const DERIVED: { key:DerivedKey; label:string }[] = [
  { key:'bal',   label:'Bal'   },
  { key:'slop',  label:'Slop'  },
  { key:'bks',   label:'Bks'   },
  { key:'stick', label:'Stick' },
];

interface MonthWeekGroup { monthShort:string; weekOffsets:number[]; }
const MWG: Record<Quarter, MonthWeekGroup[]> = {
  Q1:[{monthShort:'Jan',weekOffsets:[0,1,2,3]},{monthShort:'Feb',weekOffsets:[4,5,6,7]},{monthShort:'Mar',weekOffsets:[8,9,10,11,12]}],
  Q2:[{monthShort:'Apr',weekOffsets:[0,1,2,3]},{monthShort:'Mei',weekOffsets:[4,5,6,7]},{monthShort:'Jun',weekOffsets:[8,9,10,11,12]}],
  Q3:[{monthShort:'Jul',weekOffsets:[0,1,2,3]},{monthShort:'Agu',weekOffsets:[4,5,6,7]},{monthShort:'Sep',weekOffsets:[8,9,10,11,12]}],
  Q4:[{monthShort:'Okt',weekOffsets:[0,1,2,3]},{monthShort:'Nov',weekOffsets:[4,5,6,7]},{monthShort:'Des',weekOffsets:[8,9,10,11,12]}],
};
const getMWG = (q:Quarter) => MWG[q];

const globalWeek = (qNum:number, wo:number): number => (qNum - 1) * 13 + wo + 1;

// ─── API types ─────────────────────────────────────────────────────
interface AreaTargetProduct {
  product: string;
  weeks: Record<number, number>;
}
interface AreaTargetResponse {
  success: boolean;
  data: {
    products: AreaTargetProduct[];
    quarterlyTargets: Record<string,number>;
    areaTotals: Record<string,number>;
  };
  error?: string;
}
type WeekValues  = Record<string,number>;
type ProdWeekMap = Record<string,WeekValues>;
interface AreaConfig { id:string; name?:string; description?:string; }

// ─── Helpers ──────────────────────────────────────────────────────
const r2   = (n:number) => Math.round((n+Number.EPSILON)*100)/100;
const fmtN = (n:number) => (n||0).toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:2});

function calcDerived(product:string, dos:number): Record<DerivedKey,number> {
  const conv = defaultProductUnitMapping?.[product] ?? null;
  if (!conv) return { bal:0, slop:0, bks:0, stick:0 };
  const bal   = r2(dos * conv.balPerDos);
  const slop  = r2(bal * conv.slopPerBal);
  const bks   = r2(slop * conv.packPerSlop);
  const stick = Math.round(bks * conv.stickPerPack);
  return { bal, slop, bks, stick };
}

function dkStyle(dk:DerivedKey, t:Tok, hd=false): React.CSSProperties {
  const m: Record<DerivedKey,{bg:string;tx:string;bd:string}> = {
    bal:  {bg:hd?t.balHd  :t.balBg,  tx:t.balTx,  bd:t.balBd  },
    slop: {bg:hd?t.slopHd :t.slopBg, tx:t.slopTx, bd:t.slopBd },
    bks:  {bg:hd?t.bksHd  :t.bksBg,  tx:t.bksTx,  bd:t.bksBd  },
    stick:{bg:hd?t.stickHd:t.stickBg,tx:t.stickTx,bd:t.stickBd},
  };
  return { background:m[dk].bg, color:m[dk].tx, borderLeft:`1px solid ${m[dk].bd}` };
}
function dkBd(dk:DerivedKey, t:Tok) {
  return dk==='bal'?t.balBd:dk==='slop'?t.slopBd:dk==='bks'?t.bksBd:t.stickBd;
}

function apiToWeekMap(products: AreaTargetProduct[]): ProdWeekMap {
  const res: ProdWeekMap = {};
  for (const p of products) {
    res[p.product] = {};
    QUARTERS.forEach((q, qi) => {
      getMWG(q).flatMap(g => g.weekOffsets).forEach(wo => {
        const gw = globalWeek(qi + 1, wo);
        res[p.product][`${q}_W${wo}`] = p.weeks[gw] ?? 0;
      });
    });
  }
  return res;
}

// ─────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────

function Spinner({ sz=12, color='#6366f1' }: { sz?:number; color?:string }) {
  return (
    <svg style={{animation:'spin .65s linear infinite',width:sz,height:sz,flexShrink:0}} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" opacity=".18"/>
      <path d="M4 12a8 8 0 018-8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function CatBadge({ cat }: { cat:string }) {
  const cfg: Record<string,[string,string]> = {
    SKMR:['rgba(99,102,241,0.14)','#a5b4fc'],
    SKMM:['rgba(16,185,129,0.12)','#34d399'],
    SKT: ['rgba(234,179,8,0.12)', '#fbbf24'],
    SPM: ['rgba(168,85,247,0.12)','#c084fc'],
  };
  const [bg,tx] = cfg[cat] ?? ['rgba(100,116,139,0.1)','#9ca3af'];
  return (
    <span style={{display:'inline-flex',alignItems:'center',padding:'1px 4px',borderRadius:2,fontSize:7.5,fontWeight:700,fontFamily:'"IBM Plex Mono",monospace',letterSpacing:'0.06em',textTransform:'uppercase',background:bg,color:tx,flexShrink:0,whiteSpace:'nowrap'}}>
      {cat}
    </span>
  );
}

type BV = 'save'|'cancel'|'edit'|'delete'|'ghost'|'green';
function Btn({ v, onClick, disabled, children, sz='sm', full, t }: {
  v:BV; onClick?:()=>void; disabled?:boolean;
  children:React.ReactNode; sz?:'xs'|'sm'|'md'; full?:boolean; t:Tok;
}) {
  const pad  = sz==='xs'?'3px 8px':sz==='sm'?'5px 11px':'7px 14px';
  const fs   = sz==='xs'?10:sz==='sm'?11:12;
  const cfg: Record<BV,React.CSSProperties> = {
    save:  {background:t.btnSave,  color:t.btnSaveTx,  border:`1px solid ${t.btnSaveBd}`},
    cancel:{background:t.btnGhost, color:t.btnGhostTx, border:`1px solid ${t.btnGhostBd}`},
    edit:  {background:t.btnEdit,  color:t.btnEditTx,  border:`1px solid ${t.btnEditBd}`},
    delete:{background:t.btnDel,   color:t.btnDelTx,   border:`1px solid ${t.btnDelBd}`},
    ghost: {background:t.btnGhost, color:t.btnGhostTx, border:`1px solid ${t.btnGhostBd}`},
    green: {background:t.btnGreen, color:t.btnGreenTx, border:`1px solid ${t.btnGreenBd}`},
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:4,
      padding:pad,borderRadius:5,fontSize:fs,fontWeight:600,
      fontFamily:'"IBM Plex Sans",sans-serif',
      cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,
      width:full?'100%':undefined,
      transition:'filter 0.1s, opacity 0.1s',
      ...cfg[v],
    }}
    onMouseEnter={e=>{if(!disabled)(e.currentTarget as HTMLElement).style.filter='brightness(1.12)';}}
    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.filter='brightness(1)';}}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// AREA FILTER DROPDOWN
// ─────────────────────────────────────────────────────────────────
function AreaDropdown({ areas, sel, onToggle, onAll, onClear, t, theme }: {
  areas:AreaConfig[]; sel:Set<string>;
  onToggle:(id:string)=>void; onAll:()=>void; onClear:()=>void; t:Tok; theme:'dark'|'light';
}) {
  const [open,setOpen] = useState(false);
  const [q,setQ]       = useState('');
  const ref            = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};
    document.addEventListener('click',h,true);
    return ()=>document.removeEventListener('click',h,true);
  },[]);

  const filtered = useMemo(()=>{
    const s=q.trim().toLowerCase();
    return s ? areas.filter(a=>a.id.toLowerCase().includes(s)||(a.name??'').toLowerCase().includes(s)) : areas;
  },[areas,q]);

  const n = sel.size;
  const label = n===0 ? 'Pilih Area' : n===1 ? (()=>{
    const a=areas.find(x=>x.id===[...sel][0]);
    const nm=a?.name||[...sel][0].replace('area_','').replace(/_/g,' ');
    return nm.length>18?nm.slice(0,17)+'…':nm;
  })() : `${n} area`;

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={()=>setOpen(p=>!p)} style={{
        display:'flex',alignItems:'center',gap:6,height:30,padding:'0 10px',
        borderRadius:5,cursor:'pointer',
        fontFamily:'"IBM Plex Mono",monospace',fontWeight:600,fontSize:11,
        whiteSpace:'nowrap',
        background:n>0?'rgba(99,102,241,0.1)':t.input,
        border:`1px solid ${n>0?'rgba(99,102,241,0.35)':t.lineInput}`,
        color:n>0?(theme==='dark'?'#a5b4fc':'#3730a3'):t.tx2,
      }}>
        <MapPin size={10} style={{flexShrink:0}}/>
        {label}
        {n>0&&<span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minWidth:16,height:14,borderRadius:3,background:'rgba(99,102,241,0.22)',color:(theme==='dark'?'#c7d2fe':'#312e81'),fontSize:9,fontWeight:800,padding:'0 3px'}}>{n}</span>}
        <ChevronDown size={9} style={{opacity:.45,transform:open?'rotate(180deg)':'rotate(0)',transition:'transform 0.15s',flexShrink:0}}/>
      </button>

      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,zIndex:200,width:256,background:t.drop,border:`1px solid ${t.dropBd}`,borderRadius:7,boxShadow:'0 8px 32px rgba(0,0,0,0.28)',overflow:'hidden',animation:'fadeUp 0.12s ease'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderBottom:`1px solid ${t.line}`}}>
            <span style={{fontSize:10,fontWeight:700,color:t.tx1,fontFamily:'"IBM Plex Mono",monospace',letterSpacing:'0.04em',textTransform:'uppercase'}}>Area</span>
            <div style={{display:'flex',gap:4,alignItems:'center'}}>
              <span style={{fontSize:9,color:t.tx3,fontFamily:'"IBM Plex Mono",monospace'}}>{n}/{areas.length}</span>
              <button onClick={onAll}   style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:'rgba(99,102,241,0.1)',color:(theme==='dark'?'#a5b4fc':'#3730a3'),border:'1px solid rgba(99,102,241,0.22)',cursor:'pointer',fontWeight:700}}>Semua</button>
              <button onClick={onClear} style={{fontSize:9,padding:'2px 6px',borderRadius:3,background:t.input,color:t.tx3,border:`1px solid ${t.lineInput}`,cursor:'pointer',fontWeight:600}}>Reset</button>
            </div>
          </div>
          <div style={{padding:'6px 8px',borderBottom:`1px solid ${t.line}`}}>
            <div style={{position:'relative'}}>
              <Search size={10} style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',color:t.tx3,pointerEvents:'none'}}/>
              <input autoFocus type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari…"
                style={{width:'100%',paddingLeft:22,paddingRight:q?20:8,paddingTop:4,paddingBottom:4,borderRadius:4,fontSize:11,background:t.input,border:`1px solid ${t.lineInput}`,color:t.tx1,outline:'none',fontFamily:'"IBM Plex Mono",monospace'}}/>
              {q&&<button onClick={()=>setQ('')} style={{position:'absolute',right:5,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:t.tx3,padding:0,display:'flex'}}><X size={9}/></button>}
            </div>
          </div>
          <div style={{overflowY:'auto',maxHeight:220}}>
            {filtered.length===0&&<div style={{padding:'14px',textAlign:'center',color:t.tx3,fontSize:11}}>Tidak ada</div>}
            {filtered.map(area=>{
              const isSel=sel.has(area.id);
              const nm=area.name||area.id.replace('area_','').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
              return (
                <button key={area.id} onClick={()=>onToggle(area.id)} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 10px',border:'none',cursor:'pointer',textAlign:'left',borderBottom:`1px solid ${t.line}`,background:isSel?t.dropSel:'transparent'}}
                  onMouseEnter={e=>{if(!isSel)(e.currentTarget as HTMLElement).style.background=t.dropHov;}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=isSel?t.dropSel:'transparent';}}>
                  <div style={{width:13,height:13,borderRadius:3,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:isSel?'#6366f1':'transparent',border:`1.5px solid ${isSel?'#6366f1':t.lineInput}`}}>
                    {isSel&&<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{flex:1,overflow:'hidden'}}>
                    <div style={{fontSize:11,fontWeight:isSel?600:400,color:isSel?t.tx1:t.tx2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nm}</div>
                    <div style={{fontSize:8,color:t.tx4,fontFamily:'"IBM Plex Mono",monospace'}}>{area.id}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {n>0&&(
            <div style={{padding:'5px 10px',borderTop:`1px solid ${t.line}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:9,color:t.tx3,fontFamily:'"IBM Plex Mono",monospace'}}>{n} dipilih</span>
              <button onClick={()=>{onClear();setOpen(false);}} style={{fontSize:9,color:t.tx3,background:'none',border:'none',cursor:'pointer',padding:'2px 5px',borderRadius:3}}>Hapus semua</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// EDITABLE CELL
// ─────────────────────────────────────────────────────────────────
const EditableCell = React.memo(function EC({ id, initialValue, onChange, t }: {
  id:string; initialValue:number; onChange:(id:string,v:number)=>void; t:Tok;
}) {
  const [val,setVal] = useState(initialValue);
  const ref          = useRef<HTMLInputElement>(null);
  const prev         = useRef(initialValue);

  useEffect(()=>{
    if(prev.current!==initialValue && document.activeElement!==ref.current){
      setVal(initialValue); prev.current=initialValue;
    }
  },[initialValue]);

  const nav = useCallback((dir:'up'|'down'|'left'|'right',cur:HTMLInputElement)=>{
    const all=Array.from(document.querySelectorAll('input[data-ac]')) as HTMLInputElement[];
    const idx=all.indexOf(cur);
    let nxt:HTMLInputElement|null=null;
    if(dir==='up'||dir==='down'){
      const row=cur.closest('tr');
      const sib=dir==='down'?row?.nextElementSibling:row?.previousElementSibling;
      if(sib){const cols=all.filter(x=>row?.contains(x));const col=cols.indexOf(cur);nxt=(sib.querySelectorAll('input[data-ac]') as NodeListOf<HTMLInputElement>)[col]??null;}
    } else if(dir==='left'&&idx>0) nxt=all[idx-1];
    else if(dir==='right'&&idx<all.length-1) nxt=all[idx+1];
    if(nxt){nxt.focus();nxt.select();}
  },[]);

  const on = val>0;
  return (
    <input ref={ref} data-ac type="number" min={0} value={val}
      onChange={e=>{const v=Number(e.target.value);setVal(v);onChange(id,v);}}
      onFocus={e=>e.target.select()}
      onKeyDown={e=>{
        const c=e.currentTarget;
        if(e.key==='Enter'||e.key==='ArrowDown'){e.preventDefault();nav('down',c);}
        else if(e.key==='ArrowUp'){e.preventDefault();nav('up',c);}
        else if(e.key==='ArrowLeft'&&c.selectionStart===0){e.preventDefault();nav('left',c);}
        else if(e.key==='ArrowRight'&&c.selectionStart===c.value.length){e.preventDefault();nav('right',c);}
      }}
      style={{
        width:'100%',minWidth:46,padding:'2px 4px',borderRadius:3,textAlign:'right',
        fontSize:10,fontFamily:'"IBM Plex Mono",monospace',fontWeight:600,
        background:on?'rgba(99,102,241,0.08)':t.input,
        border:`1px solid ${on?'rgba(99,102,241,0.45)':t.lineInput}`,
        color:on?'#6366f1':t.tx3,
        outline:'none',
        boxShadow:on?'0 0 0 2px rgba(99,102,241,0.08)':'none',
      }}
    />
  );
},(p,n)=>p.initialValue===n.initialValue&&p.id===n.id);

// ─────────────────────────────────────────────────────────────────
// EXPANDED PRODUCT ROWS
// ─────────────────────────────────────────────────────────────────
function ExpandedProductRows({ areaId, year, t, theme }: {
  areaId:string; year:string; t:Tok; theme:'dark'|'light';
}) {
  const QC = getQC(theme);
  const [products, setProducts] = useState<string[]>([]);
  const [weekMap,  setWeekMap]  = useState<ProdWeekMap>({});
  const [avail,    setAvail]    = useState<string[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState<string|null>(null);
  const [saving,   setSaving]   = useState<string|null>(null);
  const [editing,  setEditing]  = useState<Set<string>>(new Set());
  const [addOpen,  setAddOpen]  = useState(false);
  const [newProd,  setNewProd]  = useState('');
  const [newVals,  setNewVals]  = useState<Record<string,number>>({});
  const [toast,    setToast]    = useState<{msg:string;ok:boolean}|null>(null);
  const [delConf,  setDelConf]  = useState<string|null>(null);
  const [collapsed,setCollapsed]= useState(false);

  const overrides = useRef<Record<string,number>>({});
  const [, setCv] = useState(0);

  const showToast = (msg:string,ok:boolean)=>{setToast({msg,ok});setTimeout(()=>setToast(null),2600);};

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [pr, tr] = await Promise.all([
        fetch(`/api/products?year=${year}`),
        fetch(`/api/area-targets?area=${areaId}&year=${year}`),
      ]);

      if (!tr.ok) throw new Error(`HTTP ${tr.status}`);
      const tj: AreaTargetResponse = await tr.json();
      if (!tj.success) throw new Error(tj.error || 'Gagal memuat');

      const wm = apiToWeekMap(tj.data.products);
      const existing = tj.data.products.map(p => p.product).sort((a,b) => a.localeCompare(b));

      let prodNames: string[] = [];
      if (pr.ok) {
        const j = await pr.json();
        if (j.success && Array.isArray(j.data?.products) && j.data.products.length > 0) {
          prodNames = (j.data.products as string[]).sort((a,b) => a.localeCompare(b));
        }
      }
      if (prodNames.length === 0) prodNames = existing;

      const all = Array.from(new Set([...existing, ...prodNames])).sort((a,b) => a.localeCompare(b));
      const merged: ProdWeekMap = {};
      all.forEach(nm => { merged[nm] = wm[nm] ?? {}; });

      setAvail(prodNames);
      setProducts(existing);
      setWeekMap(merged);
      overrides.current = {};
      setCv(0);
    } catch (e: any) {
      setErr(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [areaId, year]);

  useEffect(() => { load(); }, [load]);

  const getV = useCallback((p:string, q:Quarter, wo:number): number => {
    const ov = overrides.current[`${p}||${q}_W${wo}`];
    return ov !== undefined ? ov : (weekMap[p]?.[`${q}_W${wo}`] ?? 0);
  }, [weekMap]);

  const onCellChange = useCallback((key:string, val:number) => {
    overrides.current[key] = val;
    setCv(v => v + 1);
  }, []);

  const qDos = useCallback((p:string, q:Quarter): number =>
    r2(getMWG(q).flatMap(g => g.weekOffsets).reduce((s,wo) => s + getV(p,q,wo), 0)),
  [getV]);

  const startEdit  = (p:string) => setEditing(prev => new Set([...prev, p]));
  const cancelEdit = (p:string) => {
    setEditing(prev => { const n=new Set(prev); n.delete(p); return n; });
    Object.keys(overrides.current).forEach(k => { if(k.startsWith(`${p}||`)) delete overrides.current[k]; });
    setCv(v => v + 1);
  };

  const saveProduct = async (p:string) => {
    setSaving(p);
    try {
      const week_values: Record<number,number> = {};
      QUARTERS.forEach((q, qi) => {
        getMWG(q).flatMap(g => g.weekOffsets).forEach(wo => {
          const gw = globalWeek(qi + 1, wo);
          week_values[gw] = getV(p, q, wo);
        });
      });

      const res = await fetch('/api/area-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: areaId, product: p, year: Number(year), week_values }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || 'Gagal');

      showToast(`${p} — disimpan`, true);
      cancelEdit(p);
      await load();
    } catch (e: any) {
      showToast(`Gagal: ${e.message}`, false);
    } finally {
      setSaving(null);
    }
  };

  const deleteProduct = async (p:string) => {
    setSaving(p); setDelConf(null);
    try {
      const res = await fetch(
        `/api/area-targets?area=${areaId}&product=${encodeURIComponent(p)}&year=${year}`,
        { method: 'DELETE' },
      );
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || 'Gagal');
      showToast(`${p} — dihapus`, true);
      await load();
    } catch (e: any) {
      showToast(`Gagal: ${e.message}`, false);
    } finally {
      setSaving(null);
    }
  };

  const addProduct = async () => {
    if (!newProd) { showToast('Pilih produk', false); return; }
    setSaving('__new__');
    try {
      const week_values: Record<number,number> = {};
      QUARTERS.forEach((q, qi) => {
        getMWG(q).flatMap(g => g.weekOffsets).forEach(wo => {
          const gw = globalWeek(qi + 1, wo);
          week_values[gw] = newVals[`${q}_W${wo}`] ?? 0;
        });
      });

      const res = await fetch('/api/area-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: areaId, product: newProd, year: Number(year), week_values }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || 'Gagal');

      showToast(`${newProd} — ditambahkan`, true);
      setAddOpen(false); setNewProd(''); setNewVals({});
      await load();
    } catch (e: any) {
      showToast(`Gagal: ${e.message}`, false);
    } finally {
      setSaving(null);
    }
  };

  const subDos = useMemo(() => QUARTERS.reduce((acc,q) => {
    acc[q] = r2(products.reduce((s,p) =>
      s + getMWG(q).flatMap(g => g.weekOffsets).reduce((ss,wo) => ss + (weekMap[p]?.[`${q}_W${wo}`] ?? 0), 0), 0));
    return acc;
  }, {} as Record<Quarter,number>), [products, weekMap]);
  const subTotal = useMemo(() => r2(Object.values(subDos).reduce((s,v) => s+v, 0)), [subDos]);

  const totalCols = 1 + 52 + 4 + 1 + DERIVED.length * 5 + 1;
  const areaLabel = areaId.replace('area_','').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());

  const TH: React.CSSProperties = {
    padding:'3px 4px',fontSize:8,fontWeight:600,
    color:t.theadTx,background:t.thead,
    borderBottom:`1px solid rgba(255,255,255,0.06)`,
    fontFamily:'"IBM Plex Mono",monospace',textAlign:'center',
    whiteSpace:'nowrap',letterSpacing:'0.03em',
  };
  const TD: React.CSSProperties = {
    padding:'4px 5px',fontSize:10,
    borderBottom:`1px solid ${t.line}`,whiteSpace:'nowrap',
  };

  return (
    <>
      {/* ══ AREA HEADER ══ */}
      <tr>
        <td colSpan={totalCols} style={{padding:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:t.areaHdr,borderTop:`2px solid ${t.areaLine}`,borderBottom:`1px solid ${t.areaLine}`}}>
            <div style={{width:3,alignSelf:'stretch',flexShrink:0,background:'linear-gradient(180deg,#818cf8 0%,#6366f1 100%)'}}/>
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px 8px 10px',gap:8}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={()=>setCollapsed(p=>!p)} style={{width:20,height:20,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'1px solid rgba(255,255,255,0.14)',background:collapsed?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.75)',flexShrink:0}}>
                  {collapsed?<ChevronRight size={10}/>:<ChevronDown size={10}/>}
                </button>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:26,height:26,borderRadius:5,background:'rgba(99,102,241,0.2)',border:'1px solid rgba(99,102,241,0.35)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <MapPin size={11} color="#a5b4fc"/>
                  </div>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'#fff',fontFamily:'"IBM Plex Mono",monospace',letterSpacing:'0.05em',lineHeight:1}}>{areaLabel}</div>
                    {!loading&&!err&&(
                      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                        <span style={{fontSize:8,color:'rgba(255,255,255,0.38)',fontFamily:'"IBM Plex Mono",monospace'}}>{products.length} produk</span>
                        {subTotal>0&&<><span style={{width:2,height:2,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'inline-block'}}/><span style={{fontSize:8,fontWeight:700,color:'rgba(165,180,252,0.7)',fontFamily:'"IBM Plex Mono",monospace'}}>{fmtN(subTotal)} dos</span></>}
                      </div>
                    )}
                    {loading&&<div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><Spinner sz={8} color="rgba(165,180,252,0.5)"/><span style={{fontSize:8,color:'rgba(255,255,255,0.3)',fontFamily:'"IBM Plex Mono",monospace'}}>Memuat…</span></div>}
                  </div>
                </div>
                {!loading&&!err&&!collapsed&&subTotal>0&&(
                  <div style={{display:'flex',gap:3}}>
                    {QUARTERS.map(q=>{
                      const v=subDos[q]; if(!v) return null;
                      const qc=QC[q as QKey];
                      return (
                        <span key={q} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 6px',borderRadius:3,background:qc.band,border:`1px solid ${qc.line}`,fontSize:8,fontWeight:700,fontFamily:'"IBM Plex Mono",monospace',color:qc.tx,whiteSpace:'nowrap'}}>
                          <span style={{width:4,height:4,borderRadius:'50%',background:qc.dot,display:'inline-block',flexShrink:0}}/>{q} {fmtN(v)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                {err&&<Btn v="delete" sz="xs" onClick={load} t={t}><RefreshCw size={9}/> Reload</Btn>}
                {!loading&&!err&&!collapsed&&(
                  <Btn v={addOpen?'ghost':'green'} sz="xs" onClick={()=>{setAddOpen(p=>!p);setNewProd('');setNewVals({});}} t={t}>
                    {addOpen?<><X size={9}/> Batal</>:<><Plus size={9}/> Tambah</>}
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>

      {!collapsed&&loading&&(
        <tr><td colSpan={totalCols} style={{padding:'14px 16px',background:t.thead,borderBottom:`1px solid ${t.line}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,color:t.tx3,fontSize:11}}><Spinner sz={13}/><span>Memuat {areaLabel}…</span></div>
        </td></tr>
      )}

      {!collapsed&&err&&(
        <tr><td colSpan={totalCols} style={{padding:0,borderBottom:`1px solid rgba(239,68,68,0.2)`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(239,68,68,0.05)'}}>
            <AlertCircle size={13} color="#fca5a5" style={{flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:'#fca5a5'}}>Gagal memuat</div>
              <div style={{fontSize:10,color:'rgba(252,165,165,0.55)',marginTop:1}}>{err}</div>
            </div>
            <Btn v="delete" sz="xs" onClick={load} t={t}><RefreshCw size={9}/> Coba lagi</Btn>
          </div>
        </td></tr>
      )}

      {!collapsed&&!loading&&!err&&(
        <>
          {toast&&(
            <tr><td colSpan={totalCols} style={{padding:0}}>
              <div style={{display:'flex',alignItems:'center',gap:7,padding:'6px 14px',background:toast.ok?'rgba(16,185,129,0.07)':'rgba(239,68,68,0.07)',borderBottom:`1px solid ${toast.ok?'rgba(16,185,129,0.18)':'rgba(239,68,68,0.18)'}`}}>
                {toast.ok?<CheckCircle2 size={11} color="#34d399"/>:<AlertCircle size={11} color="#fca5a5"/>}
                <span style={{fontSize:11,fontWeight:600,color:toast.ok?'#34d399':'#fca5a5'}}>{toast.msg}</span>
              </div>
            </td></tr>
          )}

          {delConf&&(
            <tr><td colSpan={totalCols} style={{padding:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',flexWrap:'wrap',background:'rgba(239,68,68,0.06)',borderBottom:'1px solid rgba(239,68,68,0.18)'}}>
                <Trash2 size={11} color="#fca5a5" style={{flexShrink:0}}/>
                <span style={{fontSize:11,color:'#fca5a5',fontWeight:600,flex:1}}>Hapus <strong style={{color:'#fff'}}>{delConf}</strong> tahun {year}?</span>
                <div style={{display:'flex',gap:5}}>
                  <Btn v="delete" sz="xs" onClick={()=>deleteProduct(delConf)} t={t}>Ya, Hapus</Btn>
                  <Btn v="ghost"  sz="xs" onClick={()=>setDelConf(null)} t={t}>Batal</Btn>
                </div>
              </div>
            </td></tr>
          )}

          {/* ══ TABLE HEADERS ══ */}
          <tr>
            <th rowSpan={3} style={{...TH,textAlign:'left',minWidth:192,maxWidth:192,position:'sticky',left:0,zIndex:40,background:t.thead,borderRight:`2px solid ${t.lineStrong}`,padding:'6px 8px 6px 12px',verticalAlign:'middle'}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                <Package size={9} color={t.tx3}/>
                <span style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:t.tx3}}>Produk</span>
                <span style={{marginLeft:'auto',fontSize:8,fontWeight:800,color:QC['Q1'].tx,fontFamily:'"IBM Plex Mono",monospace',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.25)',padding:'0 4px',borderRadius:2}}>{products.length}</span>
              </div>
            </th>
            {QUARTERS.map((q,qi)=>{
              const qc=QC[q as QKey];
              return (
                <th key={q} colSpan={14} style={{...TH,background:qc.bandHd,borderLeft:`2px solid ${qc.line}`,borderRight:`2px solid ${qc.line}`,padding:'4px 2px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:qc.dot,display:'inline-block',flexShrink:0}}/>
                    <span style={{fontSize:9,fontWeight:800,color:qc.txHd,letterSpacing:'0.06em'}}>{q}</span>
                    <span style={{fontSize:7.5,fontWeight:500,color:qc.tx,opacity:.8}}>{['Jan–Mar','Apr–Jun','Jul–Sep','Okt–Des'][qi]}</span>
                  </div>
                </th>
              );
            })}
            <th rowSpan={3} style={{...TH,background:'rgba(99,102,241,0.2)',color:QC['Q1'].txHd,borderLeft:'2px solid rgba(99,102,241,0.4)',borderRight:'2px solid rgba(99,102,241,0.4)',minWidth:70,verticalAlign:'middle',fontSize:8,fontWeight:800}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                <span style={{fontSize:6.5,opacity:.55,textTransform:'uppercase',letterSpacing:'0.08em'}}>Total</span>
                <span>DOS</span>
              </div>
            </th>
            {DERIVED.map(d=>(
              <th key={d.key} colSpan={5} style={{...TH,...dkStyle(d.key,t,true),borderLeft:`2px solid ${dkBd(d.key,t)}`,fontSize:8,fontWeight:800,padding:'4px 2px'}}>{d.label}</th>
            ))}
            <th rowSpan={3} style={{...TH,minWidth:78,verticalAlign:'middle',padding:'4px 8px'}}>
              <span style={{fontSize:7,opacity:.45,textTransform:'uppercase',letterSpacing:'0.08em'}}>Aksi</span>
            </th>
          </tr>

          <tr>
            {QUARTERS.map(q=>{
              const qc=QC[q as QKey];
              return (
                <React.Fragment key={q}>
                  {getMWG(q).map(({monthShort,weekOffsets})=>(
                    <th key={monthShort} colSpan={weekOffsets.length} style={{...TH,background:t.thead,color:qc.tx,fontWeight:700,fontSize:8,borderLeft:`1px solid ${qc.muted}` as string}}>
                      {monthShort}<span style={{marginLeft:2,fontSize:6.5,opacity:.45}}>({weekOffsets.length}w)</span>
                    </th>
                  ))}
                  <th style={{...TH,background:qc.band,color:qc.txHd,borderLeft:`2px solid ${qc.line}`,minWidth:58,fontWeight:800}}>Σ</th>
                </React.Fragment>
              );
            })}
            {DERIVED.map(d=>(
              <React.Fragment key={d.key}>
                {QUARTERS.map(q=><th key={q} style={{...TH,minWidth:54,...dkStyle(d.key,t),borderLeft:`1px solid ${dkBd(d.key,t)}`}}>{q}</th>)}
                <th style={{...TH,minWidth:62,...dkStyle(d.key,t,true),borderLeft:`2px solid ${dkBd(d.key,t)}`,fontWeight:800}}>Σ</th>
              </React.Fragment>
            ))}
          </tr>

          <tr>
            {QUARTERS.map((q,qi)=>{
              const qc=QC[q as QKey];
              return (
                <React.Fragment key={q}>
                  {getMWG(q).flatMap(({weekOffsets})=>weekOffsets.map(wo=>(
                    <th key={`${q}_W${wo}`} style={{...TH,background:t.thead,color:t.tx4,fontSize:7,fontWeight:500,borderLeft:`1px solid ${t.line}`}}>
                      W{globalWeek(qi+1,wo)}
                    </th>
                  )))}
                  <th style={{...TH,background:qc.muted,color:qc.tx,borderLeft:`2px solid ${qc.line}`,fontSize:7,fontWeight:700}}>Σ</th>
                </React.Fragment>
              );
            })}
            {DERIVED.map(d=>(
              <React.Fragment key={d.key}>
                {QUARTERS.map(q=><th key={q} style={{...TH,...dkStyle(d.key,t)}}/>)}
                <th style={{...TH,...dkStyle(d.key,t,true),borderLeft:`2px solid ${dkBd(d.key,t)}`}}/>
              </React.Fragment>
            ))}
          </tr>

          {/* ══ ADD ROW ══ */}
          {addOpen&&(
            <tr style={{background:t.addBg}}>
              <td style={{padding:'5px 8px 5px 0',position:'sticky',left:0,background:t.addBg,zIndex:15,borderRight:`2px solid ${t.addBd}`,borderBottom:`1px solid ${t.addBd}`}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <div style={{width:3,alignSelf:'stretch',flexShrink:0,background:'rgba(16,185,129,0.5)',borderRadius:'0 2px 2px 0',marginRight:7}}/>
                  <select value={newProd} onChange={e=>setNewProd(e.target.value)} style={{width:170,padding:'4px 7px',borderRadius:4,fontSize:11,fontWeight:600,background:t.input,border:`1px solid ${t.lineInput}`,color:newProd?t.tx1:t.tx3,outline:'none',cursor:'pointer'}}>
                    <option value="">— Pilih produk —</option>
                    {avail.filter(a=>!products.includes(a)).map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </td>
              {QUARTERS.map(q=>(
                <React.Fragment key={q}>
                  {getMWG(q).flatMap(({weekOffsets})=>weekOffsets.map(wo=>{
                    const wk=`${q}_W${wo}`;
                    return (
                      <td key={wk} style={{padding:'2px 2px',background:QC[q as QKey].muted,borderLeft:`1px solid ${t.line}`,borderBottom:`1px solid ${t.addBd}`}}>
                        <EditableCell id={`__new__||${wk}`} initialValue={newVals[wk]??0} onChange={(_,v)=>setNewVals(p=>({...p,[wk]:v}))} t={t}/>
                      </td>
                    );
                  }))}
                  <td style={{...TD,textAlign:'right',fontWeight:700,fontFamily:'"IBM Plex Mono",monospace',background:QC[q as QKey].band,color:QC[q as QKey].txHd,borderLeft:`2px solid ${QC[q as QKey].line}`,borderBottom:`1px solid ${t.addBd}`}}>
                    {fmtN(r2(getMWG(q).flatMap(g=>g.weekOffsets).reduce((s,wo)=>s+(newVals[`${q}_W${wo}`]??0),0)))}
                  </td>
                </React.Fragment>
              ))}
              <td style={{...TD,textAlign:'right',fontWeight:700,fontFamily:'"IBM Plex Mono",monospace',background:'rgba(99,102,241,0.12)',color:QC['Q1'].txHd,borderLeft:'2px solid rgba(99,102,241,0.3)',borderBottom:`1px solid ${t.addBd}`}}>
                {fmtN(r2(QUARTERS.reduce((s,q)=>s+getMWG(q).flatMap(g=>g.weekOffsets).reduce((ss,wo)=>ss+(newVals[`${q}_W${wo}`]??0),0),0)))}
              </td>
              {DERIVED.map(d=>(
                <React.Fragment key={d.key}>
                  {QUARTERS.map(q=><td key={q} style={{...TD,...dkStyle(d.key,t),borderBottom:`1px solid ${t.addBd}`}}/>)}
                  <td style={{...TD,...dkStyle(d.key,t,true),borderLeft:`2px solid ${dkBd(d.key,t)}`,borderBottom:`1px solid ${t.addBd}`}}/>
                </React.Fragment>
              ))}
              <td style={{padding:'5px 6px',background:t.addBg,borderBottom:`1px solid ${t.addBd}`}}>
                <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                  <Btn v="save" sz="xs" onClick={addProduct} disabled={saving==='__new__'} t={t}>
                    {saving==='__new__'?<><Spinner sz={8} color="#fff"/> Simpan…</>:<><Save size={9}/> Simpan</>}
                  </Btn>
                  <Btn v="ghost" sz="xs" onClick={()=>{setAddOpen(false);setNewProd('');}} t={t}><X size={9}/></Btn>
                </div>
              </td>
            </tr>
          )}

          {!products.length&&!addOpen&&(
            <tr><td colSpan={totalCols} style={{padding:'28px 16px',background:t.thead,borderBottom:`1px solid ${t.line}`,textAlign:'center'}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                <div style={{width:36,height:36,borderRadius:8,background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.14)',display:'flex',alignItems:'center',justifyContent:'center'}}><Package size={14} color="rgba(165,180,252,0.4)"/></div>
                <span style={{fontSize:11,color:t.tx3}}>Belum ada target produk untuk {year}</span>
              </div>
            </td></tr>
          )}

          {/* ══ PRODUCT ROWS ══ */}
          {products.map((prod,ri)=>{
            const isEdit = editing.has(prod);
            const isSav  = saving===prod;
            const qd     = QUARTERS.reduce((acc,q)=>{
              acc[q] = isEdit
                ? qDos(prod,q)
                : r2(getMWG(q).flatMap(g=>g.weekOffsets).reduce((s,wo)=>s+(weekMap[prod]?.[`${q}_W${wo}`]??0),0));
              return acc;
            },{} as Record<Quarter,number>);
            const totDos = r2(Object.values(qd).reduce((s,v)=>s+v,0));
            const qDrv   = QUARTERS.reduce((acc,q)=>{acc[q]=calcDerived(prod,qd[q]);return acc;},{} as Record<Quarter,Record<DerivedKey,number>>);
            const totDrv = calcDerived(prod,totDos);
            const rowBg  = isEdit ? t.rowEdit : ri%2===0 ? t.rowAlt : t.card;

            return (
              <tr key={prod} style={{background:rowBg,borderBottom:`1px solid ${t.line}`,transition:'background 0.08s'}}
                onMouseEnter={e=>{
                  if(!isEdit){e.currentTarget.style.background=t.rowHov;
                  const sc=e.currentTarget.querySelector('td[data-stick]') as HTMLElement|null;
                  if(sc) sc.style.background=t.rowHov;}
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background=rowBg;
                  const sc=e.currentTarget.querySelector('td[data-stick]') as HTMLElement|null;
                  if(sc) sc.style.background=rowBg;
                }}>
                <td data-stick style={{padding:'5px 8px 5px 0',borderRight:`2px solid ${isEdit?'rgba(59,130,246,0.25)':t.lineStrong}`,position:'sticky',left:0,background:rowBg,zIndex:10,transition:'background 0.08s'}}>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <div style={{width:2,alignSelf:'stretch',flexShrink:0,marginRight:8,borderRadius:'0 1px 1px 0',background:isEdit?'#3b82f6':'transparent',transition:'background 0.15s'}}/>
                    <div style={{minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:1}}>
                        <span style={{fontSize:11,fontWeight:600,color:t.tx1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:152}}>{prod}</span>
                        <CatBadge cat={getProductCategory(prod)}/>
                      </div>
                      <div style={{fontSize:8,color:t.tx4,fontFamily:'"IBM Plex Mono",monospace'}}>
                        {isEdit?<span style={{color:'#60a5fa',fontWeight:700}}>● editing</span>:totDos>0?`${fmtN(totDos)} dos`:'—'}
                      </div>
                    </div>
                  </div>
                </td>
                {QUARTERS.map((q,qi)=>{
                  const qc=QC[q as QKey];
                  return (
                    <React.Fragment key={q}>
                      {getMWG(q).flatMap(({weekOffsets})=>weekOffsets.map(wo=>{
                        const ck=`${prod}||${q}_W${wo}`;
                        const iv=weekMap[prod]?.[`${q}_W${wo}`]??0;
                        return (
                          <td key={ck} style={{padding:'2px 2px',background:qc.muted,borderLeft:`1px solid ${t.line}`}}>
                            {isEdit
                              ? <EditableCell id={ck} initialValue={iv} onChange={onCellChange} t={t}/>
                              : <span style={{display:'block',textAlign:'right',fontFamily:'"IBM Plex Mono",monospace',fontSize:10,fontWeight:iv>0?600:400,color:iv>0?qc.tx:t.tx4,padding:'2px 4px'}}>{iv>0?fmtN(iv):'·'}</span>
                            }
                          </td>
                        );
                      }))}
                      <td style={{...TD,textAlign:'right',fontWeight:700,fontFamily:'"IBM Plex Mono",monospace',background:qd[q]>0?qc.band:t.rowAlt,color:qd[q]>0?qc.txHd:t.tx4,borderLeft:`2px solid ${qc.line}`,minWidth:58,fontSize:10}}>
                        {qd[q]>0?fmtN(qd[q]):'—'}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td style={{...TD,textAlign:'right',fontWeight:800,fontFamily:'"IBM Plex Mono",monospace',background:totDos>0?'rgba(99,102,241,0.14)':t.rowAlt,color:totDos>0?QC['Q1'].txHd:t.tx4,borderLeft:'2px solid rgba(99,102,241,0.35)',borderRight:'2px solid rgba(99,102,241,0.35)',minWidth:70,fontSize:11}}>
                  {totDos>0?fmtN(totDos):'—'}
                </td>
                {DERIVED.map(d=>(
                  <React.Fragment key={d.key}>
                    {QUARTERS.map(q=>{
                      const v=qDrv[q][d.key];
                      return <td key={q} style={{...TD,textAlign:'right',fontFamily:'"IBM Plex Mono",monospace',fontWeight:v>0?600:400,...dkStyle(d.key,t),minWidth:54}}>
                        <span style={{color:v>0?undefined:t.tx4}}>{v>0?fmtN(v):'—'}</span>
                      </td>;
                    })}
                    <td style={{...TD,textAlign:'right',fontWeight:700,fontFamily:'"IBM Plex Mono",monospace',...dkStyle(d.key,t,true),borderLeft:`2px solid ${dkBd(d.key,t)}`,minWidth:62}}>
                      {totDrv[d.key]>0?fmtN(totDrv[d.key]):<span style={{color:t.tx4}}>—</span>}
                    </td>
                  </React.Fragment>
                ))}
                <td style={{padding:'4px 6px',background:rowBg}}>
                  <div style={{display:'flex',gap:3,justifyContent:'flex-end',alignItems:'center'}}>
                    {isEdit?(
                      <>
                        <Btn v="save"   sz="xs" onClick={()=>saveProduct(prod)} disabled={isSav} t={t}>
                          {isSav?<><Spinner sz={8} color="#fff"/> Simpan…</>:<><Save size={9}/> Simpan</>}
                        </Btn>
                        <Btn v="cancel" sz="xs" onClick={()=>cancelEdit(prod)} disabled={isSav} t={t}><X size={9}/></Btn>
                      </>
                    ):(
                      <>
                        <Btn v="edit"   sz="xs" onClick={()=>startEdit(prod)} t={t}><Edit2 size={9}/></Btn>
                        <Btn v="delete" sz="xs" onClick={()=>setDelConf(prod)} t={t}><Trash2 size={9}/></Btn>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {/* ══ SUBTOTAL ROW ══ */}
          {products.length>0&&(
            <tr style={{background:t.grandRow,borderBottom:`2px solid rgba(99,102,241,0.25)`}}>
              <td data-stick style={{padding:'6px 8px 6px 0',borderRight:`2px solid rgba(99,102,241,0.2)`,position:'sticky',left:0,background:t.grandRow,zIndex:10}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <div style={{width:2,alignSelf:'stretch',flexShrink:0,marginRight:8,borderRadius:'0 1px 1px 0',background:'rgba(99,102,241,0.5)'}}/>
                  <div>
                    <div style={{fontSize:8,fontWeight:800,color:'rgba(255,255,255,0.55)',fontFamily:'"IBM Plex Mono",monospace',textTransform:'uppercase',letterSpacing:'0.1em'}}>Subtotal</div>
                    <div style={{fontSize:7,color:'rgba(255,255,255,0.35)',fontFamily:'"IBM Plex Mono",monospace',marginTop:1}}>{products.length} produk</div>
                  </div>
                </div>
              </td>
              {QUARTERS.map(q=>{
                const qc=QC[q as QKey];
                return (
                  <React.Fragment key={q}>
                    {getMWG(q).flatMap(({weekOffsets})=>weekOffsets.map(wo=>(
                      <td key={wo} style={{...TD,textAlign:'right',fontFamily:'"IBM Plex Mono",monospace',fontWeight:600,background:qc.muted,color:qc.tx,fontSize:10}}>
                        {fmtN(r2(products.reduce((s,p)=>s+(weekMap[p]?.[`${q}_W${wo}`]??0),0)))}
                      </td>
                    )))}
                    <td style={{...TD,textAlign:'right',fontWeight:800,fontFamily:'"IBM Plex Mono",monospace',background:qc.bandHd,color:qc.txHd,borderLeft:`2px solid ${qc.line}`,fontSize:11}}>
                      {fmtN(subDos[q])}
                    </td>
                  </React.Fragment>
                );
              })}
              <td style={{...TD,textAlign:'right',fontWeight:800,fontFamily:'"IBM Plex Mono",monospace',background:'rgba(99,102,241,0.25)',color:QC['Q1'].txHd,borderLeft:'2px solid rgba(99,102,241,0.4)',fontSize:12}}>
                {fmtN(subTotal)}
              </td>
              {DERIVED.map(d=>{
                const qts=QUARTERS.map(q=>r2(products.reduce((s,p)=>{
                  const dos=r2(getMWG(q).flatMap(g=>g.weekOffsets).reduce((ss,wo)=>ss+(weekMap[p]?.[`${q}_W${wo}`]??0),0));
                  return s+calcDerived(p,dos)[d.key];
                },0)));
                const grand=r2(qts.reduce((s,v)=>s+v,0));
                return (
                  <React.Fragment key={d.key}>
                    {qts.map((v,i)=><td key={i} style={{...TD,textAlign:'right',fontWeight:600,fontFamily:'"IBM Plex Mono",monospace',...dkStyle(d.key,t,true),fontSize:10}}>{fmtN(v)}</td>)}
                    <td style={{...TD,textAlign:'right',fontWeight:800,fontFamily:'"IBM Plex Mono",monospace',...dkStyle(d.key,t,true),borderLeft:`2px solid ${dkBd(d.key,t)}`,fontSize:11}}>{fmtN(grand)}</td>
                  </React.Fragment>
                );
              })}
              <td style={{background:t.grandRow}}/>
            </tr>
          )}
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN — AreaManagement
// ─────────────────────────────────────────────────────────────────
export default function AreaManagement({ theme, onAreasChange }: { theme:Theme; onAreasChange?:(areas:AreaConfig[])=>void }) {
  const { user, getAccessibleAreas } = useAuth() as any;
  const t   = T[theme] as Tok;
  const w   = useWindowWidth();
  const mob = w < 768;

  const [areas,    setAreas]    = useState<AreaConfig[]>([]);
  const [selIds,   setSelIds]   = useState<Set<string>>(new Set());
  const [year,     setYear]     = useState(String(new Date().getFullYear()));
  const [yearOpen, setYearOpen] = useState(false);
  const [addOpen,  setAddOpen]  = useState(false);
  const [newA,     setNewA]     = useState<{id:string;name:string}>({id:'',name:''});
  const [delId,    setDelId]    = useState<string|null>(null);
  const [toast,    setToast]    = useState<{show:boolean;msg:string;ok:boolean}>({show:false,msg:'',ok:true});
  const YEARS = ['2023','2024','2025','2026','2027','2028'];
  const yearRef = useRef<HTMLDivElement>(null);

  // ── State untuk edit nama area ────────────────────────────────
  const [editAreaId,   setEditAreaId]   = useState<string|null>(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [savingArea,   setSavingArea]   = useState(false);
  const editAreaRef = useRef<HTMLInputElement>(null);

  const showToast = (msg:string,ok=true)=>{setToast({show:true,msg,ok});setTimeout(()=>setToast(t=>({...t,show:false})),3000);};

  useEffect(()=>{loadAreas();},[]);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(!yearRef.current?.contains(e.target as Node))setYearOpen(false);};
    document.addEventListener('click',h,true);
    return ()=>document.removeEventListener('click',h,true);
  },[]);

  // Auto-focus input saat mode edit area aktif
  useEffect(()=>{
    if(editAreaId) setTimeout(()=>editAreaRef.current?.focus(),50);
  },[editAreaId]);

  const loadAreas = async()=>{
    try {
      const r=await fetch('/api/areas');
      if(!r.ok) throw new Error();
      const j=await r.json();
      let all:AreaConfig[]=j.data?.areas??[];
      if(user&&user.role!=='root'){
        const acc=getAccessibleAreas();
        all=acc.length>0?all.filter((a:AreaConfig)=>acc.includes(a.id)):[];
      }
      setAreas(all); onAreasChange?.(all);
    } catch { setAreas([]); }
  };

  const apiCall = async(action:string,area:Partial<AreaConfig>)=>{
    const r=await fetch('/api/areas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,area})});
    const j=await r.json();
    if(j.success){const a=j.data?.areas??[];setAreas(a);onAreasChange?.(a);}
    return j;
  };

  const handleAdd = async()=>{
    if(!newA.id){showToast('Lengkapi ID area',false);return;}
    const j=await apiCall('add',{...newA,name:newA.name||newA.id}).catch(()=>({success:false,error:'Network'}));
    if(j.success){setNewA({id:'',name:''});setAddOpen(false);showToast('Area ditambahkan');}
    else showToast(`Gagal: ${j.error}`,false);
  };

  const handleDel = async()=>{
    if(!delId) return;
    const j=await apiCall('delete',{id:delId}).catch(()=>({success:false,error:'Network'}));
    if(j.success){setSelIds(prev=>{const n=new Set(prev);n.delete(delId);return n;});showToast('Area dihapus');}
    else showToast(`Gagal: ${j.error}`,false);
    setDelId(null);
  };

  // ── Handler edit nama area ────────────────────────────────────
  const startEditArea = (area: AreaConfig) => {
    setEditAreaId(area.id);
    setEditAreaName(area.name || area.id.replace('area_','').replace(/_/g,' '));
  };

  const cancelEditArea = () => {
    setEditAreaId(null);
    setEditAreaName('');
  };

  const saveAreaName = async () => {
    if (!editAreaId || !editAreaName.trim()) {
      showToast('Nama area tidak boleh kosong', false);
      return;
    }
    setSavingArea(true);
    try {
      const j = await apiCall('update', { id: editAreaId, name: editAreaName.trim() })
        .catch(()=>({success:false,error:'Network'}));
      if (j.success) {
        showToast('Nama area diperbarui');
        cancelEditArea();
      } else {
        showToast(`Gagal: ${j.error}`, false);
      }
    } finally {
      setSavingArea(false);
    }
  };

  const toggle   = (id:string)=>setSelIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const selAll   = ()=>setSelIds(new Set(areas.map(a=>a.id)));
  const clearAll = ()=>setSelIds(new Set());
  const displayed = useMemo(()=>areas.filter(a=>selIds.has(a.id)),[areas,selIds]);

  const INP: React.CSSProperties = {
    padding:'6px 10px',borderRadius:5,fontSize:12,fontWeight:500,
    background:t.input,border:`1px solid ${t.lineInput}`,
    color:t.tx1,outline:'none',fontFamily:'"IBM Plex Sans",sans-serif',
  };

  return (
    <div style={{background:t.page,fontFamily:'"IBM Plex Sans",sans-serif',minHeight:'100vh'}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.22);border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(99,102,241,0.38)}
      `}</style>

      {toast.show&&(
        <div style={{position:'fixed',top:14,right:14,zIndex:300,animation:'slideR 0.16s ease'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:6,fontSize:12,fontWeight:600,color:t.tx1,background:toast.ok?t.toastOk:t.toastErr,borderLeft:`3px solid ${toast.ok?t.toastOkBd:t.toastErrBd}`,border:`1px solid ${toast.ok?t.toastOkBd:t.toastErrBd}`,boxShadow:'0 4px 20px rgba(0,0,0,0.25)',minWidth:200}}>
            {toast.ok?<CheckCircle2 size={13} color={t.toastOkBd}/>:<AlertCircle size={13} color={t.toastErrBd}/>}
            {toast.msg}
          </div>
        </div>
      )}

      {delId&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:250,padding:16,backdropFilter:'blur(3px)',animation:'fadeUp 0.12s ease'}}>
          <div style={{background:t.modal,borderRadius:8,border:`1px solid ${t.lineStrong}`,maxWidth:340,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.5)',overflow:'hidden'}}>
            <div style={{height:2,background:'#dc2626'}}/>
            <div style={{padding:'16px 18px',borderBottom:`1px solid ${t.line}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:32,height:32,borderRadius:6,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Trash2 size={14} color="#fca5a5"/></div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:t.tx1}}>Hapus Area</div>
                  <div style={{fontSize:10,color:t.tx3,marginTop:1}}>Tindakan tidak bisa dibatalkan</div>
                </div>
              </div>
              <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.14)',borderRadius:5,padding:'8px 10px'}}>
                <span style={{fontSize:12,color:t.tx2}}>Area </span>
                <code style={{fontSize:11,fontFamily:'"IBM Plex Mono",monospace',background:'rgba(239,68,68,0.1)',color:'#fca5a5',padding:'1px 5px',borderRadius:3}}>{delId}</code>
                <span style={{fontSize:12,color:t.tx2}}> akan dihapus permanen.</span>
              </div>
            </div>
            <div style={{padding:'10px 18px',display:'flex',gap:7}}>
              <Btn v="ghost"  sz="sm" onClick={()=>setDelId(null)} full t={t}>Batal</Btn>
              <Btn v="delete" sz="sm" onClick={handleDel}          full t={t}><Trash2 size={11}/> Hapus</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:mob?'12px':'16px 20px'}}>
        {/* ══ PAGE HEADER ══ */}
        <div style={{background:t.card,borderTop:'2px solid #4f46e5',borderRight:`1px solid ${t.lineStrong}`,borderBottom:`1px solid ${t.lineStrong}`,borderLeft:`1px solid ${t.lineStrong}`,borderRadius:7,padding:mob?'11px 13px':'12px 18px',marginBottom:14,boxShadow:t.shadow,overflow:'visible'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:11}}>
              <div style={{width:34,height:34,borderRadius:6,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><MapPin size={14} color="#818cf8"/></div>
              <div>
                <h1 style={{fontSize:mob?13:14,fontWeight:800,color:t.tx1,margin:'0 0 1px',letterSpacing:'-0.02em',lineHeight:1}}>Area Management</h1>
                <p style={{fontSize:9,color:t.tx3,margin:0,fontFamily:'"IBM Plex Mono",monospace',letterSpacing:'0.02em'}}>Target DOS · Produk · Kuartal · Minggu</p>
              </div>
            </div>
            <Btn v={addOpen?'ghost':'save'} sz="sm" onClick={()=>{setAddOpen(p=>!p);setNewA({id:'',name:''});}} t={t}>
              {addOpen?<><X size={10}/> Batal</>:<><Plus size={10}/> {mob?'Tambah':'Tambah Area'}</>}
            </Btn>
          </div>

          <div style={{height:1,background:t.line,margin:'10px 0'}}/>

          <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:mob?'wrap':'nowrap'}}>
            <span style={{fontSize:8,color:t.tx3,fontFamily:'"IBM Plex Mono",monospace',textTransform:'uppercase',letterSpacing:'0.08em',flexShrink:0}}>Filter</span>
            <AreaDropdown areas={areas} sel={selIds} onToggle={toggle} onAll={selAll} onClear={clearAll} t={t as Tok} theme={theme}/>
            <div style={{width:1,height:18,background:t.line,flexShrink:0}}/>

            <div ref={yearRef} style={{position:'relative',flexShrink:0}}>
              <button onClick={()=>setYearOpen(p=>!p)} style={{display:'flex',alignItems:'center',gap:5,height:30,padding:'0 10px',borderRadius:5,cursor:'pointer',fontFamily:'"IBM Plex Mono",monospace',fontWeight:700,fontSize:11,background:t.input,border:`1px solid ${t.lineInput}`,color:t.tx2}}>
                <span style={{fontSize:7,opacity:.4,textTransform:'uppercase',letterSpacing:'0.09em'}}>FY</span>
                {year}
                <ChevronDown size={9} style={{opacity:.4,transform:yearOpen?'rotate(180deg)':'rotate(0)',transition:'transform 0.15s'}}/>
              </button>
              {yearOpen&&(
                <div style={{position:'absolute',top:'calc(100% + 4px)',right:0,zIndex:200,background:t.drop,border:`1px solid ${t.dropBd}`,borderRadius:6,boxShadow:'0 8px 24px rgba(0,0,0,0.25)',overflow:'hidden',minWidth:100,animation:'fadeUp 0.12s ease'}}>
                  {YEARS.map(y=>(
                    <button key={y} onClick={()=>{setYear(y);setYearOpen(false);}} style={{display:'flex',alignItems:'center',gap:7,width:'100%',padding:'7px 12px',background:y===year?t.dropSel:'transparent',border:'none',cursor:'pointer',fontSize:12,fontFamily:'"IBM Plex Mono",monospace',color:y===year?'#818cf8':t.tx2,fontWeight:y===year?700:400}}>
                      <span style={{width:4,height:4,borderRadius:'50%',background:y===year?'#818cf8':t.lineInput,display:'block',flexShrink:0}}/>
                      {y}
                      {y===String(new Date().getFullYear())&&<span style={{fontSize:7.5,color:'#34d399',fontWeight:800,marginLeft:'auto',letterSpacing:'0.04em'}}>NOW</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!mob&&selIds.size>0&&(
              <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',flex:1,minWidth:0}}>
                {[...selIds].slice(0,5).map(id=>{
                  const a=areas.find(x=>x.id===id);
                  const nm=a?.name||id.replace('area_','').replace(/_/g,' ');
                  return (
                    <span key={id} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 6px 2px 5px',borderRadius:3,background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',fontSize:10,fontWeight:600,color:(theme==='dark'?'#a5b4fc':'#3730a3'),whiteSpace:'nowrap'}}>
                      <span style={{width:3,height:3,borderRadius:'50%',background:(theme==='dark'?'#6366f1':'#4f46e5'),display:'inline-block',flexShrink:0}}/>
                      {nm}
                      <button onClick={()=>toggle(id)} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',color:'rgba(165,180,252,0.4)',marginLeft:1}}><X size={8}/></button>
                    </span>
                  );
                })}
                {selIds.size>5&&<span style={{fontSize:10,color:t.tx3,fontFamily:'"IBM Plex Mono",monospace'}}>+{selIds.size-5}</span>}
              </div>
            )}

            {!mob&&(
              <div style={{display:'flex',gap:5,marginLeft:'auto',flexShrink:0}}>
                {[
                  {label:'Area',  val:areas.length,  accent:(theme==='dark'?'#818cf8':'#4f46e5'),bg:'rgba(99,102,241,0.08)',bd:'rgba(99,102,241,0.2)'},
                  {label:'Aktif', val:selIds.size, accent:(theme==='dark'?'#34d399':'#059669'),bg:'rgba(16,185,129,0.07)',bd:'rgba(16,185,129,0.2)'},
                ].map(c=>(
                  <div key={c.label} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 9px 3px 7px',borderRadius:4,background:c.bg,border:`1px solid ${c.bd}`}}>
                    <span style={{width:4,height:4,borderRadius:'50%',background:c.accent,display:'block',flexShrink:0}}/>
                    <span style={{fontSize:8,color:t.tx3,fontFamily:'"IBM Plex Mono",monospace',textTransform:'uppercase',letterSpacing:'0.06em'}}>{c.label}</span>
                    <span style={{fontSize:12,fontWeight:800,color:c.accent,fontFamily:'"IBM Plex Mono",monospace'}}>{c.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {addOpen&&(
          <div style={{background:t.addBg,border:`1px solid ${t.addBd}`,borderRadius:6,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',animation:'fadeUp 0.14s ease'}}>
            <MapPin size={12} color={t.btnGreenTx} style={{flexShrink:0}}/>
            <input value={newA.id} placeholder="id_area" onChange={e=>setNewA(p=>({...p,id:e.target.value.toLowerCase().replace(/\s+/g,'_'),name:e.target.value}))}
              style={{...INP,flex:1,minWidth:130,fontFamily:'"IBM Plex Mono",monospace',fontWeight:600}}/>
            {!mob&&<input value={newA.name} placeholder="Nama (opsional)" onChange={e=>setNewA(p=>({...p,name:e.target.value}))}
              style={{...INP,flex:2,minWidth:160}}/>}
            <Btn v="save"  sz="sm" onClick={handleAdd}              t={t}><Save size={10}/> Simpan</Btn>
            <Btn v="ghost" sz="sm" onClick={()=>setAddOpen(false)} t={t}><X size={10}/></Btn>
          </div>
        )}

        <div>
          {selIds.size===0&&(
            <div style={{background:t.card,borderRadius:7,border:`1px solid ${t.lineStrong}`,boxShadow:t.shadow,padding:mob?'40px 16px':'56px 20px',textAlign:'center'}}>
              <div style={{maxWidth:300,margin:'0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
                <div style={{width:48,height:48,borderRadius:10,background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.16)',display:'flex',alignItems:'center',justifyContent:'center'}}><MapPin size={20} color="rgba(129,140,248,0.5)"/></div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:t.tx1,marginBottom:5}}>Pilih Area untuk Mulai</div>
                  <div style={{fontSize:12,color:t.tx3,lineHeight:1.7}}>Gunakan dropdown <strong style={{color:theme==='dark'?'#a5b4fc':'#3730a3'}}>Pilih Area</strong> di atas untuk melihat dan mengelola target produk.</div>
                </div>
                {areas.length>0&&(
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center',marginTop:4}}>
                    {areas.slice(0,4).map(a=>(
                      <button key={a.id} onClick={()=>toggle(a.id)} style={{padding:'4px 10px',borderRadius:4,background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.2)',color:theme==='dark'?'#a5b4fc':'#3730a3',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                        <MapPin size={9}/>{a.name||a.id}
                      </button>
                    ))}
                    {areas.length>4&&<span style={{fontSize:11,color:t.tx3,alignSelf:'center'}}>+{areas.length-4}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {displayed.map(area=>{
            const isEditingThisArea = editAreaId === area.id;
            const areaDisplayName = area.name || area.id.replace('area_','').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());

            return (
              <div key={`${area.id}_${year}`} style={{background:t.card,borderRadius:7,border:`1px solid ${t.lineStrong}`,boxShadow:t.shadow,marginBottom:14,overflow:'visible'}}>
                {/* ── Edit nama area bar ── */}
                <div style={{
                  display:'flex',alignItems:'center',gap:8,
                  padding:'8px 14px',
                  borderBottom:`1px solid ${t.line}`,
                  background:isEditingThisArea
                    ? (theme==='dark'?'rgba(59,130,246,0.06)':'#eff6ff')
                    : t.cardRaised,
                  borderRadius:'7px 7px 0 0',
                  transition:'background 0.15s',
                }}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'#6366f1',flexShrink:0}}/>

                  {isEditingThisArea ? (
                    /* ── Mode edit: input + tombol save/cancel ── */
                    <>
                      <input
                        ref={editAreaRef}
                        value={editAreaName}
                        onChange={e=>setEditAreaName(e.target.value)}
                        onKeyDown={e=>{
                          if(e.key==='Enter') saveAreaName();
                          if(e.key==='Escape') cancelEditArea();
                        }}
                        placeholder="Nama area…"
                        style={{
                          flex:1,maxWidth:300,
                          padding:'4px 8px',borderRadius:4,
                          fontSize:12,fontWeight:600,
                          background:theme==='dark'?'rgba(59,130,246,0.1)':'#fff',
                          border:`1.5px solid ${theme==='dark'?'rgba(59,130,246,0.5)':'#93c5fd'}`,
                          color:t.tx1,outline:'none',
                          fontFamily:'"IBM Plex Sans",sans-serif',
                          boxShadow:'0 0 0 3px rgba(59,130,246,0.1)',
                        }}
                      />
                      <span style={{fontSize:9,color:t.tx4,fontFamily:'"IBM Plex Mono",monospace',flexShrink:0}}>
                        {area.id}
                      </span>
                      <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                        <Btn v="save" sz="xs" onClick={saveAreaName} disabled={savingArea} t={t}>
                          {savingArea?<><Spinner sz={8} color="#fff"/> Simpan…</>:<><Save size={9}/> Simpan</>}
                        </Btn>
                        <Btn v="cancel" sz="xs" onClick={cancelEditArea} disabled={savingArea} t={t}>
                          <X size={9}/>
                        </Btn>
                      </div>
                    </>
                  ) : (
                    /* ── Mode normal: nama + tombol edit + hapus ── */
                    <>
                      <span style={{
                        fontSize:12,fontWeight:700,color:t.tx1,
                        fontFamily:'"IBM Plex Sans",sans-serif',
                        flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                      }}>
                        {areaDisplayName}
                      </span>
                      <span style={{fontSize:9,color:t.tx4,fontFamily:'"IBM Plex Mono",monospace',flexShrink:0}}>
                        {area.id}
                      </span>
                      <div style={{display:'flex',gap:4,marginLeft:8,flexShrink:0}}>
                        <Btn v="edit" sz="xs" onClick={()=>startEditArea(area)} t={t}>
                          <Edit2 size={9}/> {!mob&&'Ubah Nama'}
                        </Btn>
                        {user?.role==='root'&&(
                          <Btn v="delete" sz="xs" onClick={()=>setDelId(area.id)} t={t}>
                            <Trash2 size={9}/>
                          </Btn>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div style={{overflowX:'auto',overflowY:'visible',WebkitOverflowScrolling:'touch',maxWidth:'100%',borderRadius:'0 0 7px 7px'}}>
                  <table style={{minWidth:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <tbody>
                      <ExpandedProductRows areaId={area.id} year={year} t={t as Tok} theme={theme}/>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {selIds.size>0&&displayed.length===0&&(
            <div style={{background:t.card,borderRadius:7,padding:'20px',border:`1px solid ${t.lineStrong}`,textAlign:'center',color:t.tx3,fontSize:12}}>
              Area tidak ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}