FROM node:18-slim

# Instalar FFmpeg en el sistema Linux del servidor
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Crear carpeta uploads por si acaso
RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "index.js"]