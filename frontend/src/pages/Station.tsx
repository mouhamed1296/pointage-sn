import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type {
  AttendanceDirection,
  AttendanceEvent,
  Camera,
  TrackingModule,
} from '../types';
import { Webcam, WebcamHandle } from '../components/Webcam';
import { CameraView, CameraHandle } from '../components/CameraView';
import { useFaceModels, detectFaceSample } from '../hooks/useFaceApi';
import {
  LivenessDetector,
  LIVENESS_LABEL,
  LivenessHint,
} from '../lib/liveness';
import { DIRECTION_LABEL, STATUS_COLOR, STATUS_LABEL } from '../lib/labels';

type Mode = 'face-webcam' | 'face-camera' | 'badge' | 'code';

interface Result {
  ok: boolean;
  event?: AttendanceEvent;
  message?: string;
}

export function Station() {
  const [modules, setModules] = useState<TrackingModule[]>([]);
  const [moduleId, setModuleId] = useState('');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [cameraId, setCameraId] = useState('');
  const [mode, setMode] = useState<Mode>('face-webcam');
  const [direction, setDirection] = useState<AttendanceDirection | ''>('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [badgeInput, setBadgeInput] = useState('');

  const [livenessHint, setLivenessHint] = useState<LivenessHint | null>(null);

  const webcamRef = useRef<WebcamHandle>(null);
  const cameraRef = useRef<CameraHandle>(null);
  const { ready, error: modelError } = useFaceModels();
  const busyRef = useRef(false);
  const cooldownRef = useRef(0);
  const livenessRef = useRef(new LivenessDetector());

  useEffect(() => {
    api.get<TrackingModule[]>('/tracking-modules').then((res) => {
      const active = res.data.filter((m) => m.active);
      setModules(active);
      if (active.length) setModuleId(active[0].id);
    });
  }, []);

  // Charge les caméras FaceID du module sélectionné.
  useEffect(() => {
    if (!moduleId) return;
    api
      .get<Camera[]>('/cameras', { params: { moduleId } })
      .then((res) => {
        const cams = res.data.filter((c) => c.faceRecognition && c.active);
        setCameras(cams);
        setCameraId(cams[0]?.id ?? '');
      });
  }, [moduleId]);

  const isFaceMode = mode === 'face-webcam' || mode === 'face-camera';
  const selectedCamera = cameras.find((c) => c.id === cameraId);
  const selectedModule = modules.find((m) => m.id === moduleId);
  const requireLiveness = selectedModule?.config?.requireLiveness ?? false;

  function showResult(data: any) {
    setResult({ ok: true, event: data.attendance });
    cooldownRef.current = Date.now() + 4000;
    setLivenessHint(null);
    livenessRef.current.reset();
  }

  // Boucle de reconnaissance faciale (webcam ou caméra IP) + anti-spoofing.
  useEffect(() => {
    if (!running || !isFaceMode || !ready || !moduleId) return;
    livenessRef.current.reset();
    setLivenessHint(requireLiveness ? 'move' : null);

    const interval = setInterval(async () => {
      if (busyRef.current || Date.now() < cooldownRef.current) return;
      const el =
        mode === 'face-webcam'
          ? webcamRef.current?.video
          : cameraRef.current?.element;
      if (!el) return;
      busyRef.current = true;
      try {
        const sample = await detectFaceSample(el);
        if (!sample) return;

        // Anti-spoofing : exiger une preuve de vivacité avant de pointer.
        if (requireLiveness) {
          const { passed, hint } = livenessRef.current.update(sample);
          setLivenessHint(hint);
          if (!passed) return;
        }

        const res = await api.post('/attendance/recognize', {
          moduleId,
          descriptor: sample.descriptor,
          direction: direction || undefined,
          liveness: requireLiveness ? true : undefined,
        });
        showResult(res.data);
      } catch (e: any) {
        if (e.response?.status === 404) {
          setResult({ ok: false, message: 'Visage non reconnu' });
          cooldownRef.current = Date.now() + 1500;
          livenessRef.current.reset();
        }
      } finally {
        busyRef.current = false;
      }
    }, 700);
    return () => clearInterval(interval);
  }, [running, isFaceMode, mode, ready, moduleId, direction, requireLiveness]);

  async function submitIdentifier(
    method: 'BADGE' | 'CODE',
    identifier: string,
  ) {
    if (!identifier) return;
    try {
      const res = await api.post('/attendance/by-identifier', {
        moduleId,
        method,
        identifier,
        direction: direction || undefined,
      });
      showResult(res.data);
    } catch (e: any) {
      setResult({
        ok: false,
        message:
          e.response?.status === 404
            ? method === 'BADGE'
              ? 'Badge inconnu'
              : 'Code incorrect'
            : 'Erreur',
      });
    }
  }

  function onCode(e: FormEvent) {
    e.preventDefault();
    submitIdentifier('CODE', codeInput);
    setCodeInput('');
  }
  function onBadge(e: FormEvent) {
    e.preventDefault();
    submitIdentifier('BADGE', badgeInput);
    setBadgeInput('');
  }

  return (
    <div>
      <h1>📷 Borne de pointage</h1>

      <div className="tabs">
        {(
          [
            ['face-webcam', '🙂 FaceID (webcam)'],
            ['face-camera', '🎥 FaceID (caméra)'],
            ['badge', '🪪 Badge'],
            ['code', '🔢 Code'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            className={mode === m ? 'tab active' : 'tab'}
            onClick={() => {
              setMode(m);
              setRunning(false);
              setResult(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

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
        {mode === 'face-camera' && (
          <label className="inline">
            Caméra&nbsp;
            <select
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {isFaceMode && (
          <button
            className={running ? 'btn-ghost danger' : 'btn'}
            onClick={() => setRunning((r) => !r)}
            disabled={
              !ready ||
              !moduleId ||
              (mode === 'face-camera' && !selectedCamera)
            }
          >
            {running ? '⏹️ Arrêter' : '▶️ Démarrer'}
          </button>
        )}
      </div>

      {isFaceMode && modelError && <div className="error">{modelError}</div>}
      {isFaceMode && !ready && !modelError && (
        <div className="info">Chargement des modèles de reconnaissance…</div>
      )}

      <div className="grid-2">
        <div className="card station-cam">
          {mode === 'face-webcam' && <Webcam ref={webcamRef} />}
          {mode === 'face-camera' &&
            (selectedCamera ? (
              <CameraView ref={cameraRef} camera={selectedCamera} />
            ) : (
              <p className="muted">
                Aucune caméra FaceID pour ce module. Ajoutez-en une dans
                l’onglet Caméras (option « pointage par reconnaissance
                faciale »).
              </p>
            ))}
          {mode === 'badge' && (
            <form onSubmit={onBadge} className="form pad">
              <label>
                UID du badge
                <input
                  autoFocus
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  placeholder="Scannez ou saisissez l’UID"
                />
              </label>
              <button className="btn">Valider</button>
              <p className="muted small">
                En production, les badges sont lus par la borne ESP32. Ce champ
                permet les tests.
              </p>
            </form>
          )}
          {mode === 'code' && (
            <form onSubmit={onCode} className="form pad">
              <label>
                Code PIN
                <input
                  autoFocus
                  type="password"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Code à 4-12 chiffres"
                />
              </label>
              <button className="btn">Valider</button>
            </form>
          )}
          {running && isFaceMode && (
            <div className="scanning">
              {requireLiveness && livenessHint
                ? LIVENESS_LABEL[livenessHint]
                : '🔍 Détection en cours…'}
            </div>
          )}
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
              {result.event.method === 'FACE' && (
                <div className="muted small">
                  Confiance : {(result.event.confidence * 100).toFixed(0)}%
                </div>
              )}
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
