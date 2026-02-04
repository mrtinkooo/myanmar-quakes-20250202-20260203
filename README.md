# Myanmar Quakes + Tectonic Lineaments Dashboard

Interactive map + linked charts using:
- `Myanmar_Tectonic_Map_2011.geojson` (tectonic lineaments)
- `quakes.json` (USGS GeoJSON quakes)
- `admin0.json` (Myanmar boundary)

## 🌐 Live Demo
Visit the live dashboard at: `https://mrtinkooo.github.io/myanmar-quakes-20250202-20260203/`

## 📦 Publishing to GitHub Pages

This dashboard is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### 🚨 Troubleshooting 404 Error
If you see "404 - There isn't a GitHub Pages site here":
1. **Verify Settings**: Go to [Settings → Pages](https://github.com/mrtinkooo/myanmar-quakes-20250202-20260203/settings/pages)
2. **Ensure Source is "GitHub Actions"** (not "Deploy from a branch")
3. **Trigger new deployment**: Merge a change to `main` or manually run workflow from Actions tab
4. **Wait 2-3 minutes** for deployment to complete

For detailed troubleshooting, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Initial Setup (One-time configuration)
1. Go to your GitHub repository settings
2. Navigate to **Pages** section (under "Code and automation")
3. Under **Source**, select **GitHub Actions** (NOT "Deploy from a branch")
4. Push changes to the `main` branch to trigger automatic deployment

### Automatic Deployment
- Every push to the `main` branch triggers the deployment workflow
- The workflow builds the app and deploys it to GitHub Pages
- You can also manually trigger deployment from the Actions tab
- Monitor deployment status in the Actions tab

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
