# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package descriptors first to cache layer
COPY package*.json ./

# Install dependencies
RUN npm ci

# Set build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_WS_URL

# Set environment variables for compilation
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copy source code and build
COPY . .
RUN npm run build

# Run Stage
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
