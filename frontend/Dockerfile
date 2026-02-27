# Fase 1: Costruzione della build
# Utilizza un'immagine di base Node.js
FROM node:25.7-slim AS build

# Imposta la directory di lavoro
WORKDIR /app

# Copia tutto il codice sorgente dell'app
COPY . .

WORKDIR /app/watering-platform-dasboard

RUN npm install

# Compila l'app per la produzione
RUN npm run build

WORKDIR /app/SMARTER-frontend

RUN npm install

RUN npm run build

RUN mv dist/index.html SMARTER_frontend_index.html

# Fase 2: Servire i file statici con Nginx
# Usa un'immagine base di Nginx
FROM nginx:1.29-alpine

# Imposta la directory di lavoro per Nginx
WORKDIR /usr/share/nginx/html

# Copia i file di build dalla fase precedente nella directory di lavoro di Nginx
COPY --from=build /app/watering-platform-dashboard/dist .

COPY --from=build /app/SMARTER-frontend/dist .

# Copia il file di configurazione di Nginx
COPY ./nginx.conf /etc/nginx/nginx.conf

# Espone la porta 80
EXPOSE 80

# Comando per avviare Nginx
CMD ["nginx", "-g", "daemon off;"]