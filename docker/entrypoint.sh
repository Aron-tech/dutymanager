#!/bin/sh
# Minden szerepkör (web, queue, scheduler, bot) ezen keresztül indul.
set -e
cd /var/www/html

mkdir -p /tmp/nginx/client_body /tmp/nginx/proxy /tmp/nginx/fastcgi /tmp/nginx/uwsgi /tmp/nginx/scgi
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

php artisan storage:link --force --no-interaction >/dev/null 2>&1 || true

# Konfig-, útvonal-, esemény- és nézetcache a konténer valódi környezeti változóiból.
php artisan optimize --no-interaction || echo "FIGYELEM: az 'artisan optimize' hibázott, gyorsítótár nélkül indul."

# Migráció csak ott fut, ahol kérik (a compose-ban a web szolgáltatás), alapból kikapcsolva.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force --no-interaction
fi

exec "$@"
