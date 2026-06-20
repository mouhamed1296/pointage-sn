import type { FaceSample } from '../hooks/useFaceApi';

/**
 * Détecteur de vivacité (anti-spoofing) basé sur un défi actif :
 * - clignement des yeux (l'EAR chute sous un seuil puis remonte)
 * - léger mouvement de la tête (déplacement horizontal du visage)
 *
 * Une photo ou un écran statique ne produit ni clignement ni mouvement
 * naturel, ce qui permet de rejeter les tentatives basiques d'usurpation.
 */
const EAR_CLOSED = 0.21; // yeux fermés en dessous
const EAR_OPEN = 0.28; // yeux ouverts au-dessus
const MOVE_THRESHOLD = 18; // px de déplacement du centre du visage

export type LivenessHint = 'blink' | 'move' | 'done';

export class LivenessDetector {
  private eyesWereClosed = false;
  private blinked = false;
  private moved = false;
  private baselineX: number | null = null;

  reset() {
    this.eyesWereClosed = false;
    this.blinked = false;
    this.moved = false;
    this.baselineX = null;
  }

  /** Met à jour l'état avec un échantillon ; renvoie l'état de vivacité. */
  update(sample: FaceSample): { passed: boolean; hint: LivenessHint } {
    // Clignement : transition fermé -> ouvert.
    if (sample.ear < EAR_CLOSED) {
      this.eyesWereClosed = true;
    } else if (sample.ear > EAR_OPEN && this.eyesWereClosed) {
      this.blinked = true;
      this.eyesWereClosed = false;
    }

    // Mouvement horizontal de la tête.
    if (this.baselineX === null) {
      this.baselineX = sample.center.x;
    } else if (Math.abs(sample.center.x - this.baselineX) > MOVE_THRESHOLD) {
      this.moved = true;
    }

    // Vivacité validée si au moins un clignement OU un mouvement.
    const passed = this.blinked || this.moved;
    const hint: LivenessHint = passed
      ? 'done'
      : this.baselineX === null
        ? 'move'
        : 'blink';
    return { passed, hint };
  }
}

export const LIVENESS_LABEL: Record<LivenessHint, string> = {
  blink: '👁️ Clignez des yeux pour confirmer',
  move: '↔️ Bougez légèrement la tête',
  done: '✅ Vivacité confirmée',
};
