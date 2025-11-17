# Multi-stage build for Cloud Run
# Stage 1: Build the frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend (creates dist/ folder)
RUN npm run build

# Stage 2: Production server
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production && npm install express cors

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server code
COPY server.js ./

# Expose port (Cloud Run uses PORT env var)
ENV PORT=8080
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
