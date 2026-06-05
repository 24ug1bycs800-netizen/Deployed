import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useCityStore } from "../store/useCityStore.js";
import {
  LayoutDashboard, Film, Calendar, PlusCircle, AlertCircle,
  CheckCircle, BarChart3, LineChart, PieChart, Users, Wallet,
  Compass, Plus, Trash2,
} from "lucide-react";
import api from "../services/api.js";

interface KPI {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeGroupRooms: number;
}

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const ALL_SHOWTIMES = [
  { label: "09:00 AM", hour: 9 },
  { label: "12:30 PM", hour: 12 },
  { label: "03:45 PM", hour: 15 },
  { label: "06:30 PM", hour: 18 },
  { label: "09:30 PM", hour: 21 },
  { label: "11:45 PM", hour: 23 },
];

const getAvailableShowtimes = (selectedDate: string): string[] => {
  const isToday = selectedDate === getToday();
  if (!isToday) return ALL_SHOWTIMES.map((s) => s.label);
  const currentHour = new Date().getHours();
  return ALL_SHOWTIMES.filter((s) => s.hour > currentHour).map((s) => s.label);
};

const getNearestShowtime = (selectedDate?: string): string => {
  const available = getAvailableShowtimes(selectedDate ?? getToday());
  return available[0] ?? "09:00 AM";
};

interface TheatreSlot {
  screenId: string;
  showTime: string;
  priceReg: string;
  pricePrem: string;
  priceRec: string;
}

interface ScreenOption {
  value: string;
  label: string;
}

const defaultSlot = (date?: string): TheatreSlot => ({
  screenId: "",
  showTime: getNearestShowtime(date),
  priceReg: "150",
  pricePrem: "250",
  priceRec: "450",
});

const TAB_LABELS: Record<string, string> = {
  "dashboard": "Analytics Dashboard",
  "add-movie": "Add New Movie",
  "add-show": "Schedule Showtime",
  "manage": "Manage Data",
};

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const {} = useCityStore();
  const navigate = useNavigate();

  const [kpi, setKpi] = useState<KPI | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [screenOptions, setScreenOptions] = useState<ScreenOption[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "add-movie" | "add-show" | "manage">("dashboard");

  // Add Movie states
  const [movieTitle, setMovieTitle] = useState("");
  const [movieDesc, setMovieDesc] = useState("");
  const [movieGenre, setMovieGenre] = useState("");
  const [movieLang, setMovieLang] = useState("Hindi");
  const [movieDur, setMovieDur] = useState("135");
  const [movieRating, setMovieRating] = useState("UA");
  const [movieRel, setMovieRel] = useState(getToday());
  const [moviePoster, setMoviePoster] = useState("/assets/chand_mera_dil.jpg");
  const [movieShowing, setMovieShowing] = useState(true);

  // Add Show states
  const [showMovieId, setShowMovieId] = useState("");
  const [showDate, setShowDate] = useState(getToday());
  const [theatreSlots, setTheatreSlots] = useState<TheatreSlot[]>([
    defaultSlot(getToday()),
    defaultSlot(getToday()),
  ]);
  const getMovieTitle = (movieId: number) => {
  const movie = movies.find((m) => m.id === movieId);
  return movie ? movie.title : `Movie ${movieId}`;
};

  const groupedShows = shows.reduce((acc, show) => {
  const movieTitle = getMovieTitle(show.movieId);

  if (!acc[movieTitle]) {
    acc[movieTitle] = [];
  }

  acc[movieTitle].push(show);

  return acc;
}, {} as Record<string, any[]>);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  
  // ✅ Fix 1: fetchMoviesAndShows defined INSIDE component so it can access setMovies/setShows
  const fetchMoviesAndShows = async () => {
  try {
    const [moviesRes, showsRes, screensRes] = await Promise.all([
      api.get("/admin/movies"),
      api.get("/admin/shows"),
      api.get("/admin/screens"),
    ]);

    setMovies(moviesRes.data || []);
    setShows(showsRes.data || []);
    const screens = (screensRes.data || []).map((screen: any) => ({
      value: String(screen.id),
      label: `Screen ${screen.number} - ${screen.type} (Theatre #${screen.theatreId}, ID ${screen.id})`,
    }));
    setScreenOptions(screens);
    setTheatreSlots((prev) =>
      prev.map((slot, idx) => ({
        ...slot,
        screenId: slot.screenId || screens[idx]?.value || screens[0]?.value || "",
      }))
    );
  } catch (err) {
    console.error("Failed to load movies/shows for manage tab:", err);
  }
};

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setKpi(res.data.kpi);
      setCharts(res.data.charts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchStats();
    fetchMoviesAndShows();
  }, [user]);

  const updateSlot = (idx: number, field: keyof TheatreSlot, value: string) => {
    setTheatreSlots((prev) => prev.map((slot, i) => (i === idx ? { ...slot, [field]: value } : slot)));
  };

  const addSlot = () => setTheatreSlots((prev) => [...prev, defaultSlot(showDate)]);

  const handleDateChange = (value: string) => {
    setShowDate(value);
    const firstAvailable = getNearestShowtime(value);
    setTheatreSlots((prev) => prev.map((slot) => ({ ...slot, showTime: firstAvailable })));
  };

  const removeSlot = (idx: number) => {
    if (theatreSlots.length <= 2) {
      setErr("Minimum 2 theatre slots are required per movie.");
      return;
    }
    setTheatreSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await api.post("/admin/movies", {
        title: movieTitle, description: movieDesc, genre: movieGenre,
        language: movieLang, durationMins: parseInt(movieDur), rating: movieRating,
        releaseDate: movieRel, posterUrl: moviePoster, isNowShowing: movieShowing,
      });
      setMsg("Movie added successfully!");
      setMovieTitle(""); setMovieDesc(""); setMovieGenre("");
      fetchStats();
      fetchMoviesAndShows();
    } catch (error: any) {
      setErr(error.response?.data?.error || "Failed to add movie.");
    }
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setErr("");
    if (theatreSlots.length < 2) { setErr("Please add at least 2 theatre slots."); return; }
    if (theatreSlots.some((slot) => !slot.screenId)) {
      setErr("No screens are available. Please seed screens before scheduling showtimes.");
      return;
    }
    try {
      await Promise.all(
        theatreSlots.map((slot) =>
          api.post("/admin/shows", {
            movieId: parseInt(showMovieId), screenId: parseInt(slot.screenId),
            startTime: slot.showTime, date: showDate,
            priceRegular: parseInt(slot.priceReg), pricePremium: parseInt(slot.pricePrem),
            priceRecliner: parseInt(slot.priceRec),
          })
        )
      );
      setMsg(`${theatreSlots.length} showtime slots scheduled successfully!`);
      setShowMovieId(""); setShowDate(getToday());
      setTheatreSlots([
        { ...defaultSlot(getToday()), screenId: screenOptions[0]?.value || "" },
        { ...defaultSlot(getToday()), screenId: screenOptions[1]?.value || screenOptions[0]?.value || "" },
      ]);
      fetchStats();
      fetchMoviesAndShows();
    } catch (error: any) {
      setErr(error.response?.data?.error || "Failed to schedule showtime(s).");
    }
  };

  // ✅ Fix 2: Delete handlers use correct routes
  const handleDeleteMovie = async (id: number) => {
    if (!window.confirm("Delete this movie?")) return;
    try {
      await api.delete(`/admin/movies/${id}`);
      setMsg("Movie deleted successfully");
      fetchMoviesAndShows();
    } catch (e) {
      setErr("Failed to delete movie");
    }
  };

  const handleDeleteShow = async (id: number) => {
    if (!window.confirm("Delete this show?")) return;
    try {
      await api.delete(`/admin/shows/${id}`);
      setMsg("Show deleted successfully");
      fetchMoviesAndShows();
    } catch (e) {
      setErr("Failed to delete show");
    }
  };

  if (!kpi || !charts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-12 h-12 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 font-poppins relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-wider flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-primary" /> Admin Console
            </h1>
            <p className="text-xs text-neutral-500 font-inter mt-1.5">
              Overview of CineCircle operations, transactional revenues, and database inventory.
            </p>
          </div>

          {/* ✅ Fix 3: Tab labels now correctly inside the map */}
          <div className="flex gap-2 text-xs font-semibold flex-wrap">
            {(["dashboard", "add-movie", "add-show", "manage"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMsg(""); setErr(""); }}
                className={`px-4 py-2 rounded-xl border transition-all ${
                  activeTab === tab
                    ? "border-primary bg-primary bg-opacity-20 text-white"
                    : "border-neutral-900 bg-neutral-950 bg-opacity-40 text-muted"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* ALERTS */}
        {msg && (
          <div className="p-4 bg-success bg-opacity-10 border border-success border-opacity-30 rounded-xl flex items-center gap-2 text-sm text-green-400 font-inter">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />{msg}
          </div>
        )}
        {err && (
          <div className="p-4 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-xl flex items-center gap-2.5 text-sm text-red-400 font-inter">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{err}
          </div>
        )}

        {/* ── ANALYTICS DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <div className="p-2.5 bg-primary bg-opacity-10 rounded-xl w-fit mb-4"><Wallet className="w-5 h-5 text-primary" /></div>
                <span className="block text-xs text-neutral-500 font-inter">Total Revenue</span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">Rs {kpi.totalRevenue}</strong>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <div className="p-2.5 bg-accent bg-opacity-10 rounded-xl w-fit mb-4"><Film className="w-5 h-5 text-accent" /></div>
                <span className="block text-xs text-neutral-500 font-inter">Total Bookings</span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">{kpi.totalBookings} tickets</strong>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <div className="p-2.5 bg-indigo-600 bg-opacity-10 rounded-xl w-fit mb-4"><Users className="w-5 h-5 text-indigo-400" /></div>
                <span className="block text-xs text-neutral-500 font-inter">Registered Users</span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">{kpi.totalUsers} users</strong>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <div className="p-2.5 bg-success bg-opacity-10 rounded-xl w-fit mb-4"><BarChart3 className="w-5 h-5 text-success" /></div>
                <span className="block text-xs text-neutral-500 font-inter">Planning Rooms</span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">{kpi.activeGroupRooms} active</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <LineChart className="w-4 h-4 text-primary" /> Daily Revenue Trends
                </h3>
                <div className="h-48 flex items-end gap-3 justify-around pt-6 font-inter text-[9px] text-neutral-500">
                  {charts.dailyBookings.map((dbPoint: any, idx: number) => {
                    const maxVal = Math.max(...charts.dailyBookings.map((p: any) => p.revenue), 1);
                    const barHeight = Math.max(8, (dbPoint.revenue / maxVal) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-full">
                        <span className="text-white font-bold">Rs {dbPoint.revenue}</span>
                        <div className="w-full bg-neutral-900 rounded-lg overflow-hidden h-32 flex items-end">
                          <div className="w-full bg-primary rounded-lg transition-all duration-700" style={{ height: `${barHeight}%` }} />
                        </div>
                        <span className="truncate max-w-10">{dbPoint.date.substring(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <BarChart3 className="w-4 h-4 text-accent" /> Popular Movies by Revenue
                </h3>
                <div className="space-y-4 pt-2">
                  {charts.popularMovies.slice(0, 4).map((moviePoint: any, idx: number) => {
                    const maxVal = Math.max(...charts.popularMovies.map((p: any) => p.revenue), 1);
                    return (
                      <div key={idx} className="space-y-1 font-inter text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-white">{moviePoint.title}</span>
                          <span className="text-neutral-500">Rs {moviePoint.revenue} ({moviePoint.bookings})</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${(moviePoint.revenue / maxVal) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <Compass className="w-4 h-4 text-indigo-400" /> Location Breakdown
                </h3>
                <div className="space-y-4 pt-2">
                  {charts.popularCities.slice(0, 4).map((cityPoint: any, idx: number) => {
                    const maxVal = Math.max(...charts.popularCities.map((p: any) => p.bookings), 1);
                    return (
                      <div key={idx} className="space-y-1 font-inter text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-white">{cityPoint.name}</span>
                          <span className="text-neutral-500">{cityPoint.bookings} tickets</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(cityPoint.bookings / maxVal) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <PieChart className="w-4 h-4 text-success" /> Booking Model Mix
                </h3>
                <div className="flex items-center justify-around h-40 pt-4">
                  {charts.groupBookingUsage.map((usage: any, idx: number) => {
                    const totalVal = charts.groupBookingUsage.reduce((sum: number, u: any) => sum + u.value, 0) || 1;
                    const percent = Math.round((usage.value / totalVal) * 100);
                    return (
                      <div key={idx} className="text-center font-inter">
                        <div className={`text-3xl font-black ${idx === 0 ? "text-primary" : "text-success"}`}>{percent}%</div>
                        <div className="text-xs text-neutral-500 font-semibold mt-2">{usage.name}</div>
                        <div className="text-[10px] text-neutral-600 mt-1">{usage.value} bookings</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD MOVIE ── */}
        {activeTab === "add-movie" && (
          <div className="p-8 rounded-2xl bg-card border border-neutral-900 max-w-3xl mx-auto w-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" /> Add New Movie Details
            </h2>
            <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-5 font-inter text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Movie Title</label>
                <input type="text" required placeholder="e.g. Karuppu" value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Genre Tags</label>
                <input type="text" required placeholder="e.g. Action/Thriller" value={movieGenre} onChange={(e) => setMovieGenre(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Synopsis</label>
                <textarea required rows={4} placeholder="Write a description..." value={movieDesc} onChange={(e) => setMovieDesc(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Language</label>
                <select value={movieLang} onChange={(e) => setMovieLang(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white">
                  {["Hindi","Kannada","Tamil","Telugu","Malayalam","English"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Duration (Minutes)</label>
                <input type="number" required value={movieDur} onChange={(e) => setMovieDur(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Censor Rating</label>
                <select value={movieRating} onChange={(e) => setMovieRating(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white">
                  <option value="U">U (Universal)</option>
                  <option value="UA">UA (Parental Guidance)</option>
                  <option value="A">A (Adults Only)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Release Date</label>
                <input type="date" required value={movieRel} min={getToday()} onChange={(e) => setMovieRel(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Poster Asset Path</label>
               <input
  type="text"
  value={moviePoster}
  onChange={(e) => setMoviePoster(e.target.value)}
  placeholder="Paste poster image URL"
  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
/>

{moviePoster && (
  <div className="mt-4">
    <img
      src={moviePoster}
      alt="Poster Preview"
      className="w-32 h-48 object-cover rounded-lg border border-neutral-800"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  </div>
)}

              </div>
              <div className="flex items-center gap-3.5 mt-6">
                <input type="checkbox" id="showing" checked={movieShowing} onChange={(e) => setMovieShowing(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-950 border border-neutral-900 text-primary" />
                <label htmlFor="showing" className="font-bold text-white cursor-pointer">Set as Now Showing</label>
              </div>
              <button type="submit" className="md:col-span-2 py-3 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl shadow-xl transition-all text-xs">
                Add Movie to Catalog
              </button>
            </form>
          </div>
        )}

        {/* ── SCHEDULE SHOWTIME ── */}
        {activeTab === "add-show" && (
          <div className="p-8 rounded-2xl bg-card border border-neutral-900 max-w-3xl mx-auto w-full">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Schedule Showtime Slots
            </h2>
            <p className="text-[10px] text-neutral-500 font-inter mb-6">Minimum 2 theatre screens required per movie.</p>
            <form onSubmit={handleAddShow} className="space-y-6 font-inter text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Movie ID</label>
                  <input type="number" required placeholder="e.g. 1" value={showMovieId} onChange={(e) => setShowMovieId(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Show Date</label>
                  <input type="date" required value={showDate} min={getToday()} onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white" />
                </div>
              </div>

              <div className="space-y-4">
                {theatreSlots.map((slot, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-neutral-800 bg-neutral-950 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Theatre Slot #{idx + 1}
                        {idx < 2 && <span className="ml-2 text-neutral-600 normal-case font-normal">(required)</span>}
                      </span>
                      {theatreSlots.length > 2 && (
                        <button type="button" onClick={() => removeSlot(idx)} className="text-red-500 hover:text-red-400 p-1 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Screen</label>
                        <select value={slot.screenId} onChange={(e) => updateSlot(idx, "screenId", e.target.value)}
                          disabled={screenOptions.length === 0}
                          className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-primary focus:outline-none text-white disabled:opacity-60">
                          {screenOptions.length === 0 && <option value="">No screens available</option>}
                          {screenOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Showtime</label>
                        {(() => {
                          const available = getAvailableShowtimes(showDate);
                          return available.length === 0 ? (
                            <div className="w-full p-3 bg-neutral-900 border border-red-900 rounded-xl text-red-400 text-[10px]">
                              No more shows today. Pick a future date.
                            </div>
                          ) : (
                            <select value={slot.showTime} onChange={(e) => updateSlot(idx, "showTime", e.target.value)}
                              className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-primary focus:outline-none text-white">
                              {available.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[["priceReg","Regular"],["pricePrem","Premium"],["priceRec","Recliner"]].map(([field, label]) => (
                        <div key={field}>
                          <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-2">{label} (Rs)</label>
                          <input type="number" required value={slot[field as keyof TheatreSlot]}
                            onChange={(e) => updateSlot(idx, field as keyof TheatreSlot, e.target.value)}
                            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-primary focus:outline-none text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addSlot}
                className="w-full py-2.5 border border-dashed border-neutral-700 rounded-xl text-neutral-500 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 text-xs font-semibold">
                <Plus className="w-3.5 h-3.5" /> Add Another Theatre Slot
              </button>
              <button type="submit"
                className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl shadow-xl transition-all text-xs">
                Schedule {theatreSlots.length} Showtime Slot{theatreSlots.length > 1 ? "s" : ""}
              </button>
            </form>
          </div>
        )}

        {/* Manage Tab */}
{activeTab === "manage" && (
  <div className="space-y-8">
<div className="grid grid-cols-2 gap-4">
  <div className="p-4 rounded-xl bg-neutral-900">
    <p className="text-sm text-neutral-400">Total Movies</p>
    <h2 className="text-3xl font-bold">{movies.length}</h2>
  </div>

  <div className="p-4 rounded-xl bg-neutral-900">
    <p className="text-sm text-neutral-400">Total Shows</p>
    <h2 className="text-3xl font-bold">{shows.length}</h2>
  </div>
</div>
    {/* Movies */}
    <div className="p-6 rounded-2xl bg-card border border-neutral-900">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Film className="w-5 h-5 text-primary" />
        Movies
      </h2>

      {movies.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4 text-center">
          No movies found.
        </p>
      ) : (
        movies.map((movie) => (
          <div
            key={movie.id}
            className="flex justify-between items-center p-4 rounded-xl bg-neutral-900 border border-neutral-800 mb-3"
          >
            <div className="flex items-center gap-4">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 h-24 rounded-lg object-cover"
              />

              <div>
                <h3 className="font-semibold text-white">
                  {movie.title}
                </h3>

                <p className="text-sm text-neutral-400">
                  {movie.genre}
                </p>

                <p className="text-sm text-neutral-500">
                  {movie.language}
                </p>

                <p className="text-xs text-neutral-600">
                  Movie ID: {movie.id}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDeleteMovie(movie.id)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        ))
      )}
    </div>

    {/* Shows */}
    <div className="p-6 rounded-2xl bg-card border border-neutral-900">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-accent" />
        Showtime Management
      </h2>

      {shows.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4 text-center">
          No shows found.
        </p>
      ) : (
        Object.entries(groupedShows).map(([movieTitle, movieShows]) => (
          <div
            key={movieTitle}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4"
          >
            <h3 className="text-lg font-bold mb-3">
              🎬 {movieTitle} ({(movieShows as any[]).length} shows)
            </h3>

            {(movieShows as any[]).map((show: any) => (
              <div
                key={show.id}
                className="flex justify-between items-center border-t border-neutral-800 py-3"
              >
                <div>
                  <p className="font-medium">
                    Screen {show.screenId} • Show #{show.id}
                  </p>

                  <p className="text-sm text-neutral-400">
                    {show.date} • {show.startTime}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteShow(show.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>

  </div>
)}

      </div>
    </div>
  );
};
