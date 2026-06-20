# pointage-sn — Système de pointage en temps réel

Système de pointage **polyvalent** et **temps réel** : une même application gère
le pointage des **employés**, des **étudiants** et des **participants à un
événement**, via la **reconnaissance faciale** (biométrie) directement dans le
navigateur.

- **Backend** : [NestJS](https://nestjs.com) + TypeORM (SQLite) + JWT + Socket.IO
- **Frontend** : React + Vite + TypeScript, [face-api.js](https://github.com/justadudewhohacks/face-api.js), socket.io-client
- **Temps réel** : chaque pointage est diffusé instantanément aux tableaux de bord connectés.

> ⚠️ Cet environnement d'exécution bloque le registre npm public. Le code source
> est complet, mais l'installation des dépendances (`npm install`) doit être
> faite sur une machine ayant accès à npm.

---

## Architecture

```
pointage-sn/
├── backend/                  API NestJS
│   └── src/
│       ├── auth/             Authentification JWT + rôles (ADMIN / OPERATOR)
│       ├── users/            Comptes opérateurs du back-office
│       ├── tracking-modules/ Modules de pointage configurables (le « polyvalent »)
│       ├── persons/          Personnes suivies + enrôlement biométrique
│       ├── attendance/       Reconnaissance faciale, statuts, statistiques
│       ├── realtime/         Passerelle WebSocket (Socket.IO)
│       └── seed.service.ts   Création automatique de l'admin au démarrage
└── frontend/                 Application React
    └── src/
        ├── pages/            Login, Dashboard, Modules, Persons, Station
        ├── hooks/            useFaceApi (face-api.js), useSocket (temps réel)
        └── components/       Webcam, Layout, ProtectedRoute
```

### Concept clé : les « modules de pointage »

Le système est rendu polyvalent par l'entité **TrackingModule**. Chaque module a
un **type** (`EMPLOYEE`, `STUDENT`, `EVENT`) et une **configuration** propre :
horaire d'arrivée, tolérance de retard, horaire de départ, obligation de pointer
la sortie, et seuil de correspondance faciale. La logique de calcul de statut
(à l'heure / en retard / départ anticipé / présent) s'adapte au type.

### Biométrie

La reconnaissance faciale s'exécute **dans le navigateur** : face-api.js produit
un **descripteur de 128 flottants** par visage. Ce vecteur est stocké à
l'enrôlement, puis comparé (distance euclidienne) lors du pointage. Aucune image
n'est envoyée au serveur, seulement le descripteur — c'est plus léger et plus
respectueux de la vie privée.

---

## Démarrage

### 1. Backend

```bash
cd backend
cp .env.example .env        # ajustez JWT_SECRET, ADMIN_PASSWORD, etc.
npm install
npm run dev                 # API sur http://localhost:3001/api
```

Au premier démarrage, un compte administrateur est créé automatiquement avec les
identifiants définis dans `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run download-models     # télécharge les modèles face-api.js dans public/models
npm run dev                 # interface sur http://localhost:5173
```

> `npm run download-models` nécessite un accès à GitHub. Les fichiers sont
> placés dans `frontend/public/models/`.

### 3. Utilisation

1. Connectez-vous avec le compte admin.
2. **Modules** → créez un module (ex. « Bureau Dakar », type Employés, arrivée 08:00).
3. **Personnes** → enrôlez les personnes en capturant leur visage par webcam.
4. **Borne de pointage** → démarrez la borne : les visages présentés sont
   reconnus et pointés automatiquement.
5. **Tableau de bord** → suivez les pointages **en temps réel** et les statistiques du jour.

---

## API (préfixe `/api`)

| Méthode | Route | Description |
|--------|-------|-------------|
| POST | `/auth/login` | Connexion (retourne un JWT) |
| POST | `/auth/register` | Créer un opérateur (ADMIN) |
| GET | `/auth/me` | Profil courant |
| GET/POST/PATCH/DELETE | `/tracking-modules` | CRUD des modules (écriture ADMIN) |
| GET/POST/PATCH/DELETE | `/persons` | CRUD des personnes (`?moduleId=`) |
| POST | `/attendance/recognize` | Pointage par reconnaissance faciale |
| POST | `/attendance/manual` | Pointage manuel |
| GET | `/attendance` | Historique (`?moduleId=&date=&personId=`) |
| GET | `/attendance/stats` | Statistiques du jour (`?moduleId=`) |

### WebSocket (Socket.IO, port 3001)

- `attendance:created` — émis à chaque nouveau pointage (tous modules)
- `subscribe:module` / `attendance:module` — flux filtré par module

---

## Notes de production

- `synchronize: true` (TypeORM) est pratique en MVP mais à remplacer par des
  **migrations** en production.
- Passer de SQLite à **PostgreSQL** : changez `type` et `database` dans
  `backend/src/app.module.ts` et ajoutez le driver `pg`.
- Servir l'app en **HTTPS** : l'accès à la webcam (`getUserMedia`) est requis et
  n'est autorisé que sur `localhost` ou en HTTPS.
- La reconnaissance faciale d'un MVP n'est pas un dispositif d'authentification
  forte ; pour des usages sensibles, ajoutez une détection anti-spoofing.
