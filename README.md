# Myanmar Quakes + Tectonic Lineaments Dashboard

Interactive map + linked charts using:
- `Myanmar_Tectonic_Map_2011.geojson` (tectonic lineaments)
- `quakes.json` (USGS GeoJSON quakes)
- `admin0.json` (Myanmar boundary)

## 🌐 Live Demo
Visit the live dashboard at: `https://mrtinkooo.github.io/myanmar-quakes-20250202-20260203/`

## 📦 Publishing to GitHub Pages

This dashboard is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Initial Setup (One-time configuration)
1. Go to your GitHub repository settings
2. Navigate to **Pages** section (under "Code and automation")
3. Under **Source**, select **GitHub Actions**
4. Push changes to the `main` branch to trigger automatic deployment

### Automatic Deployment
- Every push to the `main` branch triggers the deployment workflow
- The workflow builds the app and deploys it to GitHub Pages
- You can also manually trigger deployment from the Actions tab

### Manual Build and Preview
To build the site locally:
```bash
npm install
npm run build
npm run preview
```

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
