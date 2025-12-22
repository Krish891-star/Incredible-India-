# Use Node.js 20 slim image as base
FROM node:20-alpine

# Install build dependencies for alpine
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Install vite-plugin-pwa explicitly to ensure it's available during build
RUN npm install vite-plugin-pwa

# Build the application
RUN npm run build

# Expose port (Render uses $PORT)
EXPOSE $PORT

# Start the app using vite preview
CMD ["sh", "-c", "npx vite preview --host --port ${PORT:-3000}"]