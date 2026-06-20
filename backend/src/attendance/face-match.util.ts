/**
 * Utilitaires de comparaison de descripteurs faciaux.
 * Un descripteur est un vecteur de 128 flottants produit par face-api.js.
 * La distance euclidienne entre deux descripteurs mesure leur ressemblance :
 * plus elle est faible, plus les visages se ressemblent.
 */

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export interface FaceMatch<T> {
  candidate: T;
  distance: number;
}

/**
 * Trouve, parmi une liste de candidats enrôlés, celui dont le descripteur est
 * le plus proche du descripteur fourni, sous réserve de respecter le seuil.
 */
export function findBestMatch<T extends { faceDescriptor: number[] | null }>(
  descriptor: number[],
  candidates: T[],
  threshold: number,
): FaceMatch<T> | null {
  let best: FaceMatch<T> | null = null;
  for (const candidate of candidates) {
    if (!candidate.faceDescriptor || candidate.faceDescriptor.length === 0) {
      continue;
    }
    const distance = euclideanDistance(descriptor, candidate.faceDescriptor);
    if (best === null || distance < best.distance) {
      best = { candidate, distance };
    }
  }
  if (best && best.distance <= threshold) {
    return best;
  }
  return null;
}
