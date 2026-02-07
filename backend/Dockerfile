# Multi-stage Dockerfile for RentLedger Backend

# --- Base Stage (Common Dependencies) ---
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Development Stage ---
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# --- Build Stage (Production) ---
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:18-alpine AS production
LABEL maintainer="RentLedger DevOps <devops@rentledger.io>"
LABEL description="RentLedger Backend - Production Image"

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup -S rentledger && adduser -S rentledger -G rentledger
USER rentledger

EXPOSE 3000

# Health check to ensure the container is responsive
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.status === 200 ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
