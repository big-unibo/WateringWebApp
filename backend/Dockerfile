# Utilizza un'immagine di base Node.js
FROM node:25.3-slim

# Imposta la directory di lavoro
WORKDIR /backend

# Copia tutto il codice sorgente dell'app
COPY ./application .

# Installa le dipendenze
RUN npm install

WORKDIR /backend/application

EXPOSE 8081

ENV TZ=Europe/Rome

# Compila l'app per la produzione
CMD npm run start
