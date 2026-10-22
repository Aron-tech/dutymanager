# dutymanager: egy image, több szerepkör (web, queue, scheduler, discord-bot).
# A szerepkört a docker-compose.yml szolgáltatásonkénti `command`-ja választja ki.

ARG PHP_VERSION=8.5.12
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS node

############################################################
# 1) build: composer függőségek + Vite (Wayfinder-hez PHP kell)
############################################################
FROM php:${PHP_VERSION}-cli-bookworm AS build

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

RUN apt-get update \
 && apt-get install -y --no-install-recommends git unzip \
 && rm -rf /var/lib/apt/lists/* \
 && install-php-extensions pdo_pgsql pgsql pcntl bcmath intl zip opcache redis gd exif

# Csak a build idejére szóló ál-értékek, hogy az artisan (package:discover,
# wayfinder:generate) külső szolgáltatás nélkül elinduljon. A futó image-be nem kerülnek át.
ENV APP_ENV=production \
    APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    CACHE_STORE=array \
    SESSION_DRIVER=array \
    QUEUE_CONNECTION=sync \
    BROADCAST_CONNECTION=log

# A VITE_* változók a build során beépülnek a frontendbe (Coolify build argumentumként adja át).
ARG VITE_APP_NAME=DutyManager
ARG VITE_REVERB_APP_KEY=
ARG VITE_REVERB_HOST=
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https
ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY} \
    VITE_REVERB_HOST=${VITE_REVERB_HOST} \
    VITE_REVERB_PORT=${VITE_REVERB_PORT} \
    VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME}

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN composer dump-autoload --optimize --no-dev --no-interaction \
 && npm run build \
 && rm -rf node_modules

############################################################
# 2) runtime: PHP-FPM + nginx (web), vagy php artisan (worker szerepkörök)
############################################################
FROM php:${PHP_VERSION}-fpm-bookworm AS runtime

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN apt-get update \
 && apt-get install -y --no-install-recommends nginx supervisor curl \
 && rm -rf /var/lib/apt/lists/* \
 && install-php-extensions pdo_pgsql pgsql pcntl bcmath intl zip opcache redis gd exif \
 && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zzz-app.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/html
COPY --from=build --chown=www-data:www-data /app /var/www/html

# Minden szerepkör nem-root felhasználóként fut; a web szerepkör ezért a 8080-as porton hallgat.
USER www-data
EXPOSE 8080

ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
