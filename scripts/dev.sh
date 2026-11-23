#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s web|api|mail\n' "$0" >&2
  exit 2
fi

case "$1" in
  web|api) ;;
  mail)
    if ! command -v mailpit >/dev/null 2>&1; then
      printf 'Install Mailpit and add it to PATH. See https://mailpit.axllent.org/docs/install/\n' >&2
      exit 127
    fi
    exec mailpit --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025
    ;;
  *)
    printf 'Usage: %s web|api|mail\n' "$0" >&2
    exit 2
    ;;
esac

repo_root=$(CDPATH='' cd "$(dirname "$0")/.." && pwd)
cd "$repo_root"
exec npm run dev --workspace "@catalogue/$1"
