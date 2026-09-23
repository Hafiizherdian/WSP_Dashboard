'use client';

import {
  TrendingUp, Calendar, BarChart3, PieChart, Activity, Store,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
  PieChart as RechartsPieChart, Pie,
  BarChart,
} from 'recharts';
import { SalesData } from '@/types/sales';
import { getProductCategory } from '@/lib/productCategories';
import { tk, Theme, UNIT_OPTIONS, useBreakpoint } from '@/lib/dashboard-theme';

const CC = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#0d9488','#f97316','#ec4899'];

const fmtK = (v:number) => v.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtU  = (v:number) => v.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtUF = (v:number) => {
  // Potong desimal murni tanpa pembulatan ke atas
  const truncated = Math.floor(v * 100) / 100;
  return truncated.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtRp = (v:number) =>
  v >= 1e9  ? `Rp ${(v/1e9).toFixed(1)}M`
  : `Rp ${Math.round(v)}`;

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

const mkTick=(theme:Theme)=>({fontSize:8,fill:tk[theme].text,fontFamily:'IBM Plex Mono,monospace'});

function CT({ active, payload, label, theme }:any) {
  const t=tk[theme as Theme];
  if (!active||!payload?.length) return null;
  const isUnitChart = payload.some((p:any) =>
    p.name?.includes('Target') || p.name?.includes('Actual') ||
    p.name?.includes('Dos') || p.name?.includes('Bks') || p.name?.includes('Slop') || p.name?.includes('Bal')
  );
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
        <span style={{ position:'absolute', top:14, right:16, display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:10, width:'fit-content', fontSize:9, fontWeight:700, fontFamily:'IBM Plex Mono, monospace', background:badge.positive?t.posBg:t.negBg, color:badge.positive?t.posText:t.negText, border:`1px solid ${badge.positive?t.posBorder:t.negBorder}` }}>
          {badge.positive}
          {badge.text}
        </span>
      )}
    </div>
  );
}

export default function OverviewTab({ data, theme, y1, y2, availH, selectedUnit = 'units_dos' }:{
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
            { n:1, title:'Pilih Periode',   desc:'Atur tahun & range minggu untuk P1 dan P2 di filter bar atas', last:false },
            { n:2, title:'Pilih Area',      badge:'opsional', desc:'Kosongkan untuk semua area, atau pilih area tertentu', last:false },
            { n:3, title:'Klik "Terapkan"', desc:'Dashboard akan memuat data sesuai filter yang dipilih', last:true },
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

  const getOutletUnitValue = (r:any): number => {
    if (selectedUnit === 'omzet')      return r.omzet      ?? 0;
    if (selectedUnit === 'units_bks')  return r.unitsBks   ?? 0;
    if (selectedUnit === 'units_slop') return r.unitsSlop  ?? 0;
    if (selectedUnit === 'units_bal')  return r.unitsBal   ?? 0;
    return r.dozNet ?? 0;
  };
  const fmtOutlet = (v:number) => selectedUnit==='omzet' ? fmtRp(v) : fmtK(v);

  const curR=rows.filter((r:any)=>r.year===(cy?.currentYear??y2));
  const oTypes=Array.from(new Set(curR.map((r:any)=>r.outletType))).filter(Boolean) as string[];
  const totDoz=curR.reduce((s:number,r:any)=>s+getOutletUnitValue(r),0);
  const dData=oTypes.map((ot,i)=>({n:ot,v:curR.filter((r:any)=>r.outletType===ot).reduce((s:number,r:any)=>s+getOutletUnitValue(r),0),fill:CC[i%CC.length]}));
  const pMap=new Map<string,number>();
  curR.forEach((r:any)=>{if(r.product) pMap.set(r.product,(pMap.get(r.product)||0)+getOutletUnitValue(r));});
  const topP=Array.from(pMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n,v])=>({n,v}));

  const unitLabel=UNIT_OPTIONS.find(o=>o.value===selectedUnit)?.label??UNIT_OPTIONS[0].label;
  const bodyGrid=isMobile?'1fr':isTablet?'1fr 1fr':'2fr 1.3fr 1.4fr';
  const MOBILE_CHART_H=180;

  if (isMobile) {
    return (
      <div style={{display:'flex',flexDirection:'column',gap:GAP}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:GAP}}>
        <KpiMini bg={t.card1bg} border={t.card1border} labelColor={t.card1text} accent={t.card1accent} label={`${unitLabel} ${pL}`} value={selectedUnit==='omzet'?fmtRp(yoy.previousYearTotal):fmtU(yoy.previousYearTotal)} sub={selectedUnit==='omzet'? `Rp ${fmtUF(yoy.previousYearTotal)}` : fmtUF(yoy.previousYearTotal)} theme={theme}/>
        <KpiMini bg={t.card2bg} border={t.card2border} labelColor={t.card2text} accent={t.card2accent} label={`${unitLabel} ${cL}`} value={selectedUnit==='omzet'?fmtRp(yoy.currentYearTotal):fmtU(yoy.currentYearTotal)} sub={selectedUnit==='omzet'? `Rp ${fmtUF(yoy.currentYearTotal)}` : fmtUF(yoy.currentYearTotal)} theme={theme}/>
        <KpiMini bg={t.card3bg} border={t.card3border} labelColor={t.card3text} accent={t.card3accent} label="Growth YoY" value={`${isPos?'+':''}${gPct.toFixed(1)}%`} sub={` ${selectedUnit==='omzet'? `Rp ${fmtUF(yoy.variance)}` : fmtUF(yoy.variance)}`} badge={{text:isPos?'↑ Tumbuh':'↓ Turun',positive:isPos}} theme={theme}/>

        </div>

        <Card theme={theme} accent="#3b82f6" title={`Mingguan — ${pL} vs ${cL}`} icon={<Calendar size={10} color="#3b82f6"/>} color="#3b82f6" sub={`${posW}/${wc.length} minggu positif`}>
          <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
            <ComposedChart data={weekData} margin={{top:2,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
              <XAxis dataKey="w" tick={ts} axisLine={false} tickLine={false} interval={9}/>
              <YAxis yAxisId="l" tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
              <YAxis yAxisId="r" orientation="right" tickFormatter={v=>`${v.toFixed(0)}%`} tick={ts} axisLine={false} tickLine={false} width={26}/>
              <Tooltip content={<CT theme={theme}/>}/>
              <Bar yAxisId="l" dataKey="p" name={String(pL)} fill="#3b82f6" opacity={0.35} radius={[2,2,0,0]} maxBarSize={9}/>
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
              <XAxis dataKey="w" tick={ts} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={55} dy={12}/>
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

        <Card theme={theme} accent="#8b5cf6" title={`Outlet Kontribusi ${cL}`} icon={<Store size={10} color="#8b5cf6"/>} color="#8b5cf6" sub={oTypes.length>0?`${oTypes.length} tipe · ${fmtOutlet(totDoz)} ${unitLabel}`:'Belum ada data outlet'}>
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
                      return <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:7,padding:'5px 9px',fontSize:10,fontFamily:'IBM Plex Mono,monospace'}}><div style={{color:d.fill,fontWeight:700}}>{d.n}</div><div style={{color:t.text}}>{fmtOutlet(d.v)} {unitLabel}</div><div style={{color:t.textMuted}}>{p}%</div></div>;
                    }}/>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                  <div style={{fontSize:11,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{fmtOutlet(totDoz)}</div>
                  <div style={{fontSize:7,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.05em'}}>{unitLabel.toUpperCase()}</div>
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

        <Card theme={theme} accent="#f97316" title="Top Produk" icon={<BarChart3 size={10} color="#f97316"/>} color="#f97316" sub={topP.length>0?`${cL} · ${unitLabel}`:'Belum ada data produk'}>
          {topP.length>0 ? (
            <ResponsiveContainer width="100%" height={MOBILE_CHART_H}>
              <BarChart data={topP} layout="vertical" margin={{top:0,right:6,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={gs} horizontal={false}/>
                <XAxis type="number" tickFormatter={fmtOutlet} tick={ts} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="n" tick={{...ts,fontSize:8}} axisLine={false} tickLine={false} width={80}/>
                <Tooltip content={<CT theme={theme}/>}/>
                <Bar dataKey="v" name={unitLabel} radius={[0,3,3,0]} maxBarSize={16}>
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

  return (
    <div style={{height:availH,display:'flex',flexDirection:'column',gap:GAP,overflow:'hidden'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1.8fr',gap:GAP,height:KPI_H,flexShrink:0}}>
        <KpiMini bg={t.card1bg} border={t.card1border} labelColor={t.card1text} accent={t.card1accent} label={`${unitLabel} ${pL}`} value={selectedUnit==='omzet'?fmtRp(yoy.previousYearTotal):fmtU(yoy.previousYearTotal)} sub={selectedUnit==='omzet'? `Rp ${fmtUF(yoy.previousYearTotal)}` : fmtUF(yoy.previousYearTotal)} theme={theme}/>
        <KpiMini bg={t.card2bg} border={t.card2border} labelColor={t.card2text} accent={t.card2accent} label={`${unitLabel} ${cL}`} value={selectedUnit==='omzet'?fmtRp(yoy.currentYearTotal):fmtU(yoy.currentYearTotal)} sub={selectedUnit==='omzet'? `Rp ${fmtUF(yoy.currentYearTotal)}` : fmtUF(yoy.currentYearTotal)} theme={theme}/>
        <KpiMini bg={t.card3bg} border={t.card3border} labelColor={t.card3text} accent={t.card3accent} label="Growth YoY" value={`${isPos?'+':''}${gPct.toFixed(1)}%`} sub={` ${selectedUnit==='omzet'? `Rp ${fmtUF(yoy.variance)}` : fmtUF(yoy.variance)}`} badge={{text:isPos?'↑ Tumbuh':'↓ Turun',positive:isPos}} theme={theme}/>


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
            <div style={{borderRadius:12,padding:'10px 12px',background:t.cardbg,border:`1px solid ${t.borderCard}`,display:'flex',alignItems:'center',gap:10,overflow:'hidden',position:'relative',minWidth:0}}>
              <div style={{position:'absolute',top:0,left:12,right:12,height:2,borderRadius:'0 0 2px 2px',background:`linear-gradient(90deg,${achColor}55,${achColor}22)`}}/>
              <div style={{position:'relative',flexShrink:0,width:128,height:128}}>
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                  <div style={{fontSize:16,fontWeight:800,color:achColor,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{achPct}%</div>
                  <div style={{fontSize:7,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.04em',marginTop:2}}>ach.</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={pieAchKpi} cx="50%" cy="50%" innerRadius="38%" outerRadius="82%" dataKey="value" paddingAngle={2} strokeWidth={0} startAngle={90} endAngle={-270}>
                      {pieAchKpi.map((entry,i)=><Cell key={i} fill={entry.fill}/>)}
                    </Pie>
                    <Tooltip content={({active,payload})=>{
                      if (!active||!payload?.length) return null;
                      const d=payload[0].payload;
                      return <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:6,padding:'4px 8px',fontSize:9,fontFamily:'IBM Plex Mono,monospace'}}><div style={{fontWeight:700,color:t.textSub}}>{d.name}</div><div style={{color:t.text}}>{fmtU(d.value)} {unitLabel}</div></div>;
                    }}/>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div style={{width:1,height:60,background:t.border,flexShrink:0}}/>
              <div style={{display:'flex',flexDirection:'column',gap:0,flex:1,minWidth:0}}>
                <div style={{fontSize:8,fontWeight:700,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:7}}>Achievement {cL}</div>
                {qDataComputed.map((q:any,i:number)=>{
                  const pct=q.t>0?Math.min(100,Math.round((q.a/q.t)*100)):0;
                  const clr=pct>=100?'#10b981':pct>=80?'#f59e0b':'#ef4444';
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:i<qDataComputed.length-1?6:0}}>
                      <span style={{width:20,fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:clr,flexShrink:0}}>{q.n}</span>
                      <div style={{flex:1,height:4,borderRadius:2,background:t.borderCard,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${pct}%`,background:clr,borderRadius:2,transition:'width 0.5s ease'}}/>
                      </div>
                      <span style={{width:32,textAlign:'right',fontSize:9,fontWeight:700,fontFamily:'IBM Plex Mono,monospace',color:clr,flexShrink:0}}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <div style={{width:1,height:60,background:t.border,flexShrink:0}}/>
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
        <div style={{display:'flex',flexDirection:'column',gap:GAP,minHeight:0,overflow:'hidden'}}>
          <Card theme={theme} accent="#3b82f6" title={`Mingguan — ${pL} vs ${cL}`} icon={<Calendar size={10} color="#3b82f6"/>} color="#3b82f6" sub={`${posW}/${wc.length} minggu positif`} style={{flex:'1 1 0'}}>
            <ResponsiveContainer width="100%" height={cH}>
              <ComposedChart data={weekData} margin={{top:2,right:4,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={gs} vertical={false}/>
                <XAxis dataKey="w" tick={ts} axisLine={false} tickLine={false} interval={5}/>
                <YAxis yAxisId="l" tickFormatter={fmtK} tick={ts} axisLine={false} tickLine={false} width={32}/>
                <YAxis yAxisId="r" orientation="right" tickFormatter={v=>`${v.toFixed(0)}%`} tick={ts} axisLine={false} tickLine={false} width={26}/>
                <Tooltip content={<CT theme={theme}/>}/>
                <Bar yAxisId="l" dataKey="p" name={String(pL)} fill="#3b82f6" opacity={0.35} radius={[2,2,0,0]} maxBarSize={9}/>
                <Bar yAxisId="l" dataKey="c" name={String(cL)} fill="#10b981" opacity={0.7} radius={[2,2,0,0]} maxBarSize={9}/>
                <Line yAxisId="r" type="monotone" dataKey="g" name="Growth %" stroke="#f59e0b" strokeWidth={1.2} dot={false} strokeDasharray="3 2"/>
                <ReferenceLine yAxisId="r" y={0} stroke="rgba(239,68,68,0.3)" strokeWidth={1} strokeDasharray="3 3"/>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <div style={{display:'flex',gap:GAP,flex:'1 1 0',minHeight:0,overflow:'hidden'}}>
            <Card theme={theme} accent="#f59e0b" title="L4W vs C1W" icon={<Activity size={10} color="#f59e0b"/>} color="#f59e0b" sub={`L4w rata-rata vs c1w`} style={{flex:'1 1 0',minWidth:0,overflow:'hidden'}}>
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

        <div style={{display:'flex',flexDirection:'column',gap:GAP,minHeight:0,overflow:'hidden'}}>
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

          <Card theme={theme} accent="#8b5cf6" title={`Outlet Kontribusi ${cL}`} icon={<Store size={10} color="#8b5cf6"/>} color="#8b5cf6" sub={`${oTypes.length} tipe · ${fmtOutlet(totDoz)} ${unitLabel}`} style={{flex:'1 1 0'}}>
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
                        return <div style={{background:t.tooltipBg,border:`1px solid ${t.tooltipBorder}`,borderRadius:7,padding:'5px 9px',fontSize:10,fontFamily:'IBM Plex Mono,monospace'}}><div style={{color:d.fill,fontWeight:700}}>{d.n}</div><div style={{color:t.text}}>{fmtOutlet(d.v)} {unitLabel}</div><div style={{color:t.textMuted}}>{p}%</div></div>;
                      }}/>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none'}}>
                    <div style={{fontSize:11,fontWeight:800,color:t.text,fontFamily:'IBM Plex Mono,monospace',lineHeight:1}}>{fmtOutlet(totDoz)}</div>
                    <div style={{fontSize:7,color:t.textMuted,fontFamily:'IBM Plex Mono,monospace',letterSpacing:'0.05em'}}>{unitLabel.toUpperCase()}</div>
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

            <Card theme={theme} accent="#f97316" title="Top Produk" icon={<BarChart3 size={10} color="#f97316"/>} color="#f97316" sub={`${cL} · ${unitLabel}`} style={{flex:'1 1 0'}}>
              {topP.length>0 ? (
                <ResponsiveContainer width="100%" height={cH}>
                  <BarChart data={topP} layout="vertical" margin={{top:0,right:6,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gs} horizontal={false}/>
                    <XAxis type="number" tickFormatter={fmtOutlet} tick={ts} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="n" tick={{...ts,fontSize:8}} axisLine={false} tickLine={false} width={76}/>
                    <Tooltip content={<CT theme={theme}/>}/>
                    <Bar dataKey="v" name={unitLabel} radius={[0,3,3,0]} maxBarSize={14}>
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