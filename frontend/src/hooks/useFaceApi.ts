import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  if (!loadingPromise) {
    loadingPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      modelsLoaded = true;
    });
  }
  return loadingPromise;
}

/** Charge les modèles une seule fois et indique l'état de chargement. */
export function useFaceModels() {
  const [ready, setReady] = useState(modelsLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadModels()
      .then(() => mounted && setReady(true))
      .catch((e) => {
        console.error(e);
        if (mounted)
          setError(
            "Impossible de charger les modèles de reconnaissance faciale. " +
              "Avez-vous lancé `npm run download-models` ?",
          );
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { ready, error };
}

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5,
});

/**
 * Détecte le visage le plus proéminent dans l'élément vidéo et renvoie son
 * descripteur (128 flottants), ou null si aucun visage n'est détecté.
 */
export async function detectDescriptor(
  input: HTMLVideoElement | HTMLImageElement,
): Promise<number[] | null> {
  const result = await faceapi
    .detectSingleFace(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!result) return null;
  return Array.from(result.descriptor);
}

export interface FaceSample {
  descriptor: number[];
  /** Eye Aspect Ratio moyen (sert à la détection de clignement). */
  ear: number;
  /** Centre du visage normalisé (sert à la détection de mouvement). */
  center: { x: number; y: number };
}

// Distance euclidienne 2D.
function dist(a: faceapi.Point, b: faceapi.Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Eye Aspect Ratio à partir des 6 points d'un œil.
function eyeAspectRatio(eye: faceapi.Point[]): number {
  const a = dist(eye[1], eye[5]);
  const b = dist(eye[2], eye[4]);
  const c = dist(eye[0], eye[3]);
  return c === 0 ? 0 : (a + b) / (2 * c);
}

/**
 * Détection enrichie : descripteur + EAR + position, nécessaire à
 * l'anti-spoofing (vivacité par clignement / mouvement).
 */
export async function detectFaceSample(
  input: HTMLVideoElement | HTMLImageElement,
): Promise<FaceSample | null> {
  const result = await faceapi
    .detectSingleFace(input, detectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!result) return null;

  const lm = result.landmarks;
  const ear = (eyeAspectRatio(lm.getLeftEye()) +
    eyeAspectRatio(lm.getRightEye())) / 2;
  const box = result.detection.box;
  return {
    descriptor: Array.from(result.descriptor),
    ear,
    center: {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    },
  };
}
