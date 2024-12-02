FROM node:latest AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ .
RUN npm run build

FROM nginx AS production-stage
RUN mkdir /app
COPY --from=build-stage /app/dist /app
COPY nginx.conf /etc/nginx/nginx.conf

COPY ./substitute_vue_environment_variables.sh /docker-entrypoint.d/substitute_vue_environment_variables.sh
RUN chmod +x /docker-entrypoint.d/substitute_vue_environment_variables.sh

COPY ./substitute_nginx_config_variables.sh /docker-entrypoint.d/substitute_nginx_config_variables.sh
RUN chmod +x /docker-entrypoint.d/substitute_nginx_config_variables.sh