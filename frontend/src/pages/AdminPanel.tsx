import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useCityStore } from "../store/useCityStore.js";
import {
  LayoutDashboard,
  Film,
  Calendar,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  LineChart,
  PieChart,
  Users,
  Wallet,
} from "lucide-react";
import api from "../services/api.js";

interface KPI {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeGroupRooms: number;
}

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { selectedCity } = useCityStore();
  const navigate = useNavigate();

  const [kpi, setKpi] = useState<KPI | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "add-movie" | "add-show"
  >("dashboard");

  // Form states - Add Movie
  const [movieTitle, setMovieTitle] = useState("");
  const [movieDesc, setMovieDesc] = useState("");
  const [movieGenre, setMovieGenre] = useState("");
  const [movieLang, setMovieLang] = useState("Hindi");
  const [movieDur, setMovieDur] = useState("135");
  const [movieRating, setMovieRating] = useState("UA");
  const [movieRel, setMovieRel] = useState("2026-06-15");
  const [moviePoster, setMoviePoster] = useState("/assets/chand_mera_dil.jpg");
  const [movieShowing, setMovieShowing] = useState(true);

  // Form states - Add Show
  const [showMovieId, setShowMovieId] = useState("");
  const [showScreenId, setShowScreenId] = useState("1");
  const [showTime, setShowTime] = useState("06:30 PM");
  const [showDate, setShowDate] = useState("2026-05-31");
  const [showPriceReg, setShowPriceReg] = useState("150");
  const [showPricePrem, setShowPricePrem] = useState("250");
  const [showPriceRec, setShowPriceRec] = useState("450");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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
  }, [user]);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await api.post("/admin/movies", {
        title: movieTitle,
        description: movieDesc,
        genre: movieGenre,
        language: movieLang,
        durationMins: parseInt(movieDur),
        rating: movieRating,
        releaseDate: movieRel,
        posterUrl: moviePoster,
        isNowShowing: movieShowing,
      });
      setMsg("Movie added successfully!");
      // Reset
      setMovieTitle("");
      setMovieDesc("");
      setMovieGenre("");
      fetchStats();
    } catch (error: any) {
      setErr(error.response?.data?.error || "Failed to add movie.");
    }
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await api.post("/admin/shows", {
        movieId: parseInt(showMovieId),
        screenId: parseInt(showScreenId),
        startTime: showTime,
        date: showDate,
        priceRegular: parseInt(showPriceReg),
        pricePremium: parseInt(showPricePrem),
        priceRecliner: parseInt(showPriceRec),
      });
      setMsg("Showtime scheduled successfully!");
      // Reset
      setShowMovieId("");
      fetchStats();
    } catch (error: any) {
      setErr(error.response?.data?.error || "Failed to schedule showtime.");
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
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-wider flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-primary " /> Admin
              Console
            </h1>
            <p className="text-xs text-neutral-500 font-inter mt-1.5">
              Overview of CineCircle operations, transactional revenues, and
              database inventory.
            </p>
          </div>

          {/* MOCK TABS SELECT */}
          <div className="flex gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMsg("");
                setErr("");
              }}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeTab === "dashboard"
                  ? "border-primary bg-primary bg-opacity-20 text-white"
                  : "border-neutral-900 bg-neutral-950 bg-opacity-40 text-muted"
              }`}
            >
              Analytics Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab("add-movie");
                setMsg("");
                setErr("");
              }}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeTab === "add-movie"
                  ? "border-primary bg-primary bg-opacity-20 text-white"
                  : "border-neutral-900 bg-neutral-950 bg-opacity-40 text-muted"
              }`}
            >
              Add New Movie
            </button>
            <button
              onClick={() => {
                setActiveTab("add-show");
                setMsg("");
                setErr("");
              }}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeTab === "add-show"
                  ? "border-primary bg-primary bg-opacity-20 text-white"
                  : "border-neutral-900 bg-neutral-950 bg-opacity-40 text-muted"
              }`}
            >
              Schedule Showtime
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {msg && (
          <div className="p-4 bg-success bg-opacity-10 border border-success border-opacity-30 rounded-xl flex items-center gap-2 text-sm text-green-400 font-inter">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {msg}
          </div>
        )}
        {err && (
          <div className="p-4 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-xl flex items-center gap-2.5 text-sm text-red-400 font-inter">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {err}
          </div>
        )}

        {/* 1. ANALYTICS DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* KPI METRICS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 relative overflow-hidden">
                <div className="p-2.5 bg-primary bg-opacity-10 rounded-xl text-primary w-fit mb-4">
                  <Wallet className="w-5 h-5 text-primary " />
                </div>
                <span className="block text-xs text-neutral-500 font-inter">
                  Total Revenue
                </span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">
                  Rs {kpi.totalRevenue}
                </strong>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 relative overflow-hidden">
                <div className="p-2.5 bg-accent bg-opacity-10 rounded-xl text-accent w-fit mb-4">
                  <Film className="w-5 h-5" />
                </div>
                <span className="block text-xs text-neutral-500 font-inter">
                  Total Bookings
                </span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">
                  {kpi.totalBookings} tickets
                </strong>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 relative overflow-hidden">
                <div className="p-2.5 bg-indigo-600 bg-opacity-10 rounded-xl text-indigo-400 w-fit mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <span className="block text-xs text-neutral-500 font-inter">
                  Registered Users
                </span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">
                  {kpi.totalUsers} users
                </strong>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 relative overflow-hidden">
                <div className="p-2.5 bg-success bg-opacity-10 rounded-xl text-success w-fit mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="block text-xs text-neutral-500 font-inter">
                  Planning Rooms
                </span>
                <strong className="text-xl sm:text-2xl font-black text-white mt-1.5 block">
                  {kpi.activeGroupRooms} active
                </strong>
              </div>
            </div>

            {/* DYNAMIC CHARTS METRIC GRID (Custom SVG/HTML Bars render) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Daily Bookings Chart */}
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <LineChart className="w-4 h-4 text-primary" /> Daily Revenue
                  Trends (Last 7 Days)
                </h3>
                <div className="h-48 flex items-end gap-3 justify-around pt-6 font-inter text-[9px] text-neutral-500">
                  {charts.dailyBookings.map((dbPoint: any, idx: number) => {
                    const maxVal = Math.max(
                      ...charts.dailyBookings.map((p: any) => p.revenue),
                      1,
                    );
                    const barHeight = Math.max(
                      8,
                      (dbPoint.revenue / maxVal) * 100,
                    );

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2 w-full"
                      >
                        <span className="text-white font-bold">
                          Rs {dbPoint.revenue}
                        </span>
                        <div className="w-full bg-neutral-900 border border-neutral-850 rounded-lg overflow-hidden h-32 flex items-end">
                          <div
                            className="w-full bg-primary rounded-lg transition-all duration-700 shadow-xl"
                            style={{ height: `${barHeight}%` }}
                          ></div>
                        </div>
                        <span className="truncate max-w-10">
                          {dbPoint.date.substring(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Popular Movies */}
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <BarChart3 className="w-4 h-4 text-accent" /> Popular Movies
                  by Revenue
                </h3>
                <div className="space-y-4 pt-2">
                  {charts.popularMovies
                    .slice(0, 4)
                    .map((moviePoint: any, idx: number) => {
                      const maxVal = Math.max(
                        ...charts.popularMovies.map((p: any) => p.revenue),
                        1,
                      );
                      const barWidth = (moviePoint.revenue / maxVal) * 100;

                      return (
                        <div key={idx} className="space-y-1 font-inter text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white">
                              {moviePoint.title}
                            </span>
                            <span className="text-neutral-500">
                              Rs {moviePoint.revenue} ({moviePoint.bookings}{" "}
                              bookings)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-neutral-900 border border-neutral-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-700 shadow-xl"
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Popular Cities */}
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <Compass className="w-4 h-4 text-indigo-400" /> Location
                  Breakdown (Tickets Booked)
                </h3>
                <div className="space-y-4 pt-2">
                  {charts.popularCities
                    .slice(0, 4)
                    .map((cityPoint: any, idx: number) => {
                      const maxVal = Math.max(
                        ...charts.popularCities.map((p: any) => p.bookings),
                        1,
                      );
                      const barWidth = (cityPoint.bookings / maxVal) * 100;

                      return (
                        <div key={idx} className="space-y-1 font-inter text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white">{cityPoint.name}</span>
                            <span className="text-neutral-500">
                              {cityPoint.bookings} tickets
                            </span>
                          </div>
                          <div className="w-full h-3 bg-neutral-900 border border-neutral-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-700 shadow-xl"
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Group Planning Usage */}
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900">
                <h3 className="font-bold text-sm text-white mb-6 flex items-center gap-2 border-b border-neutral-900 pb-3">
                  <PieChart className="w-4 h-4 text-success" /> Booking Model
                  Mix (Individual vs Group Room)
                </h3>
                <div className="flex items-center justify-around h-40 pt-4">
                  {charts.groupBookingUsage.map((usage: any, idx: number) => {
                    const totalVal =
                      charts.groupBookingUsage.reduce(
                        (sum: number, u: any) => sum + u.value,
                        0,
                      ) || 1;
                    const percent = Math.round((usage.value / totalVal) * 100);

                    return (
                      <div key={idx} className="text-center font-inter">
                        <div
                          className={`text-3xl font-black ${idx === 0 ? "text-primary" : "text-success"}`}
                        >
                          {percent}%
                        </div>
                        <div className="text-xs text-neutral-500 font-semibold mt-2">
                          {usage.name}
                        </div>
                        <div className="text-[10px] text-neutral-600 mt-1">
                          {usage.value} booking shares
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ADD NEW MOVIE FORM */}
        {activeTab === "add-movie" && (
          <div className="p-8 rounded-2xl bg-card border border-gray-700 border border-neutral-900 max-w-3xl mx-auto w-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary " /> Add New Movie
              Details
            </h2>

            <form
              onSubmit={handleAddMovie}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 font-inter text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Movie Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karuppu"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Genre tags
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Action/Thriller"
                  value={movieGenre}
                  onChange={(e) => setMovieGenre(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Synopsis / Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write an outline description of the movie..."
                  value={movieDesc}
                  onChange={(e) => setMovieDesc(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Language
                </label>
                <select
                  value={movieLang}
                  onChange={(e) => setMovieLang(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                >
                  <option value="Hindi">Hindi</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  value={movieDur}
                  onChange={(e) => setMovieDur(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Censor Rating
                </label>
                <select
                  value={movieRating}
                  onChange={(e) => setMovieRating(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                >
                  <option value="U">U (Universal)</option>
                  <option value="UA">UA (Parental Guidance)</option>
                  <option value="A">A (Adults Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Release Date
                </label>
                <input
                  type="date"
                  required
                  value={movieRel}
                  onChange={(e) => setMovieRel(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Poster Asset Path
                </label>
                <select
                  value={moviePoster}
                  onChange={(e) => setMoviePoster(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                >
                  <option value="/assets/chand_mera_dil.jpg">
                    Chand Mera Dil Poster
                  </option>
                  <option value="/assets/drishyam_3.png">
                    Drishyam 3 Poster
                  </option>
                  <option value="/assets/dhurandhar_2.jpg">
                    Dhurandhar 2 Poster
                  </option>
                  <option value="/assets/kd_the_devil.png">
                    KD: The Devil / Karuppu Poster
                  </option>
                  <option value="/assets/avatar_3.jpg">
                    Avatar 3 / Superman Poster
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-3.5 mt-6">
                <input
                  type="checkbox"
                  id="showing"
                  checked={movieShowing}
                  onChange={(e) => setMovieShowing(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-950 border border-neutral-900 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="showing"
                  className="font-bold text-white cursor-pointer select-none"
                >
                  Set as Now Showing (Available for booking)
                </label>
              </div>

              <button
                type="submit"
                className="md:col-span-2 py-3 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-xs"
              >
                Add Movie to Catalog
              </button>
            </form>
          </div>
        )}

        {/* 3. SCHEDULE SHOWTIME FORM */}
        {activeTab === "add-show" && (
          <div className="p-8 rounded-2xl bg-card border border-gray-700 border border-neutral-900 max-w-xl mx-auto w-full">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary " /> Schedule Showtime
              Slot
            </h2>

            <form
              onSubmit={handleAddShow}
              className="space-y-4 font-inter text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Movie ID
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1 (Karuppu), 2 (Drishyam 3)"
                  value={showMovieId}
                  onChange={(e) => setShowMovieId(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white animate-fade-in"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                  Screen ID & Category
                </label>
                <select
                  value={showScreenId}
                  onChange={(e) => setShowScreenId(e.target.value)}
                  className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                >
                  <option value="1">Screen 1 (IMAX Screen - Theatre #1)</option>
                  <option value="2">Screen 2 (2D Standard - Theatre #1)</option>
                  <option value="3">Screen 3 (IMAX Screen - Theatre #2)</option>
                  <option value="4">Screen 4 (2D Standard - Theatre #2)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                    Showtime Hour
                  </label>
                  <select
                    value={showTime}
                    onChange={(e) => setShowTime(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="03:45 PM">03:45 PM</option>
                    <option value="06:30 PM">06:30 PM</option>
                    <option value="09:30 PM">09:30 PM</option>
                    <option value="11:45 PM">11:45 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-2">
                    Regular Price
                  </label>
                  <input
                    type="number"
                    required
                    value={showPriceReg}
                    onChange={(e) => setShowPriceReg(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-2">
                    Premium Price
                  </label>
                  <input
                    type="number"
                    required
                    value={showPricePrem}
                    onChange={(e) => setShowPricePrem(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-2">
                    Recliner Price
                  </label>
                  <input
                    type="number"
                    required
                    value={showPriceRec}
                    onChange={(e) => setShowPriceRec(e.target.value)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-900 rounded-xl focus:border-primary focus:outline-none text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-xs"
              >
                Schedule Showtime
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
