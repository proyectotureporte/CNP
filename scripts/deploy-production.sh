#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/var/www/cnp"
APP_NAME="cnp"
DATABASE_NAME="cnp"
PUBLIC_URL="https://cnp.com.co/"
LOCAL_URL="http://127.0.0.1:3000/"
TARGET_SHA="${1:?Falta el commit que se va a desplegar}"
PREVIOUS_SHA="${2:-desconocido}"
DEPLOYED_AT="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="/var/backups/cnp-deploy/${DEPLOYED_AT}-${TARGET_SHA:0:12}"

if [[ "$EUID" -ne 0 ]]; then
  echo "El despliegue debe ejecutarse como root." >&2
  exit 1
fi

cd "$APP_DIR"
if [[ "$(git rev-parse HEAD)" != "$TARGET_SHA" ]]; then
  echo "El checkout no corresponde al commit solicitado." >&2
  exit 1
fi

install -d -m 700 "$BACKUP_DIR"
git status --short > "$BACKUP_DIR/git-status-before.txt"
printf '%s\n' "$PREVIOUS_SHA" > "$BACKUP_DIR/previous-commit.txt"
cp -a .env.local "$BACKUP_DIR/env.local"
cp -a package-lock.json "$BACKUP_DIR/package-lock.json"
chmod 600 "$BACKUP_DIR/env.local"

echo "[1/5] Respaldo específico de PostgreSQL..."
sudo -u postgres pg_dump --format=custom --file="$BACKUP_DIR/cnp.dump" "$DATABASE_NAME"

echo "[2/5] Instalando dependencias exactas..."
npm ci --include=dev --no-audit --no-fund

echo "[3/5] Compilando CNP..."
npm run build

echo "[4/5] Aplicando migraciones pendientes..."
npm run db:migrate

echo "[5/5] Recargando una sola instancia PM2..."
pm2 reload "$APP_NAME" --update-env

healthy=false
for _ in {1..30}; do
  if curl --fail --silent --show-error --max-time 5 "$LOCAL_URL" >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "$healthy" != true ]]; then
  echo "CNP no respondió localmente después de la recarga." >&2
  echo "Rollback: commit $PREVIOUS_SHA y respaldo $BACKUP_DIR/cnp.dump" >&2
  exit 1
fi

curl --fail --silent --show-error --max-time 15 "$PUBLIC_URL" >/dev/null
pm2 save --force >/dev/null

printf '%s\n' "$TARGET_SHA" > "$BACKUP_DIR/deployed-commit.txt"
echo "Despliegue correcto: $TARGET_SHA"
echo "Respaldo de reversión: $BACKUP_DIR"
