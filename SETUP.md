# Setup Guide

Complete installation and configuration guide for Meridian Solitaire.

---

## 📋 Prerequisites

### Required
- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher (comes with Node.js)
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Optional
- **Git**: For version control
- **VS Code**: Recommended IDE

### Check Your Environment

```bash
# Check Node.js version
node --version
# Should output: v16.0.0 or higher

# Check npm version
npm --version
# Should output: 7.0.0 or higher
```

---

## 🚀 Installation

### Method 1: From ZIP Package

1. **Extract the ZIP file**
```bash
unzip meridian-solitaire-complete.zip
cd meridian-solitaire-complete
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
```
Navigate to: http://localhost:5173
```

### Method 2: From Git Repository (if available)

```bash
# Clone repository
git clone [repository-url]
cd meridian-solitaire-complete

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📦 Project Setup

### Initial Installation

The installation process will:
1. Read `package.json` dependencies
2. Download all required packages
3. Create `node_modules/` directory
4. Generate `package-lock.json` for version locking

**Expected install time:** 30-60 seconds (depending on internet speed)

### Verify Installation

```bash
# Check if all dependencies installed
npm list --depth=0

# Should show:
# - react@18.3.1
# - react-dom@18.3.1
# - vite@5.4.11
# - @vitejs/plugin-react@4.3.4
# - eslint@9.17.0
```

---

## 🔧 Configuration

### Environment Setup

No environment variables required for basic setup. The app works out of the box!

### Optional Configuration

#### Vite Configuration (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/',           // Change for deployment to subdirectory
  server: {
    port: 5173,        // Change development port
    open: true,        // Auto-open browser
    host: true         // Expose to network
  }
})
```

#### ESLint Configuration (`eslint.config.js`)

Pre-configured for React best practices. Modify if needed:
```javascript
export default [
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      // Add custom rules here
    }
  }
]
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Start with hot-reload
npm run dev

# Output:
#   VITE v5.4.11  ready in 523 ms
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: http://192.168.1.x:5173/
```

**Features in dev mode:**
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Source maps for debugging
- Detailed error messages

### Production Build

```bash
# Create optimized build
npm run build

# Output in dist/ folder:
#   - index.html
#   - assets/
#     - index-[hash].js
#     - index-[hash].css
```

**Build optimizations:**
- Minification
- Code splitting
- Tree shaking
- Asset optimization
- Cache busting

### Preview Production Build

```bash
# Serve the built files
npm run preview

# Output:
#   VITE v5.4.11  ready in 123 ms
#   ➜  Local:   http://localhost:4173/
```

---

## 🔍 Verification Steps

### 1. Visual Check

After starting the dev server, you should see:
- Header with "MERIDIAN Master Solitaire"
- Game board with green felt background
- 7 tableau columns
- Foundation areas at top
- Stock/waste/pockets at bottom
- No console errors

### 2. Functionality Check

Test these features:
- [ ] Click stock to draw cards
- [ ] Drag cards between columns
- [ ] Double-click card to auto-move
- [ ] Click undo/redo buttons
- [ ] Switch between snapshots
- [ ] Toggle Classic/Fun mode

### 3. Browser Console Check

Press F12 and check:
- No red errors in Console tab
- Network tab shows all assets loaded (200 status)
- React DevTools shows component tree

---

## 📂 Directory Structure Explained

```
meridian-solitaire-complete/
│
├── src/                    # Source code
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── data/              # Game data & snapshots
│   └── styles/            # CSS files
│
├── public/                # Static assets
│   └── assets/            # Images, sprites
│
├── node_modules/          # Dependencies (auto-generated)
├── dist/                  # Production build (auto-generated)
│
├── package.json           # Project metadata & dependencies
├── vite.config.js         # Vite configuration
├── eslint.config.js       # Linting rules
├── index.html             # HTML template
│
└── docs/                  # Documentation
    └── README.md          # This file!
```

---

## 🛠️ Troubleshooting

### Common Issues

#### "Module not found" errors

**Problem:** Missing dependencies
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Port 5173 already in use

**Problem:** Port occupied by another process
**Solution:**
```bash
# Kill process on port 5173 (Unix/Mac)
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
server: { port: 3000 }
```

#### Assets not loading

**Problem:** Incorrect base path
**Solution:** Check `vite.config.js`:
```javascript
base: '/'  // For root deployment
base: '/solitaire/'  // For subdirectory
```

#### Blank white screen

**Problem:** Build errors or missing files
**Solution:**
```bash
# Check browser console for errors
# Rebuild the project
npm run build
npm run preview
```

#### Hot reload not working

**Problem:** File watching issues
**Solution:**
```bash
# Increase file watcher limit (Unix/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Or restart dev server
npm run dev
```

---

## 🔐 Security Notes

### Development

- Dependencies are from npm registry (official)
- No external API calls
- No user data collection
- No authentication required

### Production

- Enable HTTPS when deploying
- Set proper CSP headers
- Minimize exposed ports
- Keep dependencies updated

---

## 📊 Performance Tips

### Development

- Use Chrome DevTools Performance tab
- Enable React DevTools Profiler
- Check bundle size with `npm run build`

### Optimization

```bash
# Analyze bundle size
npm install -D rollup-plugin-visualizer
# Add to vite.config.js plugins

# Pre-compress assets
npm install -D vite-plugin-compression
```

---

## 🌐 Deployment Options

### Static Hosting

Works with any static host:
- **Netlify**: Drag & drop `dist/` folder
- **Vercel**: Connect Git repo, auto-deploy
- **GitHub Pages**: Push to gh-pages branch
- **AWS S3**: Upload to S3 bucket + CloudFront

### Deployment Commands

```bash
# Build for production
npm run build

# Deploy to Netlify (if CLI installed)
netlify deploy --prod --dir=dist

# Deploy to Vercel (if CLI installed)
vercel --prod

# Deploy to GitHub Pages
npm install -D gh-pages
npm run build
npx gh-pages -d dist
```

---

## 🔄 Updates & Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all to latest (careful!)
npm update

# Update specific package
npm install react@latest

# Update npm itself
npm install -g npm@latest
```

### Version Control

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote and push
git remote add origin [your-repo-url]
git push -u origin main
```

---

## 📝 Development Workflow

### Recommended Process

1. **Start dev server**
```bash
npm run dev
```

2. **Make changes** in `src/`

3. **Test in browser** (auto-reloads)

4. **Check console** for errors

5. **Build for production**
```bash
npm run build
```

6. **Test production build**
```bash
npm run preview
```

7. **Deploy** when ready

---

## 🎓 Learning Resources

### React
- [React Documentation](https://react.dev)
- [React Hooks Guide](https://react.dev/reference/react)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)
- [Vite Config Reference](https://vitejs.dev/config/)

### JavaScript
- [MDN Web Docs](https://developer.mozilla.org)
- [JavaScript.info](https://javascript.info)

---

## 💡 Tips for Developers

### VS Code Extensions

Recommended extensions:
- ES7+ React/Redux/React-Native snippets
- ESLint
- Prettier
- Auto Rename Tag
- Path Intellisense

### Debugging

```javascript
// Add breakpoint in code
debugger;

// Console logging
console.log('Debug:', variable);

// React DevTools
// Install browser extension
```

### Code Style

```bash
# Format code (if prettier installed)
npm install -D prettier
npx prettier --write src/

# Lint code
npm run lint
```

---

## ✅ Checklist

Before considering setup complete:

- [ ] Node.js and npm installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Game loads in browser
- [ ] All features work (drag, undo, touch)
- [ ] No console errors
- [ ] Production build succeeds (`npm run build`)
- [ ] Production preview works (`npm run preview`)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** - Most common issues covered
2. **Check browser console** - Look for error messages
3. **Check terminal output** - Build errors shown here
4. **Review documentation** - Check `/docs` folder
5. **Check game specification** - Rules in spec document

---

## 🎉 You're Ready!

Once setup is complete, you can:
- Start playing immediately
- Modify the code
- Add new features
- Deploy to production
- Share with others

Enjoy building and playing! 🃏
