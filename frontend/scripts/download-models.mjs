// Télécharge les modèles pré-entraînés de face-api.js dans public/models.
// Utilisation : npm run download-models
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'models');
const BASE =
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Modèles nécessaires : détection (TinyFaceDetector), points du visage,
// et reconnaissance (descripteur 128-D).
const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const file of FILES) {
    const url = `${BASE}/${file}`;
    process.stdout.write(`↓ ${file} ... `);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`ÉCHEC (${res.status})`);
      process.exitCode = 1;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(OUT_DIR, file), buf);
    console.log(`ok (${(buf.length / 1024).toFixed(0)} Ko)`);
  }
  console.log('\n✅ Modèles téléchargés dans public/models');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
