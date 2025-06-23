# Fase 1: Costruzione della build
# Utilizza un'immagine di base Node.js
FROM node:22.3-slim AS build

# Imposta la directory di lavoro
WORKDIR /app

# Copia tutto il codice sorgente dell'app
COPY . .

WORKDIR /app/abds-watering-charts-components/

# Installa le dipendenze
RUN npm install

WORKDIR /app/watering-platform

RUN npm install

# Compila l'app per la produzione
RUN npm run build

# Fase 2: Servire i file statici con Nginx
# Usa un'immagine base di Nginx
FROM nginx:1.27-alpine

# Imposta la directory di lavoro per Nginx
WORKDIR /usr/share/nginx/html

# Copia i file di build dalla fase precedente nella directory di lavoro di Nginx
COPY --from=build /app/watering-platform/dist .

# Copia il file di configurazione di Nginx
COPY ./nginx.conf /etc/nginx/nginx.conf

# Espone la porta 80
EXPOSE 80

# Comando per avviare Nginx
CMD ["nginx", "-g", "daemon off;"]