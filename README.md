# 🎨 Photoshop Live Ditherer

A real-time dithering plugin for Adobe Photoshop using UXP (Unified Extensibility Platform). Apply professional Floyd-Steinberg error diffusion dithering with live preview and interactive controls.

![Version](https://img.shields.io/badge/version-9034-blue)
![Photoshop](https://img.shields.io/badge/Photoshop-27.0.0%2B-31A8FF)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)

## ✨ Features
  - Processing Scale (5-50%) - Controls dithering resolution
  - Display Zoom (50-200%) - Controls canvas zoom
  - Color-coded borders: Green (pixel-perfect), Red (downscaled), Blue (upscaled)

- ✅ **6 Dithering Algorithms**
  - Floyd-Steinberg (implemented)
  - Atkinson (planned)
  - Ordered/Bayer (planned)
  - Sierra (planned)
  - Stucki (planned)
  - Burkes (planned)

- ✅ **Levels Control**
  - Black Point: 0-255
  - Mid Point (Gamma): 0.1-10.0
  - White Point: 0-255

- ✅ **8-bit RGB Mode Support**
  - Automatic document validation
  - Error messages for incompatible modes

## Installation

### 1. Install Dependencies

```bash
cd dithering-plugin
npm install
```

### 2. Build the Plugin

```bash
npm run watch    # Development mode with auto-rebuild
# OR
npm run build    # Production build
```

### 3. Load in Photoshop

1. Open **UXP Developer Tool**
2. Click **Add Plugin**
3. Navigate to `dithering-plugin` folder
4. Select `manifest.json`
5. Click **Load**
6. Open in Photoshop via **Plugins > Dithering Studio**

## Development

### Project Structure

```
src/
├── App.tsx                    # Main React component
├── index.tsx                  # Entry point
├── types.ts                   # TypeScript definitions
├── styles.css                 # Global styles
│
├── components/                # React components (future)
│
├── core/
│   └── documentValidator.ts   # Document validation
│
├── dithering/
│   └── algorithms/
│       └── floydSteinberg.ts  # Floyd-Steinberg algorithm
│
├── utils/
│   ├── displayCalculator.ts   # Preview calculations
│   └── levels.ts              # Levels adjustment
│
└── workers/                   # Web Workers (future)
```

### Current Status

**Implemented:**
- ✅ Two-slider preview system with color-coded borders
- ✅ Levels control (Black/Mid/White points)
- ✅ Floyd-Steinberg dithering algorithm
- ✅ Dynamic preview scaling and zoom
- ✅ Live preview toggle
- ✅ Test image generation (gradient)

**To Do:**
- [ ] Actual Photoshop document integration
- [ ] Remaining 5 dithering algorithms
- [ ] Color palette picker UI
- [ ] PNG export functionality
- [ ] Clipboard copy
- [ ] Web Worker implementation
- [ ] Preset system (V2.0)

### Testing

Currently uses a test gradient image. To test with real Photoshop documents, you'll need to:

1. Implement `getCompositeImageData()` in `src/core/documentValidator.ts`
2. Use Photoshop UXP APIs to get document pixel data
3. Connect to real document in `App.tsx`

### Building

```bash
npm run build    # Production build to dist/
npm run watch    # Development with auto-rebuild
npm run clean    # Remove dist/ folder
```

## Architecture

### Two-Slider Preview System

```
Document (any size)
    ↓ Processing Scale (5-50%)
Dithered Image (processed)
    ↓ Display Zoom (50-200%)
Canvas Display (with border color)
```

**Border Colors:**
- 🟢 Green @ 100%: Pixel-perfect (1:1)
- 🔴 Red @ <100%: Downscaled (losing detail)
- 🔵 Blue @ >100%: Upscaled (may be blurry)

### Processing Pipeline

1. Get document image
2. Validate (8-bit RGB only)
3. Downscale based on Processing Scale
4. Apply Levels adjustment
5. Apply dithering algorithm
6. Render to canvas at Display Zoom

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Webpack** - Build system
- **UXP** - Adobe plugin platform

## License

MIT

## Credits

Built with the comprehensive planning docs in the project root!
