# 🌦️ My Weather App

A modern, AI-powered weather application built with **React + Vite**, featuring real-time weather data and an intelligent Claude AI assistant for natural language search, personalized briefings, activity recommendations, and conversational weather insights.

---

## ✨ Features

### 🌍 Real-Time Weather Data
- Current conditions — temperature, feels like, humidity, wind speed & direction, UV index
- Hourly forecast for the next 10 hours with precipitation probability
- 7-day daily forecast with high/low temperatures and weather icons
- Sunrise & sunset times
- Dynamic background that changes based on weather condition and time of day

### 🤖 AI-Powered Features (Claude)
- **Natural Language Search** — search by typing full questions like *"Is it raining in Tokyo?"*
- **Auto AI Briefing** — a vivid 2-sentence weather summary generated on every city load
- **Activity Recommender** — Claude suggests 4 activities suited to current conditions, marked ✓ or ⚠
- **Conversational AI Chat** — ask anything about weather, outfits, plans, or forecasts

### 📍 Location Features
- GPS auto-detection via browser geolocation
- City search with geocoding
- °C / °F toggle

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 8 |
| Weather API | [Open-Meteo](https://open-meteo.com/) (free, no key needed) |
| Geocoding | Open-Meteo Geocoding API |
| Reverse Geocoding | Nominatim (OpenStreetMap) |
| AI | [Anthropic Claude](https://www.anthropic.com/) (`claude-sonnet-4-20250514`) |
| Styling | Inline CSS + Google Fonts (DM Sans, Playfair Display) |

---

## 📁 Project Structure

```
my-weather-app/
├── public/
├── src/
│   ├── assets/
│   ├── App.css
│   ├── App.jsx          ← Root component
│   ├── index.css
│   ├── main.jsx         ← Entry point
│   └── weatherapp.jsx   ← Main weather app component
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/my-weather-app.git

# 2. Navigate into the project
cd my-weather-app

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Configuration

The app uses the **Anthropic API** for AI features. The API key is handled by the Claude.ai artifact environment. If you are running this outside of Claude.ai (i.e. in your own Vite project), you will need to supply your own key.

Create a `.env` file in the root:

```env
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

Then update the `callClaude` function in `weatherapp.jsx`:

```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
}
```

> ⚠️ Never commit your API key to GitHub. Make sure `.env` is in your `.gitignore`.

---

## 📸 Screenshots

| Dashboard | AI Chat | Activities |
|---|---|---|
| ☀️ Live weather card | 💬 Ask anything | 🎯 Smart suggestions |

---

## 🧩 Key Components

### `weatherapp.jsx`
| Component | Description |
|---|---|
| `WeatherApp` | Root component, manages all state and data fetching |
| `HourlyBar` | Scrollable hourly forecast strip |
| `StatCard` | Reusable stat display (wind, humidity, UV, etc.) |
| `WindArrow` | Rotates based on wind direction degrees |
| `TypingDots` | Animated loading indicator for AI chat |

### AI Functions
| Function | What it does |
|---|---|
| `callClaude()` | Base function for all Anthropic API calls |
| `aiResolveCity()` | Extracts city name from natural language queries |
| `aiWeatherBriefing()` | Generates a witty 2-sentence weather summary |
| `aiActivities()` | Returns 4 JSON activity recommendations for current weather |

---

## 🐛 Common Issues & Fixes

### Blank white page on startup
Your `App.jsx` component name must be capitalized:
```jsx
// ❌ Wrong
import weatherapp from './weatherapp'
<weatherapp />

// ✅ Correct
import WeatherApp from './weatherapp'
<WeatherApp />
```

### ESLint warnings about unused variables
Remove unused imports. For example, if `useState` isn't used in `App.jsx`, remove it:
```jsx
// ❌ Remove this if not used in App.jsx
import { useState } from 'react'
```

### City not found error
- Check spelling and try the English name of the city
- Some small towns may not be in the Open-Meteo geocoding database

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder. Deploy to Vercel, Netlify, or any static host.

```bash
# Preview the production build locally
npm run preview
```

---

## 🌐 Deployment

### Deploy to Vercel (recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag and drop the dist/ folder to netlify.com/drop
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Credits

- Weather data — [Open-Meteo](https://open-meteo.com/)
- Reverse geocoding — [Nominatim / OpenStreetMap](https://nominatim.org/)
- AI assistant — [Anthropic Claude](https://www.anthropic.com/)
- Fonts — [Google Fonts](https://fonts.google.com/) (DM Sans, Playfair Display)

---

<div align="center">
  Built with ❤️ using React, Vite, and Claude AI
</div>
