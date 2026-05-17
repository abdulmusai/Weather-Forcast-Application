import { useState, useEffect, useCallback } from "react";

// Uses Open-Meteo (free, no API key) + wttr.in for geocoding fallback
const WMO_CODES = {
  0: { label: "Clear Sky", icon: "☀️" },
  1: { label: "Mainly Clear", icon: "🌤️" },
  2: { label: "Partly Cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Icy Fog", icon: "🌫️" },
  51: { label: "Light Drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy Drizzle", icon: "🌧️" },
  61: { label: "Light Rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy Rain", icon: "🌧️" },
  71: { label: "Light Snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy Snow", icon: "❄️" },
  80: { label: "Rain Showers", icon: "🌦️" },
  81: { label: "Showers", icon: "🌧️" },
  82: { label: "Violent Showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm + Hail", icon: "⛈️" },
  99: { label: "Thunderstorm + Heavy Hail", icon: "⛈️" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getWMO(code) {
  return WMO_CODES[code] || { label: "Unknown", icon: "🌡️" };
}

function getBg(code, isDay) {
  if (!isDay) return ["#0a0e27", "#1a1f4e", "#0d1035"];
  if ([0,1].includes(code)) return ["#1a6fc4", "#56a0d3", "#f5a623"];
  if ([2,3].includes(code)) return ["#3a4a6b", "#5c6f8a", "#8899aa"];
  if ([45,48].includes(code)) return ["#5a6070", "#8a9099", "#aab0b8"];
  if (code >= 71 && code <= 77) return ["#3a5070", "#6080a0", "#c0d8f0"];
  if (code >= 95) return ["#1a1a2e", "#2d2d4e", "#4a3060"];
  return ["#2056a0", "#4a86c8", "#6aace0"]; // rain default
}

async function geocode(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const data = await res.json();
  if (!data.results?.length) throw new Error("City not found");
  const r = data.results[0];
  return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country };
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  return res.json();
}

function WindArrow({ deg }) {
  return (
    <span style={{ display: "inline-block", transform: `rotate(${deg}deg)`, fontSize: "1rem" }}>↑</span>
  );
}

function HourlyBar({ hourly, unit }) {
  if (!hourly) return null;
  const now = new Date();
  const hours = hourly.time.slice(0, 24).map((t, i) => ({
    time: new Date(t),
    temp: hourly.temperature_2m[i],
    code: hourly.weather_code[i],
    pop: hourly.precipitation_probability[i],
  })).filter(h => h.time >= now).slice(0, 10);

  return (
    <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
      {hours.map((h, i) => (
        <div key={i} style={{
          flex: "0 0 auto",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "10px 14px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          minWidth: "64px",
        }}>
          <div style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: 4 }}>
            {h.time.getHours()}:00
          </div>
          <div style={{ fontSize: "1.3rem" }}>{getWMO(h.code).icon}</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, margin: "4px 0" }}>
            {Math.round(unit === "C" ? h.temp : h.temp * 9/5 + 32)}°
          </div>
          {h.pop > 0 && (
            <div style={{ fontSize: "0.65rem", color: "#a0d8ff" }}>💧{h.pop}%</div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)",
      borderRadius: "18px",
      padding: "16px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}>
      <div style={{ fontSize: "1.2rem" }}>{icon}</div>
      <div style={{ fontSize: "0.65rem", opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [input, setInput] = useState("");
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  const [tab, setTab] = useState("today");
  const [geoLoading, setGeoLoading] = useState(false);

  const load = useCallback(async (cityName) => {
    setLoading(true);
    setError("");
    try {
      const loc = await geocode(cityName);
      const data = await fetchWeather(loc.lat, loc.lon);
      setLocation(loc);
      setWeather(data);
      setCity(cityName);
    } catch (e) {
      setError(e.message || "Failed to load weather");
    }
    setLoading(false);
  }, []);

  const detectLocation = useCallback(() => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Reverse geocode with open-meteo
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        const name = data.address?.city || data.address?.town || data.address?.village || "My Location";
        const country = data.address?.country || "";
        const wd = await fetchWeather(lat, lon);
        setLocation({ lat, lon, name, country });
        setWeather(wd);
        setCity(name);
      } catch {
        setError("Could not detect location");
      }
      setGeoLoading(false);
    }, () => { setError("Location access denied"); setGeoLoading(false); });
  }, []);

  useEffect(() => { load("Kano"); }, [load]);

  const cur = weather?.current;
  const daily = weather?.daily;
  const code = cur?.weather_code ?? 0;
  const isDay = cur?.is_day ?? 1;
  const [bg1, bg2, bg3] = getBg(code, isDay);
  const wmo = getWMO(code);

  const toTemp = (c) => unit === "C" ? Math.round(c) : Math.round(c * 9/5 + 32);
  const tempLabel = (c) => `${toTemp(c)}°${unit}`;

  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${bg1} 0%, ${bg2} 55%, ${bg3} 100%)`,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#fff",
      transition: "background 1.2s ease",
      display: "flex",
      justifyContent: "center",
      padding: "24px 16px 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        input::placeholder { color: rgba(255,255,255,0.4); }
        .search-input:focus { outline: none; border-color: rgba(255,255,255,0.4) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .weather-icon { animation: fadeUp 0.5s ease both; font-size: 6rem; line-height:1; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3)); }
        .tab-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 8px 16px; border-radius: 20px; transition: all 0.2s; letter-spacing: 0.04em; }
        .tab-btn.active { background: rgba(255,255,255,0.15); color: #fff; }
        .tab-btn:hover { color: #fff; }
        .day-row:hover { background: rgba(255,255,255,0.12) !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* Search Bar */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }} className="fade-up">
          <div style={{ flex: 1, position: "relative" }}>
            <input
              className="search-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && input.trim() && load(input.trim())}
              placeholder="Search city…"
              style={{
                width: "100%", padding: "14px 48px 14px 18px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "16px", color: "#fff", fontSize: "0.95rem",
                backdropFilter: "blur(16px)", transition: "border 0.2s",
              }}
            />
            <button onClick={() => input.trim() && load(input.trim())} style={{
              position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer",
              fontSize: "1.1rem", padding: "4px",
            }}>🔍</button>
          </div>
          <button onClick={detectLocation} title="Use my location" style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "16px", color: "#fff", cursor: "pointer", fontSize: "1.2rem",
            padding: "0 16px", backdropFilter: "blur(16px)", transition: "background 0.2s",
            display: "flex", alignItems: "center",
          }}>{geoLoading ? "⏳" : "📍"}</button>
          <button onClick={() => setUnit(u => u === "C" ? "F" : "C")} style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "16px", color: "#fff", cursor: "pointer", fontSize: "0.85rem",
            fontWeight: 700, padding: "0 14px", backdropFilter: "blur(16px)",
            minWidth: "52px", letterSpacing: "0.04em",
          }}>°{unit === "C" ? "F" : "C"}</button>
        </div>

        {error && (
          <div style={{ background: "rgba(255,80,80,0.2)", border: "1px solid rgba(255,100,100,0.3)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0", opacity: 0.7 }}>
            <div style={{ fontSize: "2.5rem", animation: "spin 1s linear infinite", display: "inline-block" }}>🌀</div>
            <div style={{ marginTop: "12px", fontSize: "0.9rem", letterSpacing: "0.06em", animation: "pulse 1.4s ease infinite" }}>LOADING WEATHER…</div>
          </div>
        )}

        {!loading && weather && cur && (
          <>
            {/* Main Card */}
            <div className="fade-up" style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "28px", padding: "28px 28px 24px",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.14)",
              marginBottom: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}>
                    {location?.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.55, marginTop: "2px", letterSpacing: "0.04em" }}>
                    {location?.country} · {dateStr}
                  </div>
                  <div style={{ marginTop: "20px", fontSize: "5rem", fontWeight: 300, fontFamily: "'Playfair Display', serif", lineHeight: 1, letterSpacing: "-0.03em" }}>
                    {tempLabel(cur.temperature_2m)}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "0.9rem", opacity: 0.7 }}>
                    Feels like {tempLabel(cur.apparent_temperature)}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "0.95rem", fontWeight: 600 }}>
                    {wmo.label}
                  </div>
                </div>
                <div className="weather-icon">{wmo.icon}</div>
              </div>

              {/* Hi/Lo */}
              {daily && (
                <div style={{ display: "flex", gap: "16px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: "0.85rem" }}>
                    ↑ <strong>{tempLabel(daily.temperature_2m_max[0])}</strong>
                  </span>
                  <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                    ↓ <strong>{tempLabel(daily.temperature_2m_min[0])}</strong>
                  </span>
                  <span style={{ fontSize: "0.85rem", marginLeft: "auto", opacity: 0.6 }}>
                    💧 {daily.precipitation_sum[0].toFixed(1)} mm
                  </span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px", animationDelay: "0.1s" }}>
              <StatCard icon="💨" label="Wind" value={`${Math.round(cur.wind_speed_10m)} km/h`} />
              <StatCard icon="💧" label="Humidity" value={`${cur.relative_humidity_2m}%`} />
              <StatCard icon="☀️" label="UV Index" value={cur.uv_index ?? "—"} />
            </div>

            {/* Sunrise/Sunset */}
            {daily && (
              <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", animationDelay: "0.15s" }}>
                <StatCard icon="🌅" label="Sunrise" value={new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                <StatCard icon="🌇" label="Sunset" value={new Date(daily.sunset[0]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              </div>
            )}

            {/* Tabs */}
            <div className="fade-up" style={{ animationDelay: "0.2s" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
                {["today", "week"].map(t => (
                  <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                    {t === "today" ? "Hourly" : "7-Day Forecast"}
                  </button>
                ))}
              </div>

              {tab === "today" && (
                <div style={{
                  background: "rgba(255,255,255,0.07)", borderRadius: "22px", padding: "18px",
                  backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <HourlyBar hourly={weather.hourly} unit={unit} />
                </div>
              )}

              {tab === "week" && daily && (
                <div style={{
                  background: "rgba(255,255,255,0.07)", borderRadius: "22px", padding: "8px",
                  backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {daily.time.map((t, i) => {
                    const d = new Date(t);
                    const isToday = i === 0;
                    return (
                      <div key={i} className="day-row" style={{
                        display: "flex", alignItems: "center", padding: "12px 14px",
                        borderRadius: "14px", transition: "background 0.2s",
                        background: isToday ? "rgba(255,255,255,0.09)" : "transparent",
                      }}>
                        <div style={{ width: "44px", fontSize: "0.85rem", fontWeight: isToday ? 700 : 400, opacity: isToday ? 1 : 0.7 }}>
                          {isToday ? "Today" : DAYS[d.getDay()]}
                        </div>
                        <div style={{ fontSize: "1.3rem", width: "36px", textAlign: "center" }}>
                          {getWMO(daily.weather_code[i]).icon}
                        </div>
                        <div style={{ flex: 1, fontSize: "0.75rem", opacity: 0.5, paddingLeft: "8px" }}>
                          {getWMO(daily.weather_code[i]).label}
                        </div>
                        <div style={{ fontSize: "0.8rem", opacity: 0.5, marginRight: "12px" }}>
                          {tempLabel(daily.temperature_2m_min[i])}
                        </div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                          {tempLabel(daily.temperature_2m_max[i])}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wind direction detail */}
            <div className="fade-up" style={{
              marginTop: "14px",
              background: "rgba(255,255,255,0.07)", borderRadius: "18px", padding: "14px 18px",
              backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", gap: "10px",
              animationDelay: "0.25s",
            }}>
              <WindArrow deg={cur.wind_direction_10m} />
              <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Wind direction {cur.wind_direction_10m}°</span>
              <span style={{ marginLeft: "auto", fontSize: "0.85rem", fontWeight: 600 }}>{Math.round(cur.wind_speed_10m)} km/h</span>
            </div>

            <div style={{ textAlign: "center", marginTop: "22px", fontSize: "0.65rem", opacity: 0.3, letterSpacing: "0.06em" }}>
              POWERED BY EMRAAD ADVANCED TECHNOLOGY · DATA UPDATES HOURLY
            </div>
          </>
        )}
      </div>
    </div>
  );
}
