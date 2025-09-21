FROM node:18-alpine AS base

# Install dependencies needed for Prisma and other tools
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (suppress warnings for cleaner output)
RUN npm ci --omit=dev --silent && npm cache clean --force

# Copy source code
COPY . .

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]