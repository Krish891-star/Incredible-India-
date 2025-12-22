# Use Node.js 18 slim image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Install all dependencies (including dev dependencies) for production build
RUN npm ci

# Expose port
EXPOSE $PORT

# Start the application using serve to serve the static build files
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "p:$PORT"]