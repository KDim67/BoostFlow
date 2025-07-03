# Stage 1: Dependencies cache layer
FROM node:18-alpine AS deps
# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    libc6-compat \
    gcompat

WORKDIR /app
# Copy package files first for better caching
COPY package*.json ./
# Install dependencies only (this layer will be cached if package.json doesn't change)
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder stage
FROM node:18-alpine AS builder
# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    libc6-compat \
    gcompat

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app
# Copy package files
COPY package*.json ./
# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code (this will invalidate cache only when source changes)
COPY . .

# Build the Next.js application
ENV NODE_ENV=production
ENV CI=true
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
# Install only curl for health checks
RUN apk add --no-cache curl

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --gid 1001 --system nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy built Next.js application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/next.config.* ./

# Copy environment file if it exists
COPY .env.local* ./

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]