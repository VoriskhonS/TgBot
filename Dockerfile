# Используем образ с Node.js и Python
FROM node:18-bullseye-slim

# Устанавливаем Python и необходимые пакеты
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Устанавливаем Node.js зависимости
COPY package*.json ./
RUN npm install --omit=dev

# Копируем исходный код
COPY . .

# Запускаем бота
CMD ["node", "index.js"]