# COMINO WORLD production deployment

## Directories and permissions

Run the API as a dedicated `comino` system user. Keep application code in `/var/www/comino-world/release`; persistent data must live outside the release directory:

```bash
sudo install -d -o comino -g comino -m 750 /var/lib/comino-world /var/lib/comino-world/uploads
sudo install -d -o comino -g comino -m 750 /var/log/comino-world
sudo install -d -o root -g root -m 750 /var/backups/comino-world
sudo cp server/.env.example /etc/comino-world.env
sudo chmod 640 /etc/comino-world.env
```

Generate `JWT_SECRET` with `openssl rand -hex 32`. Never commit the production env file.

## Build and process supervision

```bash
cd /var/www/comino-world/release
npm ci && npm run build
cd server && npm_config_build_from_source=true npm ci --omit=dev && cd ..
set -a; source /etc/comino-world.env; set +a
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

PM2 restarts the API after crashes, caps memory at 350 MB, writes logs under `/var/log/comino-world`, and runs orphan-upload cleanup daily at 03:17.

## Nginx and HTTPS

Copy `deploy/nginx-comino-world.conf` to `/etc/nginx/sites-available/comino-world`, enable it, verify certificates, then run `nginx -t` before reload. The config redirects HTTP to HTTPS, allows 12 MB request bodies, caches fingerprinted frontend assets for one year, uploads for seven days, and never caches `index.html`.

## Health and backup

Monitor `https://comino.top/api/health`; alert unless HTTP 200 and `status=ok`. Run `deploy/backup.sh` daily after granting execute permission. It uses SQLite's online backup command, archives uploads, and retains 14 days. Periodically restore a backup on a separate machine to verify it.

## CORS

Production `ALLOWED_ORIGINS` must be `https://comino.top,https://www.comino.top`. Requests without an Origin header remain allowed for Nginx health checks and server-to-server tools; browser requests from any other origin receive HTTP 403.

## Orphan uploads

`cd server && npm run cleanup:uploads` is dry-run. Add `-- --apply` to delete. A file is eligible only if no database field/snapshot/message/avatar references it and its modification time is older than `ORPHAN_GRACE_HOURS` (24 hours by default), protecting uploads created shortly before a form is saved.
