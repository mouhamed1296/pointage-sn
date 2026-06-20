import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';

/**
 * Reconnaissance faciale côté serveur — utilisée par les bornes ESP32-CAM qui
 * envoient des images JPEG (le calcul du descripteur 128-D s'y fait au serveur).
 *
 * Les dépendances lourdes (@vladmandic/face-api, @tensorflow/tfjs-node, canvas)
 * sont OPTIONNELLES : si elles ne sont pas installées, le service se signale
 * comme indisponible et l'endpoint renvoie une erreur explicite — le reste de
 * l'application continue de fonctionner.
 */
@Injectable()
export class FaceService {
  private readonly logger = new Logger(FaceService.name);
  private faceapi: any = null;
  private tf: any = null;
  private loading: Promise<boolean> | null = null;
  private available = false;

  private readonly modelsPath =
    process.env.FACE_MODELS_PATH || path.join(process.cwd(), 'models');

  isAvailable(): boolean {
    return this.available;
  }

  /** Charge (une seule fois, paresseusement) les modèles et dépendances. */
  private async ensureLoaded(): Promise<boolean> {
    if (this.available) return true;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        // require dynamique : aucune dépendance de compilation.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.tf = require('@tensorflow/tfjs-node');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.faceapi = require('@vladmandic/face-api');

        await this.faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelsPath);
        await this.faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath);
        await this.faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath);

        this.available = true;
        this.logger.log('Reconnaissance faciale serveur prête');
        return true;
      } catch (e: any) {
        this.logger.warn(
          `Reconnaissance faciale serveur indisponible : ${e?.message}. ` +
            'Installez @tensorflow/tfjs-node, @vladmandic/face-api et canvas, ' +
            'puis téléchargez les modèles (npm run download-face-models).',
        );
        this.available = false;
        return false;
      }
    })();

    return this.loading;
  }

  /**
   * Calcule le descripteur facial (128 flottants) à partir d'une image JPEG.
   * Renvoie null si aucun visage n'est détecté.
   */
  async descriptorFromImage(buffer: Buffer): Promise<number[] | null> {
    const ok = await this.ensureLoaded();
    if (!ok) {
      throw new Error('FACE_SERVER_UNAVAILABLE');
    }

    const tensor = this.tf.node.decodeImage(buffer, 3);
    try {
      const options = new this.faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      });
      const result = await this.faceapi
        .detectSingleFace(tensor, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!result) return null;
      return Array.from(result.descriptor as Float32Array);
    } finally {
      tensor.dispose?.();
    }
  }
}
