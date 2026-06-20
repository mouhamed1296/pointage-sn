# --- Build ---
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Télécharge les modèles face-api.js (ignore l'échec si pas d'accès réseau ;
# ils peuvent être montés en volume à la place).
RUN npm run download-models || echo "Modèles non téléchargés au build"
RUN npm run build

# --- Runtime (nginx) ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
