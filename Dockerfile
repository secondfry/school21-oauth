FROM node:16

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update \
  && apt install -y ripgrep htop nano vim \
  && rm -rf /var/lib/apt/lists/*

ARG DOWNLOAD_YANDEX_CA
RUN bash -c '[[ -n "$DOWNLOAD_YANDEX_CA" ]] \
  && mkdir -p /usr/local/share/ca-certificates/Yandex \
  && curl "https://storage.yandexcloud.net/cloud-certs/CA.pem" -o /usr/local/share/ca-certificates/Yandex/YandexInternalRootCA.crt'

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

CMD ["node", "build/index.js"]
