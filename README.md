# pointage-sn — Système de pointage en temps réel

Système de pointage **polyvalent**, **multi-méthodes** et **temps réel**, conçu
pour fonctionner **24h/24**. Une même application gère le pointage des
**employés**, des **étudiants** et des **participants à un événement**.

### 4 méthodes de pointage
- 🪪 **Badge RFID/NFC** — lecteur RC522 sur borne ESP32
- 👆 **Empreinte digitale** — capteur AS608/R307 sur borne ESP32
- 🔢 **Code PIN** — clavier 4×4 sur borne ESP32 (ou saisie web)
- 🙂 **FaceID** — reconnaissance faciale dans le navigateur (webcam ou caméra IP)

### Et aussi
- 🎥 **Gestion des caméras IP en temps réel** (MJPEG / HLS), utilisables comme
  source de pointage facial
- 🖥️ **Bornes ESP32** avec firmware fourni (file d'attente hors-ligne, watchdog…)
- 📊 **Tableau de bord temps réel** + **supervision 24h/24** des bornes

## Stack

| Brique | Technologie |
|--------|-------------|
| Backend | NestJS + TypeORM (SQLite ou PostgreSQL) + JWT + Socket.IO + tâches planifiées |
| Frontend | React + Vite + TypeScript, face-api.js, hls.js, socket.io-client |
| Borne | ESP32 (Arduino/PlatformIO) — RC522, AS608, clavier 4×4, OLED |
| Déploiement | Docker / docker-compose (restart auto + healthchecks) |

> ⚠️ Cet environnement d'exécution bloque le registre npm public.
> Le code est complet ; `npm install` doit être exécuté sur une machine ayant
> accès à npm.

---

## Architecture

```
pointage-sn/
├── backend/                  API NestJS
│   └── src/
│       ├── auth/             JWT + rôles ADMIN/OPERATOR
│       ├── tracking-modules/ Modules configurables (employés/étudiants/événement)
│       ├── persons/          Personnes + identités biométriques (visage, badge, PIN, empreinte)
│       ├── attendance/       Reconnaissance, calcul de statut, statistiques
│       ├── devices/          Bornes ESP32 (clé API, heartbeat)
│       ├── cameras/          Caméras IP
│       ├── monitoring/       Supervision 24h/24 des bornes (tâche planifiée)
│       ├── realtime/         Passerelle WebSocket
│       └── health/           Sonde /health
├── frontend/                 App React (Dashboard, Borne, Caméras, Bornes, Modules, Personnes)
├── firmware/                 Firmware ESP32 (PlatformIO) — voir firmware/README.md
└── docker-compose.yml        Déploiement 24h/24
```

### Comment chaque méthode fonctionne
- **FaceID** : face-api.js calcule un descripteur de 128 flottants dans le
  navigateur ; seul ce vecteur est envoyé au serveur, qui cherche la
  correspondance la plus proche (distance euclidienne). Source = webcam **ou**
  caméra IP marquée « FaceID ».
- **Badge / Empreinte / Code** : la borne ESP32 lit le capteur et envoie
  l'identifiant à `POST /api/attendance/device` (authentifiée par clé). Le
  serveur retrouve la personne par son `badgeId`, son `fingerprintId` ou son
  code PIN (haché).

---

## Démarrage rapide (développement)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev            # http://localhost:3001/api  (admin créé au 1er lancement)
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run download-models   # modèles face-api.js (nécessite GitHub)
npm run dev               # http://localhost:5173
```

### Parcours
1. Connexion (admin défini dans `backend/.env`).
2. **Modules** → créer un module (type + horaires + seuil facial).
3. **Personnes** → enrôler : visage (webcam), UID badge, code PIN, ID empreinte.
4. **Caméras** → ajouter des caméras IP (option FaceID pour le pointage).
5. **Bornes** → créer une borne ESP32 et récupérer sa clé API.
6. **Borne de pointage** → 4 onglets (FaceID webcam / FaceID caméra / Badge / Code).
7. **Tableau de bord** → flux temps réel + statut des bornes 24h/24.

---

## Borne ESP32

Firmware complet dans [`firmware/`](firmware/README.md) : badge, empreinte,
code, écran OLED, reconnexion WiFi, **file d'attente hors-ligne** (aucun
pointage perdu), heartbeat et watchdog. Renseigner WiFi + URL API +
`DEVICE_ID`/`DEVICE_KEY` (obtenus dans l'onglet *Bornes*) dans
`firmware/src/config.h`, puis :

```bash
cd firmware && pio run -t upload
```

---

## Déploiement 24h/24 (Docker)

```bash
docker compose up -d --build
# Frontend : http://localhost:8080
```

- **PostgreSQL** persistant (volume) + **backend** + **frontend** (nginx).
- `restart: always` + **healthchecks** sur tous les services.
- La supervision interne marque les bornes hors-ligne après 90 s sans heartbeat
  et émet des alertes temps réel.
- Pensez à changer `JWT_SECRET`, `ADMIN_PASSWORD` et les identifiants DB.

---

## API principale (préfixe `/api`)

| Méthode | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/login` | — | Connexion |
| GET/POST/PATCH/DELETE | `/tracking-modules` | JWT | Modules |
| GET/POST/PATCH/DELETE | `/persons` | JWT | Personnes |
| GET/POST/PATCH/DELETE | `/cameras` | JWT | Caméras |
| GET/POST/PATCH/DELETE | `/devices` | JWT | Bornes |
| POST | `/attendance/recognize` | JWT | Pointage FaceID |
| POST | `/attendance/by-identifier` | JWT | Pointage badge/code (web) |
| POST | `/attendance/device` | Clé borne | Pointage ESP32 |
| POST | `/devices/heartbeat` | Clé borne | Signal de vie |
| GET | `/attendance` `/attendance/stats` | JWT | Historique / stats |
| GET | `/health` | — | Sonde de santé |

### WebSocket
- `attendance:created` — nouveau pointage
- `devices:status` — état des bornes (périodique)
- `devices:alert` — borne hors-ligne / de retour

---

## Notes de sécurité / production
- Servir en **HTTPS** (la webcam exige HTTPS ou localhost ; idem flux caméras
  pour éviter le *mixed content* et permettre le FaceID via canvas + CORS).
- La reconnaissance faciale MVP n'intègre pas d'**anti-spoofing** : à ajouter
  pour un usage sensible.
- Remplacer `synchronize: true` par des **migrations** TypeORM en production.
- Les flux MJPEG/HLS exploités pour le FaceID doivent renvoyer les en-têtes
  **CORS** appropriés (sinon le canvas est « taché » et l'analyse échoue).
