# Etapa 1: construir la aplicación
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine

# Copiar la build generada al directorio de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Exponer puerto 80 dentro del contenedor
EXPOSE 80

# Arrancar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
