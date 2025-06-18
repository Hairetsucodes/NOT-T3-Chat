# Base stage for building
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (skip postinstall scripts)
RUN pnpm install --force --ignore-scripts


# Copy source code
COPY . .

# Generate Prisma client manually
RUN pnpx prisma generate

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm globally and curl for healthcheck
RUN npm install -g pnpm && \
    apk add --no-cache curl

# Set the working directory
WORKDIR /app

# Create a directory for the database
RUN mkdir -p /app/data

# Set environment to production
ENV NODE_ENV=production

# Default environment variables (will be overridden by .env if present)
ENV DATABASE_URL="file:/app/data/prod.db"
ENV NEXTAUTH_URL="http://localhost:3000"

# Copy built application from base stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.ts ./

# Copy production node_modules from base stage (includes generated Prisma client)
COPY --from=base /app/node_modules ./node_modules

# Copy package files and prisma schema
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma

# Copy .env file if it exists (optional)
COPY .env* ./

# Copy and setup the startup script
COPY scripts/container-start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Create a volume for the database
VOLUME ["/app/data"]

# Expose the port
EXPOSE 3000

# Use the startup script as the command
CMD ["/app/start.sh"]