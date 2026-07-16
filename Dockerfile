FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html styles.css robots.txt sitemap.xml /srv/
COPY assets /srv/assets
