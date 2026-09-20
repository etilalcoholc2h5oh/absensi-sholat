import React, { useCallback, useEffect, useState } from 'react';
import { Cloud, Droplets, LocateFixed, Search, Wind, X } from 'lucide-react';

type WeatherLocation = { name: string; latitude: number; longitude: number; country?: string; admin1?: string };
type WeatherData = {
  current: { temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number; precipitation: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] };
  timezone: string;
};

// Jalan Kates is resolved through Open-Meteo geocoding at runtime so the dashboard
// uses the API's current coordinates instead of an approximate city-centre point.
const DEFAULT_LOCATION: WeatherLocation = {
  name: 'MAN 1 Boyolali, Jalan Kates',
  latitude: -7.536065,
  longitude: 110.596245,
  country: 'Indonesia',
};
const DEFAULT_SEARCH = 'MAN 1 Boyolali Jalan Kates Boyolali';

function weatherLabel(code: number) {
  if (code === 0) return 'Cerah';
  if ([1, 2, 3].includes(code)) return 'Berawan';
  if ([45, 48].includes(code)) return 'Berkabut';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Gerimis';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Hujan';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Salju';
  if ([95, 96, 99].includes(code)) return 'Badai petir';
  return 'Kondisi tidak diketahui';
}

function weatherIcon(code: number) {
  if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return 'Hujan';
  if (code === 0) return 'Cerah';
  return 'Berawan';
}

async function findLocation(query: string): Promise<WeatherLocation[]> {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=id&format=json`);
  if (!response.ok) throw new Error('Pencarian lokasi gagal.');
  const data = await response.json();
  return (data.results || []).map((item: WeatherLocation) => item);
}

async function fetchWeather(location: WeatherLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '7',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error('Data cuaca tidak dapat dimuat.');
  return response.json();
}

export const WeatherDashboard: React.FC = () => {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvingLocation, setResolvingLocation] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const loadWeather = useCallback(async (nextLocation: WeatherLocation) => {
    setLoading(true);
    setError('');
    try {
      setWeather(await fetchWeather(nextLocation));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat cuaca.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const resolveSchoolLocation = async () => {
      try {
        const matches = await findLocation(DEFAULT_SEARCH);
        if (!cancelled && matches.length > 0) setLocation({ ...matches[0], name: 'MAN 1 Boyolali, Jalan Kates' });
      } catch {
        // Keep the configured fallback coordinates if geocoding is temporarily unavailable.
      } finally {
        if (!cancelled) setResolvingLocation(false);
      }
    };
    void resolveSchoolLocation();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { void loadWeather(location); }, [loadWeather, location]);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    try {
      setResults(await findLocation(query.trim()));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pencarian lokasi gagal.');
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Browser tidak mendukung lokasi.'); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocation({ name: 'Lokasi Anda', latitude: coords.latitude, longitude: coords.longitude });
      setResults([]);
    }, () => setError('Izin lokasi belum diberikan.'));
  };

  const formatDay = (date: string) => new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));

  return (
    <section className="weather-shell max-w-7xl mx-auto mt-5" aria-label="Dashboard cuaca">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div><p className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Informasi cuaca</p><h2 className="text-2xl font-extrabold">Cuaca MAN 1 Boyolali</h2><p className="text-sm text-slate-500">Lokasi: Jalan Kates, Boyolali</p></div>
        <button type="button" onClick={() => setIsOpen((value) => !value)} className="p-2 rounded-xl border border-slate-200 text-slate-600" aria-label={isOpen ? 'Sembunyikan dashboard cuaca' : 'Tampilkan dashboard cuaca'}>{isOpen ? <X className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}</button>
      </div>
      {isOpen && <>
        <form onSubmit={search} className="relative flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex flex-1 relative"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kota atau wilayah" className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3" aria-label="Cari lokasi cuaca" /></div>
          <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">Cari lokasi</button>
          <button type="button" onClick={useCurrentLocation} className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 flex items-center justify-center gap-2"><LocateFixed className="w-5 h-5" />Lokasi saya</button>
        </form>
        {results.length > 0 && <div className="weather-results mb-3">{results.map((item) => <button type="button" key={`${item.latitude}-${item.longitude}`} onClick={() => { setLocation(item); setResults([]); setQuery(''); }} className="block w-full text-left px-4 py-3 hover:bg-slate-50"><strong>{item.name}</strong><span className="text-slate-500"> · {item.admin1 || item.country || 'Lokasi'}</span></button>)}</div>}
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 mb-3" role="alert">{error}</div>}
        {(loading || resolvingLocation) && <div className="weather-card p-6 text-slate-600">{resolvingLocation ? 'Menentukan koordinat Jalan Kates...' : 'Memuat data cuaca terbaru...'}</div>}
        {!loading && !resolvingLocation && weather && <div className="weather-card p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div><p className="text-slate-500 font-semibold">{location.name}{location.country ? `, ${location.country}` : ''}</p><p className="text-xs text-slate-500">Koordinat: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p><div className="flex items-end gap-3 mt-1"><span className="text-6xl sm:text-7xl font-black text-slate-900">{Math.round(weather.current.temperature_2m)}°</span><div className="pb-2"><p className="text-xl font-bold">{weatherLabel(weather.current.weather_code)}</p><p className="text-slate-500">Terasa {Math.round(weather.current.apparent_temperature)}°</p></div></div></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm"><div className="weather-metric"><Droplets className="w-5 h-5 text-sky-600" /><span>Kelembapan</span><strong>{weather.current.relative_humidity_2m}%</strong></div><div className="weather-metric"><Wind className="w-5 h-5 text-emerald-600" /><span>Angin</span><strong>{Math.round(weather.current.wind_speed_10m)} km/j</strong></div><div className="weather-metric"><Cloud className="w-5 h-5 text-indigo-600" /><span>Hujan saat ini</span><strong>{weather.current.precipitation} mm</strong></div></div>
          </div>
          <div className="border-t border-slate-100 mt-6 pt-5"><h3 className="font-extrabold text-lg mb-3">Prakiraan 7 hari</h3><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">{weather.daily.time.map((date, index) => <div key={date} className="weather-day"><span className="font-bold">{index === 0 ? 'Hari ini' : formatDay(date)}</span><span className="text-2xl my-2">{weatherIcon(weather.daily.weather_code[index])}</span><strong>{Math.round(weather.daily.temperature_2m_max[index])}° <span className="text-slate-400">{Math.round(weather.daily.temperature_2m_min[index])}°</span></strong><small>Peluang hujan {weather.daily.precipitation_probability_max[index]}%</small></div>)}</div></div>
          <p className="text-xs text-slate-500 mt-4">Sumber data: Open-Meteo · Koordinat lokasi ditentukan melalui pencarian Jalan Kates</p>
        </div>}
      </>}
    </section>
  );
};
