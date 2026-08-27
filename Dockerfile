# Stage 1: Build Vite React App
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

# Build-time Vite variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_R2_ACCOUNT_ID
ARG VITE_R2_ACCESS_KEY_ID
ARG VITE_R2_SECRET_ACCESS_KEY
ARG VITE_R2_BUCKET_NAME
ARG VITE_R2_PUBLIC_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_R2_ACCOUNT_ID=$VITE_R2_ACCOUNT_ID
ENV VITE_R2_ACCESS_KEY_ID=$VITE_R2_ACCESS_KEY_ID
ENV VITE_R2_SECRET_ACCESS_KEY=$VITE_R2_SECRET_ACCESS_KEY
ENV VITE_R2_BUCKET_NAME=$VITE_R2_BUCKET_NAME
ENV VITE_R2_PUBLIC_URL=$VITE_R2_PUBLIC_URL

RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
