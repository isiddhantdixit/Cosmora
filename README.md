# Cosmora — Immersive 3D Astronomy, Augmented Reality & Interactive Planetarium

Cosmora is a high-performance, scientifically grounded 3D astronomy web application combining an **Interactive 3D Universe** and a **Real-World Mobile AR Sky Explorer** with instant **Phone-to-PC Companion Camera Pairing**.

Built with React 19, Three.js, React Three Fiber, Astronomy Engine, Satellite.js SGP4, PeerJS WebRTC, and Tailwind CSS.

---

## 🌟 Core Highlights & Product Experiences

### 1. 🌌 Real-Time 3D Galaxy Environment
- Procedural multi-layer starfield (up to 4,500 individual stars) with Hipparcos-derived blackbody spectral temperatures (O/B blue to M red-orange).
- Structured Milky Way galactic band with natural inclination.
- Custom GLSL volumetric nebula shaders providing cyan, electric blue, and deep violet atmospheric illumination.
- Parallax depth rig responding to cursor movement on desktop and device orientation on mobile.

### 2. 📱 Augmented Reality Sky Explorer (`/explore`)
- **Direct Mobile Camera AR**: Points mobile camera towards the sky and projects celestial bodies directly onto the real camera stream using the device compass heading ($\alpha$), pitch ($\beta$), and roll ($\gamma$).
- **PC-to-Phone Companion Mode**: When launched on desktop/laptop, users can click **Pair Phone** to generate a QR code. Scanning it with a smartphone connects via peer-to-peer WebRTC (PeerJS), streaming the phone's camera video and motion gyro directly to the PC display!
- **Interactive Reticle Targeting**: Centered reticle detects aligned stars, planets, and constellations, providing instant altitude, azimuth, and astronomical telemetry.
- **Manual Drag Navigation Fallback**: If sensors are unsupported or disabled, users can drag across the celestial radar to manually pan across 360° azimuth and -85° to +85° altitude.

### 3. 🪐 Interactive 3D Planetarium (`/universe`)
- **Sky Dome Horizon View**: Local horizon coordinate sphere mapping verified stars, planets, and IAU constellation connecting lines.
- **Solar System Heliocentric View**: Explorable 3D orbital model of the Sun and the 8 major planets with scaled orbital paths.
- **Ephemeris Time Travel**: Time slider allowing users to advance or rewind observation hours and watch planetary orbital movements in real time.
- **Focus & Selection**: Click or search any object to smoothly focus the camera with orbital damping.

### 4. 🌙 Tonight's Sky Observation Planner (`/tonight`)
- Real-time horizon altitudes, azimuths, rise/transit/set calculations for all solar system planets.
- Lunar cycle calculation: Exact illuminated fraction percentage and lunar phase name (e.g. Waxing Crescent, Full Moon).
- Solar twilight determination: Automatically categorizes Day, Civil Twilight, Nautical Twilight, Astronomical Twilight, and Astronomical Night based on solar depression angle.

### 5. 🛰️ SGP4 Satellite Tracker (`/satellites`)
- Live orbital propagation from verified NORAD Two-Line Element (TLE) sets for:
  - **ISS (International Space Station)**
  - **CSS Tiangong (Chinese Space Station)**
  - **Hubble Space Telescope (HST)**
  - **Terra (EOS AM-1)**
- Computes instantaneous latitude, longitude, altitude (km), velocity (km/s), and observer topocentric look angles (Altitude & Azimuth).

### 6. 🌐 Dedicated Explorers & Deep Telemetry
- **Planet Explorer (`/planets`)**: In-depth astrophysical profiles for Sun, Mercury, Venus, Moon, Mars, Jupiter, Saturn, Uranus, Neptune.
- **Constellation Explorer (`/constellations`)**: Curated IAU constellations with star mappings and seasonal visibility windows.
- **Celestial Object Details (`/object/:id`)**: Comprehensive telemetry, coordinates, and instant "View in 3D" or "Target in AR".
- **Settings & Calibration (`/settings`)**: Automatic GPS detection, manual coordinates override, Graphics LOD, reduced motion, and compass calibration guidance.

---

## 🛠️ Technology Stack & Astronomical Architecture

| Layer | Technology |
|---|---|
| **Framework** | React 19, TypeScript, Vite |
| **Routing** | React Router v7 with URL-based lazy-loaded routes |
| **3D & WebGL** | Three.js, `@react-three/fiber`, `@react-three/drei`, Custom GLSL Shaders |
| **Astronomy Engine** | `astronomy-engine` (Don Cross — IAU SOFA, VSOP87, ELP2000 planetary ephemeris) |
| **Satellite Tracking**| `satellite.js` (SGP4 / SDP4 Keplerian propagator) |
| **AR & Sensors** | `DeviceOrientationEvent`, `MediaDevices` (camera stream), WebRTC via `peerjs` |
| **Styling** | Tailwind CSS with Cosmora design tokens, Double-Bezel glassmorphism |
| **Testing** | Vitest, React Testing Library, JSDOM |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v24)
- npm `v9+` or `v11+`

### Installation
```bash
git clone <repository-url>
cd Astro
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
Builds optimized production bundles in `dist/` with chunk splitting.

### Production Preview
```bash
npm run preview
```
Serves the production build on [http://localhost:4173](http://localhost:4173).

### Running Automated Tests
```bash
npx vitest run
```
Executes all unit and integration tests covering:
- Coordinate math (Equatorial to Cartesian, Horizontal Alt/Az, AR screen projection)
- Astronomy calculations (Planetary ephemerides, Moon phases, twilight states, rise/set)
- Catalogue integrity (Hipparcos stars, constellation lines, planetary physical parameters)
- SGP4 Satellite orbit propagation (ISS altitude, velocity, and topocentric look angles)
- LocalStorage preferences persistence

---

## 🧭 Application Routes

- `/` — **Cosmic Observatory (Home)**
- `/explore` — **AR Sky Explorer** (Mobile camera AR + PC companion sync)
- `/universe` — **Interactive 3D Planetarium** (Sky Dome & Solar System views)
- `/tonight` — **Tonight's Sky Planner** (Planetary visibilities & Moon illumination)
- `/planets` — **Planet Explorer** (Solar system physical parameters)
- `/constellations` — **Constellation Explorer** (IAU patterns & line connections)
- `/satellites` — **Satellite Tracker** (Live SGP4 ISS & spacecraft tracks)
- `/object/:id` — **Celestial Object Details** (Dedicated astrometric telemetry)
- `/settings` — **Preferences & Calibration** (GPS, units, LOD, diagnostics)
- `/companion` — **Mobile Camera Companion** (Streams camera & orientation to PC)

---

## 🔒 Privacy & Permissions
- **Zero Cloud Uploads**: Camera streams and location coordinates are processed strictly client-side.
- **WebRTC P2P**: Companion phone linking connects directly peer-to-peer using STUN without intermediary media servers.
- **Graceful Sensor Fallback**: If camera or gyroscope permissions are unavailable, Cosmora seamlessly provides interactive touch and mouse drag controls.

---

## 📜 Scientific Attribution & Data Sources
- **Stars**: Curated Hipparcos Catalogue (ESA, 1997) & Yale Bright Star Catalogue (5th Revised Ed.).
- **Planets & Ephemerides**: VSOP87 analytical theory via `astronomy-engine` (Don Cross).
- **Constellations**: International Astronomical Union (IAU) official 88 constellation boundary definitions.
- **Satellites**: Celestrak & Space-Track NORAD Two-Line Element sets propagated via SGP4.
