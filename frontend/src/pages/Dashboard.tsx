import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type {
  AttendanceEvent,
  AttendanceStats,
  TrackingModule,
} from '../types';
import { useAttendanceFeed } from '../hooks/useSocket';
import {
  DIRECTION_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  formatTime,
} from '../lib/labels';

export function Dashboard() {
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [moduleId, setModuleId] = useState<string>('');
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const { events, connected, setEvents } = useAttendanceFeed(
    moduleId || undefined,
  );

  useEffect(() => {
    api
      .get<TrackingModule[]>('/tracking-modules')
      .then((res) => setModules(res.data));
  }, []);

  async function loadStats() {
    const res = await api.get<AttendanceStats>('/attendance/stats', {
      params: moduleId ? { moduleId } : {},
    });
    setStats(res.data);
  }

  async function loadHistory() {
    const res = await api.get<AttendanceEvent[]>('/attendance', {
      params: { ...(moduleId ? { moduleId } : {}), date: today() },
    });
    // L'API renvoie des entités ; on adapte au format d'affichage.
    setEvents(
      res.data.map((a: any) => ({
        id: a.id,
        personId: a.personId,
        personName: a.person?.fullName ?? '—',
        externalId: a.person?.externalId,
        moduleId: a.moduleId,
        moduleName: '',
        moduleType: a.person?.module?.type ?? 'EMPLOYEE',
        direction: a.direction,
        status: a.status,
        method: a.method,
        confidence: a.confidence,
        timestamp: a.timestamp,
      })),
    );
  }

  useEffect(() => {
    loadStats();
    loadHistory();
    // Rafraîchit les stats à chaque nouvel événement temps réel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  // Met à jour les compteurs quand un événement arrive en direct.
  useEffect(() => {
    if (events.length) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  // Filtre l'affichage si un module est sélectionné.
  const visible = moduleId
    ? events.filter((e) => e.moduleId === moduleId)
    : events;

  return (
    <div>
      <div className="page-head">
        <h1>📊 Tableau de bord</h1>
        <span className={connected ? 'dot online' : 'dot offline'}>
          {connected ? 'Temps réel actif' : 'Hors ligne'}
        </span>
      </div>

      <label className="inline">
        Module&nbsp;
        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          <option value="">Tous les modules</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <div className="stats">
        <StatCard label="Présents aujourd’hui" value={stats?.present ?? 0} />
        <StatCard label="Pointages" value={stats?.total ?? 0} />
        <StatCard label="Entrées" value={stats?.checkIns ?? 0} />
        <StatCard label="Sorties" value={stats?.checkOuts ?? 0} />
        <StatCard label="Retards" value={stats?.late ?? 0} danger />
      </div>

      <div className="card">
        <h3>Flux des pointages (en direct)</h3>
        <div className="feed">
          {visible.map((e) => (
            <div key={e.id} className="feed-item">
              <div className="feed-time">{formatTime(e.timestamp)}</div>
              <div className="feed-name">
                {e.personName}
                {e.externalId && (
                  <span className="muted small"> · {e.externalId}</span>
                )}
              </div>
              <span className="chip">{DIRECTION_LABEL[e.direction]}</span>
              <span
                className="badge sm"
                style={{ background: STATUS_COLOR[e.status] }}
              >
                {STATUS_LABEL[e.status]}
              </span>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="muted">Aucun pointage pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className={danger ? 'stat-value danger' : 'stat-value'}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
