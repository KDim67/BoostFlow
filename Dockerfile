# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install build dependencies for native modules and glibc compatibility
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    libc6-compat \
    gcompat
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including dev deps needed for build)
RUN npm install

RUN npm ci

# Copy source code
COPY . .

# Copy environment file if it exists
COPY .env.local* ./

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production image with Node.js
FROM node:18-alpine

# Install additional packages
RUN apk add --no-cache curl

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Create app directory
WORKDIR /app

# Copy built Next.js application from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/.env.local .env.local

# No additional process manager needed

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port for Next.js
EXPOSE 3000

# Start Next.js application
CMD ["npm", "start"]