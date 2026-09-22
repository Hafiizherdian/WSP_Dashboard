'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, Globe2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaConfig, defaultAreas } from '@/lib/areaConfig';
import { RegionConfig } from '@/lib/regionConfig';

type Theme = 'dark' | 'light';

function tk(theme: Theme) {
  const d = theme === 'dark';
  return {
    card: d ? '#0c0d16' : '#fff', cardAlt: d ? '#10111e' : '#f8f9fc',
    line: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    input: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    inputBd: d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.13)',
    tx1: d ? 'rgba(255,255,255,0.9)' : '#0f172a',
    tx2: d ? 'rgba(255,255,255,0.55)' : '#475569',
    tx3: d ? 'rgba(255,255,255,0.32)' : '#94a3b8',
    amber: d ? '#fbbf24' : '#92400e', amberBg: d ? 'rgba(234,179,8,0.08)' : '#fffbeb', amberBd: d ? 'rgba(234,179,8,0.22)' : '#fcd34d',
    red: d ? '#f87171' : '#b91c1c', redBg: d ? 'rgba(239,68,68,0.08)' : '#fef2f2', redBd: d ? 'rgba(239,68,68,0.22)' : '#fecaca',
  };
}

interface Props { theme: Theme; }

export default function RegionManagement({ theme }: Props) {
  const t = tk(theme);
  const [areas, setAreas] = useState<AreaConfig[]>(defaultAreas);
  const [regions, setRegions] = useState<RegionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RegionConfig | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const loadAreas = useCallback(async () => {
    try {
      const r = await fetch('/api/areas');
      const j = await r.json();
      if (j.success) setAreas(j.data?.areas ?? defaultAreas);
    } catch { setAreas(defaultAreas); }
  }, []);

  const loadRegions = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/regions');
      const j = await r.json();
      if (j.success) setRegions(j.data?.regions ?? []);
      else showToast(j.error || 'Gagal memuat regional', false);
    } catch { showToast('Gagal memuat regional', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAreas(); loadRegions(); }, [loadAreas, loadRegions]);

  const save = async (payload: Partial<RegionConfig>) => {
    try {
      const r = await fetch('/api/regions', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || 'Gagal');
      showToast(editing ? 'Regional diperbarui' : 'Regional dibuat');
      setShowForm(false); setEditing(null);
      await loadRegions();
    } catch (e: any) { showToast(`Gagal: ${e.message}`, false); }
  };

  const del = async (id: string) => {
    try {
      const r = await fetch(`/api/regions?id=${id}`, { method: 'DELETE' });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || 'Gagal');
      showToast('Regional dihapus');
      await loadRegions();
    } catch (e: any) { showToast(`Gagal: ${e.message}`, false); }
    setDelId(null);
  };

  return (
    <div>
      {toast && (
        <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, background: toast.ok ? t.amberBg : t.redBg, color: toast.ok ? t.amber : t.red, border: `1px solid ${toast.ok ? t.amberBd : t.redBd}` }}>
          {toast.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />} {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe2 size={14} color={t.amber} />
          <span style={{ fontSize: 13, fontWeight: 700, color: t.tx1 }}>Regional</span>
          <span style={{ fontSize: 11, color: t.tx3, fontFamily: 'monospace' }}>{regions.length} regional</span>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={12} /> Tambah Regional
        </button>
      </div>

      {(showForm || editing) && (
        <RegionForm theme={theme} areas={areas} editing={editing}
          onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      {delId && (
        <div style={{ padding: 12, borderRadius: 8, background: t.redBg, border: `1px solid ${t.redBd}`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: t.red, flex: 1, minWidth: 200 }}>Hapus regional <strong>{delId}</strong>? Area anggotanya tidak ikut terhapus.</span>
          <button onClick={() => del(delId)} style={{ padding: '5px 12px', borderRadius: 5, background: '#dc2626', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Hapus</button>
          <button onClick={() => setDelId(null)} style={{ padding: '5px 12px', borderRadius: 5, background: t.input, color: t.tx2, border: `1px solid ${t.inputBd}`, fontSize: 11, cursor: 'pointer' }}>Batal</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: t.tx3, fontSize: 12 }}>Memuat…</div>
        ) : regions.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: t.tx3, fontSize: 12 }}>Belum ada regional dibuat.</div>
        ) : regions.map(r => (
          <div key={r.id} style={{ padding: '10px 14px', borderRadius: 8, background: t.cardAlt, border: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Globe2 size={13} color={t.amber} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.tx1 }}>{r.name}</div>
              <div style={{ fontSize: 10.5, color: t.tx3, marginTop: 2 }}>
                {r.areaIds.length} area: {r.areaIds.map(id => areas.find(a => a.id === id)?.name ?? id).join(', ') || '—'}
              </div>
            </div>
            <button onClick={() => setEditing(r)} style={{ width: 26, height: 26, borderRadius: 5, background: t.input, border: `1px solid ${t.inputBd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={11} color={t.tx2} /></button>
            <button onClick={() => setDelId(r.id)} style={{ width: 26, height: 26, borderRadius: 5, background: t.redBg, border: `1px solid ${t.redBd}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={11} color={t.red} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionForm({ theme, areas, editing, onSave, onCancel }: {
  theme: Theme; areas: AreaConfig[]; editing: RegionConfig | null;
  onSave: (p: Partial<RegionConfig>) => void; onCancel: () => void;
}) {
  const t = tk(theme);
  const [name, setName] = useState(editing?.name ?? '');
  const [sel, setSel] = useState<Set<string>>(new Set(editing?.areaIds ?? []));

  const toggle = (id: string) => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ padding: 14, borderRadius: 8, background: t.card, border: `1px solid ${t.line}`, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama regional, mis. Regional Jawa Timur"
        style={{ padding: '8px 11px', borderRadius: 6, fontSize: 13, background: t.input, border: `1px solid ${t.inputBd}`, color: t.tx1 }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.tx3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Area Anggota</div>
      <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${t.inputBd}`, borderRadius: 6 }}>
        {areas.map((a, i) => {
          const isSel = sel.has(a.id);
          return (
            <div key={a.id} onClick={() => toggle(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', cursor: 'pointer', background: isSel ? t.amberBg : 'transparent', borderTop: i > 0 ? `1px solid ${t.line}` : 'none' }}>
              <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${isSel ? t.amber : t.inputBd}`, background: isSel ? t.amber : 'transparent' }} />
              <span style={{ fontSize: 12, color: t.tx1 }}>{a.name || a.id}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 6, background: t.input, border: `1px solid ${t.inputBd}`, color: t.tx2, fontSize: 12, cursor: 'pointer' }}>Batal</button>
        <button onClick={() => onSave({ name, areaIds: [...sel] })} disabled={!name.trim() || sel.size === 0}
          style={{ padding: '7px 16px', borderRadius: 6, background: '#6366f1', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: (!name.trim() || sel.size === 0) ? 0.5 : 1 }}>
          <Save size={11} /> Simpan
        </button>
      </div>
    </div>
  );
}