# ==========================================
# Stage 1: Build the React Application
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install packages
RUN npm install

# Copy all source codes
COPY . .

# Run static assets compilation
RUN npm run build

# ==========================================
# Stage 2: Serve Assets via Nginx Server
# ==========================================
FROM nginx:stable-alpine

# Copy custom Nginx virtual host configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled directory from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
