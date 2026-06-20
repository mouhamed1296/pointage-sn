import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Device, TrackingModule } from '../types';
import { useDeviceStatus } from '../hooks/useSocket';
import { formatTime } from '../lib/labels';
import { useAuth } from '../context/AuthContext';

export function Devices() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [devices, setDevices] = useState<Device[]>([]);
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [newKey, setNewKey] = useState<{ id: string; key: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const { statuses, alerts } = useDeviceStatus();

  async function load() {
    const [d, m] = await Promise.all([
      api.get<Device[]>('/devices'),
      api.get<TrackingModule[]>('/tracking-modules'),
    ]);
    setDevices(d.data);
    setModules(m.data);
    if (m.data.length && !moduleId) setModuleId(m.data[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  // Fusionne le statut temps réel avec la liste chargée.
  function isOnline(d: Device): boolean {
    const live = statuses.find((s) => s.id === d.id);
    return live ? live.online : d.online;
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/devices', { name, location, moduleId });
      setNewKey({ id: res.data.device.id, key: res.data.apiKey });
      setName('');
      setLocation('');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur');
    }
  }

  async function regenerate(id: string) {
    if (!confirm('Régénérer la clé ? L’ancienne cessera de fonctionner.')) return;
    const res = await api.post(`/devices/${id}/regenerate-key`);
    setNewKey({ id, key: res.data.apiKey });
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette borne ?')) return;
    await api.delete(`/devices/${id}`);
    load();
  }

  return (
    <div>
      <h1>🖥️ Bornes de pointage</h1>
      <p className="muted">
        Bornes ESP32 (badge, empreinte, code). Supervision en temps réel 24h/24.
      </p>

      {newKey && (
        <div className="card key-reveal">
          <strong>🔑 Clé API de la borne (à copier maintenant) :</strong>
          <code>X-Device-Id: {newKey.id}</code>
          <code>X-Device-Key: {newKey.key}</code>
          <p className="muted small">
            Renseignez ces valeurs dans <code>firmware/src/config.h</code>. La
            clé ne sera plus affichée.
          </p>
          <button className="btn-ghost" onClick={() => setNewKey(null)}>
            J’ai copié
          </button>
        </div>
      )}

      <div className="grid-2">
        {isAdmin && (
          <div className="card">
            <h3>Enregistrer une borne</h3>
            <form onSubmit={create} className="form">
              <label>
                Nom
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label>
                Emplacement
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>
              <label>
                Module rattaché
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              {error && <div className="error">{error}</div>}
              <button className="btn" disabled={!moduleId}>
                Créer la borne
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Bornes ({devices.length})</h3>
          <div className="list">
            {devices.map((d) => (
              <div key={d.id} className="list-item">
                <div>
                  <span
                    className={isOnline(d) ? 'dot online' : 'dot offline'}
                    style={{ marginRight: 8 }}
                  >
                    {isOnline(d) ? 'en ligne' : 'hors ligne'}
                  </span>
                  <strong>{d.name}</strong>
                  {d.location && (
                    <span className="muted small"> · {d.location}</span>
                  )}
                  {d.firmwareVersion && (
                    <span className="tag">v{d.firmwareVersion}</span>
                  )}
                </div>
                {isAdmin && (
                  <div className="row">
                    <button
                      className="btn-ghost"
                      title="Régénérer la clé"
                      onClick={() => regenerate(d.id)}
                    >
                      🔑
                    </button>
                    <button
                      className="btn-ghost danger"
                      onClick={() => remove(d.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            {devices.length === 0 && (
              <p className="muted">Aucune borne enregistrée.</p>
            )}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card">
          <h3>Alertes récentes</h3>
          <div className="list">
            {alerts.map((a, i) => (
              <div key={i} className="feed-item">
                <span className="feed-time">{formatTime(a.at)}</span>
                <span className="feed-name">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
