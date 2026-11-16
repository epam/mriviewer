FROM nginx:1.30.6-alpine
RUN apk add --no-cache curl
WORKDIR /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY dist /usr/share/nginx/html
HEALTHCHECK --interval=10s --timeout=3s \
  CMD curl -f http://127.0.0.1/ || exit 1
