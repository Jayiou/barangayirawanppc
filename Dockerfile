FROM node:20-bullseye-slim

# Install minimal deps Chromium needs
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libnss3 lsb-release wget gnupg --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install Chromium (Debian package)
RUN apt-get update && apt-get install -y chromium --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

ENV NODE_ENV=production
ENV PUBLIC_UPLOAD_DIR=/app/uploads/public
ENV PRIVATE_PROOF_UPLOAD_DIR=/app/uploads/private/proofs
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=1

RUN mkdir -p /app/uploads/public /app/uploads/private/proofs

EXPOSE 5000
CMD ["node", "server.js"]
