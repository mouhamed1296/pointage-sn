# --- Build ---
FROM node:20-bookworm-slim AS build
WORKDIR /app
# Outils nécessaires à la compilation native de better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Runtime ---
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
