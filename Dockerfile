FROM node:16.17.1

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update \
  && apt install -y ripgrep htop nano vim \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

EXPOSE 5173
CMD ["node", "build/index.js"]
