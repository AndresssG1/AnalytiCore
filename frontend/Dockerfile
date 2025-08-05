# frontend/Dockerfile

FROM node:18-alpine AS build
WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./
COPY .env.production .env.production    
RUN npm install

# Copiar el resto del código
COPY . .

# Construir el frontend (detecta .env.production automáticamente)
RUN npm run build                       

# Etapa final con Nginx para servir archivos
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
