FROM node:20-alpine AS base

# Install dependencies for sharp (native image processing)
RUN apk add --no-cache libc6-compat vips-dev

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p ./uploads

# Non-root user for security
RUN addgroup -g 1001 nodejs && adduser -S writavo -u 1001
RUN chown -R writavo:nodejs /app
USER writavo

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
