# GitHub Pages Deployment Guide

This guide provides step-by-step instructions to publish your Myanmar Quakes Dashboard to GitHub Pages.

## 📋 Prerequisites

- A GitHub repository containing your dashboard code
- Admin access to the repository settings

## 🚀 One-Time Setup

Follow these steps once to enable GitHub Pages deployment:

### Step 1: Configure GitHub Pages

1. Go to your repository on GitHub: `https://github.com/mrtinkooo/myanmar-quakes-20250202-20260203`
2. Click on **Settings** (in the top menu)
3. In the left sidebar, navigate to **Pages** (under "Code and automation")
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** from the dropdown
   - This enables the automated deployment workflow

### Step 2: Merge to Main Branch

1. Create a Pull Request from your current branch to `main`
2. Merge the Pull Request
3. The GitHub Actions workflow will automatically trigger and deploy your dashboard

### Step 3: Access Your Dashboard

After the workflow completes (usually 2-3 minutes):
- Your dashboard will be available at: **`https://mrtinkooo.github.io/myanmar-quakes-20250202-20260203/`**

## 🔄 Automatic Deployments

Once set up, deployments happen automatically:

- **Every push to `main`** triggers a new deployment
- Check deployment status in the **Actions** tab of your repository
- Click on a workflow run to see detailed logs

## 🛠️ Manual Deployment

To manually trigger a deployment:

1. Go to the **Actions** tab in your repository
2. Click on **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select the `main` branch
5. Click **Run workflow**

## 📝 What Was Changed

The following files were added/modified to enable GitHub Pages deployment:

1. **`.github/workflows/deploy.yml`** - GitHub Actions workflow for automated deployment
2. **`vite.config.ts`** - Added `base` path configuration for GitHub Pages
3. **`README.md`** - Added deployment instructions
4. **`src/state/dashboardState.tsx`** - Fixed TypeScript JSX issue (renamed from .ts to .tsx)

## 🐛 Troubleshooting

### Deployment fails in Actions tab

1. Check the workflow logs in the Actions tab
2. Ensure all dependencies are listed in `package.json`
3. Verify the build command succeeds locally: `npm run build`

### Dashboard doesn't load after deployment

1. Clear your browser cache
2. Check browser console for errors (F12)
3. Verify the base path in `vite.config.ts` matches your repository name

### GitHub Pages option not showing "GitHub Actions"

1. Ensure you have admin access to the repository
2. Check that the repository is public (GitHub Pages on private repos requires GitHub Pro)
3. Refresh the settings page

## 📊 Monitoring Deployments

- **Actions Tab**: See all deployment runs and their status
- **Deployments**: Check the deployments section in the right sidebar of your repository
- **Environment**: Each deployment creates a "github-pages" environment

## 🎉 Success!

Your Myanmar Quakes Dashboard is now live and will automatically update whenever you push changes to the `main` branch!
