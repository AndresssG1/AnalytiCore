# frontend/Dockerfile

# Etapa de build
FROM node:18-alpine AS build
WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./
COPY .env.production .env.production    
RUN npm install

COPY . .

# Construir la app en modo producción
RUN npm run build --mode production

# Etapa de producción: usar nginx
FROM nginx:stable-alpine

# Copiar archivos estáticos generados
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
