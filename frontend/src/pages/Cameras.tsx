import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Camera, CameraStreamType, TrackingModule } from '../types';
import { CameraView } from '../components/CameraView';
import { CAMERA_TYPE_LABEL } from '../lib/labels';
import { useAuth } from '../context/AuthContext';

const EMPTY = {
  name: '',
  streamUrl: '',
  streamType: 'MJPEG' as CameraStreamType,
  location: '',
  faceRecognition: false,
  moduleId: '',
};

export function Cameras() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [c, m] = await Promise.all([
      api.get<Camera[]>('/cameras'),
      api.get<TrackingModule[]>('/tracking-modules'),
    ]);
    setCameras(c.data);
    setModules(m.data);
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    setForm({ ...EMPTY });
    setEditingId(null);
    setShowForm(false);
  }

  function edit(cam: Camera) {
    setEditingId(cam.id);
    setShowForm(true);
    setForm({
      name: cam.name,
      streamUrl: cam.streamUrl,
      streamType: cam.streamType,
      location: cam.location ?? '',
      faceRecognition: cam.faceRecognition,
      moduleId: cam.moduleId ?? '',
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      moduleId: form.moduleId || undefined,
    };
    try {
      if (editingId) await api.patch(`/cameras/${editingId}`, payload);
      else await api.post('/cameras', payload);
      reset();
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de l’enregistrement');
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette caméra ?')) return;
    await api.delete(`/cameras/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h1>🎥 Caméras en temps réel</h1>
        {isAdmin && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Fermer' : '+ Ajouter une caméra'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <div className="card">
          <h3>{editingId ? 'Modifier la caméra' : 'Nouvelle caméra'}</h3>
          <form onSubmit={onSubmit} className="form">
            <div className="row">
              <label>
                Nom
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Emplacement
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              URL du flux
              <input
                placeholder="http://192.168.1.50:81/stream"
                value={form.streamUrl}
                onChange={(e) =>
                  setForm({ ...form, streamUrl: e.target.value })
                }
                required
              />
            </label>
            <div className="row">
              <label>
                Type de flux
                <select
                  value={form.streamType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      streamType: e.target.value as CameraStreamType,
                    })
                  }
                >
                  {(['MJPEG', 'HLS', 'WEBRTC'] as CameraStreamType[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {CAMERA_TYPE_LABEL[t]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Module (FaceID)
                <select
                  value={form.moduleId}
                  onChange={(e) =>
                    setForm({ ...form, moduleId: e.target.value })
                  }
                >
                  <option value="">Aucun</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.faceRecognition}
                onChange={(e) =>
                  setForm({ ...form, faceRecognition: e.target.checked })
                }
              />
              Utiliser pour le pointage par reconnaissance faciale
            </label>
            {error && <div className="error">{error}</div>}
            <div className="row">
              <button className="btn">
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button type="button" className="btn-ghost" onClick={reset}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="camera-grid">
        {cameras.map((cam) => (
          <div key={cam.id} className="card camera-card">
            <CameraView camera={cam} />
            <div className="camera-meta">
              <div>
                <strong>{cam.name}</strong>
                {cam.location && (
                  <span className="muted small"> · {cam.location}</span>
                )}
                <div>
                  <span className="tag">{CAMERA_TYPE_LABEL[cam.streamType]}</span>
                  {cam.faceRecognition && (
                    <span className="tag">FaceID</span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="row">
                  <button className="btn-ghost" onClick={() => edit(cam)}>
                    ✏️
                  </button>
                  <button
                    className="btn-ghost danger"
                    onClick={() => remove(cam.id)}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {cameras.length === 0 && (
          <p className="muted">Aucune caméra configurée.</p>
        )}
      </div>
    </div>
  );
}
