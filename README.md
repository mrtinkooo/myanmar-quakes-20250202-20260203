# Myanmar Quakes + Tectonic Lineaments Dashboard

Interactive map + linked charts using:
- `Myanmar_Tectonic_Map_2011.geojson` (tectonic lineaments)
- `quakes.json` (USGS GeoJSON quakes)
- `admin0.json` (Myanmar boundary)

## Run (no dependencies)
This repo includes a dependency-free dashboard (no npm installs needed).

```powershell
node server.mjs
```

Then open:
`http://127.0.0.1:5173/`

## Run (Vite + React)
```powershell
npm install
npm run dev
```

Notes:
- The Vite + React version uses OpenStreetMap tiles, so internet access is required at runtime.
- The dependency-free version (server.mjs) draws overlays without online map tiles (works offline).
