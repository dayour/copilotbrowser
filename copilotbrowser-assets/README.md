# copilotbrowser Asset Pack

This folder contains individual, ready-to-drop assets for copilotbrowser across:
- GitHub repo (README / social preview)
- npm / Node.js docs
- NuGet package icon
- Websites (favicon / app icons)

## Quick picks

### App / extension icon
- `icons/copilotbrowser-icon-512.png` (general)
- `app/copilotbrowser.ico` (Windows)
- `icons/copilotbrowser-icon-1024.png` (source)

### GitHub
- Social preview: `github/github-social-preview-1280x640.png`
- README banner: `github/github-readme-banner-1600x400.png`
- Transparent horizontal logo: `logos/copilotbrowser-horizontal-darkmode.png`

### npm / Node
- README banner: `npm/npm-readme-banner-1200x300.png`
- Icon (docs): `icons/copilotbrowser-icon-256.png`

### NuGet
- Package icon (128x128): `nuget/nuget-icon-128.png`

### Website
- Favicon: `favicons/favicon.ico`
- `favicons/favicon-32x32.png`

## Dark / Galaxy / Transparent variants

- **Transparent** PNGs are ideal when your UI already provides its own background.
- **Galaxy** variants are pre-composited for banners and previews (never white).

## Suggested repo layout
You can copy these folders into your repo, e.g.:

```
assets/
  icons/
  logos/
  favicons/
  github/
  npm/
  nuget/
```

## Notes
- All PNG assets are lossless and include transparency where applicable.
- If you need additional sizes (e.g. 150x150 tiles, 180x180 apple touch icons), you can derive them from `icons/copilotbrowser-icon-2048.png`.
