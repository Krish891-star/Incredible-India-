# Use Node.js 18 slim image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE $PORT

# Start the application using serve to serve the static build files
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "p:$PORT"]