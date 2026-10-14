# Design source

`📍 Multi Location.fig` (876 MB) crashes Figma, so it's split here into one file per page.

- `canvas.fig.part-*`, `meta.json`, `thumbnail.png`: pieces of the original unzipped file.
- `pages/*.canvas.fig`: one page each, plus any components/styles it uses from other pages
  (those show up as small extra pages inside the file).
- `pages/*.images.txt`: which images from the original `images/` folder each page needs.
- `build-figs.sh`: run on your Mac to combine the page canvases with your local images:

```bash
bash build-figs.sh ~/Downloads/"📍 Multi Location copy"
```

Openable `.fig` files land in `design-source/built/`. Drag them into Figma's file browser to import.
