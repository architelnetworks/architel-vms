#!/usr/bin/env bash
set -euo pipefail

mock_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd -- "$mock_dir/../.." && pwd)"
compose=(docker compose -f "$mock_dir/compose.yml")

case "${1:-help}" in
  prepare)
    mkdir -p "$mock_dir/.data"
    "${compose[@]}" run --rm --no-deps prepare
    ;;
  up)
    for camera in main_entrance corridor car_park; do
      if [[ ! -s "$mock_dir/.data/footage/$camera.mp4" ]]; then
        echo "Missing $camera.mp4. Run: bash dev/mock-cameras/manage.sh prepare" >&2
        exit 1
      fi
    done
    mkdir -p "$mock_dir/.data/config" "$mock_dir/.data/media"
    if [[ ! -f "$mock_dir/.data/config/config.yml" ]]; then
      cp "$mock_dir/frigate.yml" "$mock_dir/.data/config/config.yml"
    fi
    if [[ ! -f "$repo_dir/frigate/version.py" ]]; then
      make -C "$repo_dir" version
    fi
    "${compose[@]}" up -d --wait --wait-timeout 120
    ;;
  down) "${compose[@]}" down ;;
  logs) "${compose[@]}" logs -f --tail 60 ;;
  status) "${compose[@]}" ps ;;
  restart) "${compose[@]}" restart backend ;;
  verify) "${compose[@]}" exec -T backend python3 - < "$mock_dir/verify.py" ;;
  *)
    echo "Usage: bash dev/mock-cameras/manage.sh {prepare|up|down|logs|status|restart|verify}"
    ;;
esac
