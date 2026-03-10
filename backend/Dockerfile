FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat vips-dev

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY backend/ ./
COPY frontend/ ../frontend/

RUN mkdir -p ./uploads

RUN addgroup -g 1001 nodejs && adduser -S writavo -u 1001
RUN chown -R writavo:nodejs /app
USER writavo

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "const p=process.env.PORT||5000; require('http').get('http://localhost:'+p+'/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]