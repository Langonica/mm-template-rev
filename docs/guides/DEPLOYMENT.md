# Deployment Guide

Simple guide for building and deploying Meridian Master for web release.

---

## Quick Start

```bash
# 1. Build the production bundle
npm run build

# 2. Preview locally before deploying (optional)
npm run preview
```

The build output is in the `dist/` folder - this is what you deploy.

---

## Build Process

### Step 1: Build

```bash
npm run build
```

This creates an optimized production build in `dist/`:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    (~300kb, ~85kb gzipped)
│   └── index-[hash].css   (~25kb, ~5kb gzipped)
└── vite.svg
```

### Step 2: Preview (Optional)

Test the production build locally:

```bash
npm run preview
```

Opens at `http://localhost:4173` - verify everything works before deploying.

---

## Deployment Options

### Option A: Static File Hosting (Simplest)

Upload the contents of `dist/` to any static hosting:
- **Netlify** - drag & drop the `dist` folder at netlify.com/drop
- **Vercel** - `npx vercel` from project root
- **GitHub Pages** - see below
- **Any web server** - just copy `dist/` contents to your server

### Option B: GitHub Pages

1. Install gh-pages (one time):
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json` scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```

3. Add base URL to `vite.config.js`:
   ```js
   export default defineConfig({
     base: '/MeridianMaster/',  // Your repo name
     plugins: [react()],
   })
   ```

4. Build and deploy:
   ```bash
   npm run build
   npm run deploy
   ```

5. Enable GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch

### Option C: Netlify (Recommended for Simplicity)

**Drag & Drop:**
1. Run `npm run build`
2. Go to [netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist` folder onto the page
4. Done! Get a shareable URL instantly

**CLI:**
```bash
npx netlify-cli deploy --dir=dist --prod
```

### Option D: Vercel

```bash
npx vercel
```

Follow the prompts. Vercel auto-detects Vite projects.

---

## Sharing with Testers

After deploying, share the URL with your testers:
- Netlify: `https://[random-name].netlify.app`
- Vercel: `https://[project-name].vercel.app`
- GitHub Pages: `https://[username].github.io/MeridianMaster/`

---

## Troubleshooting

### Assets not loading (404 errors)
- Check the `base` setting in `vite.config.js` matches your deployment path
- For root domain deploys, use `base: '/'`
- For subdirectory deploys (like GitHub Pages), use `base: '/repo-name/'`

### Blank page
- Open browser console for errors
- Usually a base path issue (see above)

---

*Last Updated: 2026-01-20*
