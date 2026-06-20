import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { Person, TrackingModule } from '../types';
import { Webcam, WebcamHandle } from '../components/Webcam';
import { useFaceModels, detectDescriptor } from '../hooks/useFaceApi';

export function Persons() {
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [moduleId, setModuleId] = useState<string>('');
  const [persons, setPersons] = useState<Person[]>([]);

  const [fullName, setFullName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [email, setEmail] = useState('');
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const webcamRef = useRef<WebcamHandle>(null);
  const { ready, error: modelError } = useFaceModels();

  useEffect(() => {
    api.get<TrackingModule[]>('/tracking-modules').then((res) => {
      setModules(res.data);
      if (res.data.length && !moduleId) setModuleId(res.data[0].id);
    });
  }, []);

  async function loadPersons(id: string) {
    if (!id) return;
    const res = await api.get<Person[]>('/persons', {
      params: { moduleId: id },
    });
    setPersons(res.data);
  }

  useEffect(() => {
    loadPersons(moduleId);
  }, [moduleId]);

  async function capture() {
    setMessage(null);
    const video = webcamRef.current?.video;
    if (!video) return;
    setCapturing(true);
    try {
      const desc = await detectDescriptor(video);
      if (!desc) {
        setMessage('Aucun visage détecté. Repositionnez-vous face caméra.');
        setDescriptor(null);
      } else {
        setDescriptor(desc);
        setMessage('✅ Visage capturé.');
      }
    } finally {
      setCapturing(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post('/persons', {
        moduleId,
        fullName,
        externalId: externalId || undefined,
        email: email || undefined,
        faceDescriptor: descriptor || undefined,
      });
      setFullName('');
      setExternalId('');
      setEmail('');
      setDescriptor(null);
      setMessage('✅ Personne enregistrée.');
      loadPersons(moduleId);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Erreur lors de l’enregistrement');
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette personne ?')) return;
    await api.delete(`/persons/${id}`);
    loadPersons(moduleId);
  }

  return (
    <div>
      <h1>👥 Personnes</h1>
      <label className="inline">
        Module&nbsp;
        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid-2">
        <div className="card">
          <h3>Enrôler une personne</h3>
          <Webcam ref={webcamRef} />
          {modelError && <div className="error">{modelError}</div>}
          <button
            type="button"
            className="btn-ghost"
            onClick={capture}
            disabled={!ready || capturing}
          >
            {ready
              ? capturing
                ? 'Capture…'
                : '📸 Capturer le visage'
              : 'Chargement des modèles…'}
          </button>
          <form onSubmit={onSubmit} className="form">
            <label>
              Nom complet
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
            <label>
              Identifiant (matricule / n° étudiant / billet)
              <input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <div className="muted small">
              {descriptor
                ? '🟢 Donnée biométrique prête'
                : '⚪ Aucun visage capturé (la personne ne pourra pas pointer par reconnaissance faciale)'}
            </div>
            {message && <div className="info">{message}</div>}
            <button className="btn" disabled={!moduleId}>
              Enregistrer
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Inscrits ({persons.length})</h3>
          <div className="list">
            {persons.map((p) => (
              <div key={p.id} className="list-item">
                <div>
                  <strong>{p.fullName}</strong>
                  {p.externalId && <span className="tag">{p.externalId}</span>}
                  <span
                    className="tag"
                    style={{
                      background: p.faceDescriptor ? '#dcfce7' : '#f1f5f9',
                    }}
                  >
                    {p.faceDescriptor ? '🟢 biométrie' : '⚪ sans visage'}
                  </span>
                </div>
                <button
                  className="btn-ghost danger"
                  onClick={() => remove(p.id)}
                >
                  🗑️
                </button>
              </div>
            ))}
            {persons.length === 0 && (
              <p className="muted">Aucune personne dans ce module.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
