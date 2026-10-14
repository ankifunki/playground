#!/bin/bash
# Builds one openable .fig per page from the split canvases plus your local images.
# Usage: bash build-figs.sh "/path/to/unzipped folder"   (the folder with images/, meta.json, thumbnail.png)
set -euo pipefail
SRC="${1:?Pass the unzipped .fig folder (the one containing images/)}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/built"
mkdir -p "$OUT"
[ -d "$SRC/images" ] || { echo "No images/ folder in $SRC"; exit 1; }
for canvas in "$HERE"/pages/*.canvas.fig; do
  name="$(basename "$canvas" .canvas.fig)"
  tmp="$(mktemp -d)"
  cp "$canvas" "$tmp/canvas.fig"
  cp "$SRC/meta.json" "$tmp/meta.json"
  [ -f "$SRC/thumbnail.png" ] && cp "$SRC/thumbnail.png" "$tmp/thumbnail.png"
  mkdir "$tmp/images"
  found=0; missing=0
  while read -r h; do
    [ -z "$h" ] && continue
    if [ -f "$SRC/images/$h" ]; then cp "$SRC/images/$h" "$tmp/images/$h"; found=$((found+1)); else missing=$((missing+1)); fi
  done < "$HERE/pages/$name.images.txt"
  rm -f "$OUT/$name.fig"
  (cd "$tmp" && zip -q -0 -r "$OUT/$name.fig" .)
  rm -rf "$tmp"
  printf '%-40s %4d images  %s\n' "$name.fig" "$found" "$(du -h "$OUT/$name.fig" | cut -f1)"
done
echo; echo "Done. Files are in: $OUT"
