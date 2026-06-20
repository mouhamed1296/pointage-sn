import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ModuleType, TrackingModule } from '../types';
import { MODULE_TYPE_LABEL } from '../lib/labels';
import { useAuth } from '../context/AuthContext';

const EMPTY = {
  name: '',
  type: 'EMPLOYEE' as ModuleType,
  description: '',
  startTime: '08:00',
  endTime: '17:00',
  lateAfterMinutes: 5,
  requireCheckout: true,
  faceMatchThreshold: 0.55,
  requireLiveness: false,
};

export function Modules() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await api.get<TrackingModule[]>('/tracking-modules');
    setModules(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm({ ...EMPTY });
    setEditingId(null);
  }

  function editModule(m: TrackingModule) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      type: m.type,
      description: m.description ?? '',
      startTime: m.config?.startTime ?? '08:00',
      endTime: m.config?.endTime ?? '17:00',
      lateAfterMinutes: m.config?.lateAfterMinutes ?? 5,
      requireCheckout: m.config?.requireCheckout ?? true,
      faceMatchThreshold: m.config?.faceMatchThreshold ?? 0.55,
      requireLiveness: m.config?.requireLiveness ?? false,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      type: form.type,
      description: form.description,
      config: {
        startTime: form.startTime,
        endTime: form.endTime,
        lateAfterMinutes: Number(form.lateAfterMinutes),
        requireCheckout: form.requireCheckout,
        faceMatchThreshold: Number(form.faceMatchThreshold),
        requireLiveness: form.requireLiveness,
      },
    };
    try {
      if (editingId) {
        await api.patch(`/tracking-modules/${editingId}`, payload);
      } else {
        await api.post('/tracking-modules', payload);
      }
      resetForm();
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de l’enregistrement');
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce module et toutes ses données ?')) return;
    await api.delete(`/tracking-modules/${id}`);
    load();
  }

  return (
    <div>
      <h1>🗂️ Modules de pointage</h1>
      <p className="muted">
        Chaque module est configurable selon son contexte (employés, étudiants,
        événement), avec ses propres horaires et règles.
      </p>

      <div className="grid-2">
        <div className="card">
          <h3>{editingId ? 'Modifier le module' : 'Nouveau module'}</h3>
          {!isAdmin && (
            <p className="muted">
              Seuls les administrateurs peuvent créer ou modifier des modules.
            </p>
          )}
          <form onSubmit={onSubmit} className="form">
            <label>
              Nom
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={!isAdmin}
              />
            </label>
            <label>
              Type
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ModuleType })
                }
                disabled={!isAdmin}
              >
                {(['EMPLOYEE', 'STUDENT', 'EVENT'] as ModuleType[]).map((t) => (
                  <option key={t} value={t}>
                    {MODULE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Description
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                disabled={!isAdmin}
              />
            </label>
            {form.type !== 'EVENT' && (
              <div className="row">
                <label>
                  Heure d’arrivée
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    disabled={!isAdmin}
                  />
                </label>
                <label>
                  Tolérance retard (min)
                  <input
                    type="number"
                    min={0}
                    value={form.lateAfterMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lateAfterMinutes: Number(e.target.value),
                      })
                    }
                    disabled={!isAdmin}
                  />
                </label>
              </div>
            )}
            {form.type !== 'EVENT' && (
              <div className="row">
                <label>
                  Heure de départ
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                    disabled={!isAdmin}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.requireCheckout}
                    onChange={(e) =>
                      setForm({ ...form, requireCheckout: e.target.checked })
                    }
                    disabled={!isAdmin}
                  />
                  Exiger un pointage de sortie
                </label>
              </div>
            )}
            <label>
              Seuil de correspondance faciale ({form.faceMatchThreshold})
              <input
                type="range"
                min={0.4}
                max={0.7}
                step={0.01}
                value={form.faceMatchThreshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    faceMatchThreshold: Number(e.target.value),
                  })
                }
                disabled={!isAdmin}
              />
              <small className="muted">
                Plus bas = plus strict (moins de faux positifs).
              </small>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.requireLiveness}
                onChange={(e) =>
                  setForm({ ...form, requireLiveness: e.target.checked })
                }
                disabled={!isAdmin}
              />
              🛡️ Anti-spoofing : exiger une preuve de vivacité (FaceID)
            </label>
            {error && <div className="error">{error}</div>}
            <div className="row">
              <button className="btn" disabled={!isAdmin}>
                {editingId ? 'Enregistrer' : 'Créer le module'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={resetForm}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Modules existants ({modules.length})</h3>
          <div className="list">
            {modules.map((m) => (
              <div key={m.id} className="list-item">
                <div>
                  <strong>{m.name}</strong>
                  <span className="tag">{MODULE_TYPE_LABEL[m.type]}</span>
                  {!m.active && <span className="tag muted">inactif</span>}
                  {m.description && (
                    <div className="muted small">{m.description}</div>
                  )}
                </div>
                {isAdmin && (
                  <div className="row">
                    <button
                      className="btn-ghost"
                      onClick={() => editModule(m)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-ghost danger"
                      onClick={() => remove(m.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            {modules.length === 0 && (
              <p className="muted">Aucun module pour l’instant.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
