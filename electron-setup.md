# Electron Setup Guide

## Installation

1. Install Electron dependencies:
```bash
cd frontend
npm install
```

## Development

Run the app in development mode:
```bash
npm run electron:dev
```

This will:
- Start the Vite dev server on http://localhost:5100
- Start Electron and load the dev server
- Open DevTools automatically

## Building

### Build for current platform:
```bash
npm run electron:build
```

### Build for specific platforms:

**Windows:**
```bash
npm run electron:build:win
```

**macOS:**
```bash
npm run electron:build:mac
```

**Linux:**
```bash
npm run electron:build:linux
```

## Auto-Update Configuration

Auto-update requires a GitHub repository. Update `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "your-username",
  "repo": "westbudget"
}
```

Then set `GH_TOKEN` environment variable with a GitHub personal access token.

## Icons

Place icon files in `frontend/electron/`:
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (512x512 recommended)

## Backend Integration

The Electron app expects the Flask backend to run on `http://localhost:5000`.

In production, you may want to bundle the backend with Electron or run it as a separate service.

