#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s web|api\n' "$0" >&2
  exit 2
fi

case "$1" in
  web|api) ;;
  *)
    printf 'Usage: %s web|api\n' "$0" >&2
    exit 2
    ;;
esac

repo_root=$(CDPATH='' cd "$(dirname "$0")/.." && pwd)
cd "$repo_root"
exec npm run dev --workspace "@catalogue/$1"
