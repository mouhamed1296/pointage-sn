import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type {
  AttendanceDirection,
  AttendanceEvent,
  TrackingModule,
} from '../types';
import { Webcam, WebcamHandle } from '../components/Webcam';
import { useFaceModels, detectDescriptor } from '../hooks/useFaceApi';
import { DIRECTION_LABEL, STATUS_COLOR, STATUS_LABEL } from '../lib/labels';

interface Result {
  ok: boolean;
  event?: AttendanceEvent;
  message?: string;
}

export function Station() {
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [moduleId, setModuleId] = useState('');
  const [direction, setDirection] = useState<AttendanceDirection | ''>('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const webcamRef = useRef<WebcamHandle>(null);
  const { ready, error: modelError } = useFaceModels();
  const busyRef = useRef(false);
  const cooldownRef = useRef(0);

  useEffect(() => {
    api.get<TrackingModule[]>('/tracking-modules').then((res) => {
      setModules(res.data.filter((m) => m.active));
      if (res.data.length) setModuleId(res.data[0].id);
    });
  }, []);

  // Boucle de détection automatique toutes les ~1,5 s.
  useEffect(() => {
    if (!running || !ready || !moduleId) return;
    const interval = setInterval(async () => {
      if (busyRef.current || Date.now() < cooldownRef.current) return;
      const video = webcamRef.current?.video;
      if (!video) return;
      busyRef.current = true;
      try {
        const descriptor = await detectDescriptor(video);
        if (!descriptor) return;
        const res = await api.post('/attendance/recognize', {
          moduleId,
          descriptor,
          direction: direction || undefined,
        });
        setResult({ ok: true, event: res.data.attendance });
        // Pause de 4 s après un pointage réussi pour éviter les doublons.
        cooldownRef.current = Date.now() + 4000;
      } catch (e: any) {
        if (e.response?.status === 404) {
          setResult({ ok: false, message: 'Visage non reconnu' });
          cooldownRef.current = Date.now() + 1500;
        }
      } finally {
        busyRef.current = false;
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [running, ready, moduleId, direction]);

  return (
    <div>
      <h1>📷 Borne de pointage</h1>
      <p className="muted">
        Présentez votre visage face à la caméra : le pointage est automatique.
      </p>

      <div className="station-controls">
        <label className="inline">
          Module&nbsp;
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
        <label className="inline">
          Sens&nbsp;
          <select
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as AttendanceDirection | '')
            }
          >
            <option value="">Automatique</option>
            <option value="IN">Entrée</option>
            <option value="OUT">Sortie</option>
          </select>
        </label>
        <button
          className={running ? 'btn-ghost danger' : 'btn'}
          onClick={() => setRunning((r) => !r)}
          disabled={!ready || !moduleId}
        >
          {running ? '⏹️ Arrêter' : '▶️ Démarrer la borne'}
        </button>
      </div>

      {modelError && <div className="error">{modelError}</div>}
      {!ready && !modelError && (
        <div className="info">Chargement des modèles de reconnaissance…</div>
      )}

      <div className="grid-2">
        <div className="card station-cam">
          <Webcam ref={webcamRef} />
          {running && <div className="scanning">🔍 Détection en cours…</div>}
        </div>

        <div className="card">
          <h3>Dernier pointage</h3>
          {!result && <p className="muted">En attente…</p>}
          {result?.ok && result.event && (
            <div className="result-ok">
              <div className="result-name">{result.event.personName}</div>
              {result.event.externalId && (
                <div className="muted">{result.event.externalId}</div>
              )}
              <div
                className="badge"
                style={{ background: STATUS_COLOR[result.event.status] }}
              >
                {DIRECTION_LABEL[result.event.direction]} —{' '}
                {STATUS_LABEL[result.event.status]}
              </div>
              <div className="muted small">
                Confiance : {(result.event.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}
          {result && !result.ok && (
            <div className="result-ko">❌ {result.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
