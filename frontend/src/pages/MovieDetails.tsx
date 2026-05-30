import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCityStore } from "../store/useCityStore.js";
import { useAuth } from "../context/AuthContext.js";
import {
  Star,
  Clock,
  Heart,
  Share2,
  Play,
  Users,
  MessageSquare,
  AlertCircle,
  X,
} from "lucide-react";
import api from "../services/api.js";

const getEmbedUrl = (url?: string) => {
  if (!url) return null;

  if (url.includes("youtu.be")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("youtube.com/embed")) return url;

  return null;
};
const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url}`;
};
// Generate the next N dates from today as YYYY-MM-DD strings
const getUpcomingDates = (count = 5): string[] => {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  language: string;
  durationMins: number;
  rating: string;
  ratingValue: string;
  releaseDate: string;
  trailerUrl?: string;
  posterUrl: string;
  isNowShowing: boolean;
}

interface Show {
  id: number;
  startTime: string;
  date: string;
  priceRegular: number;
  screen: { id: number; number: number; type: string };
  theatre: { id: number; name: string; address: string };
}

const DATE_OPTIONS = getUpcomingDates(5);

export const MovieDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCity } = useCityStore();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(DATE_OPTIONS[0]);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  // Derived — computed fresh from current movie state, not at module scope
  const embedUrl = getEmbedUrl(movie?.trailerUrl);

  useEffect(() => {
    if (searchParams.get("playTrailer") === "true") {
      setTrailerOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const movieRes = await api.get(`/movies/${id}`);
        setMovie(movieRes.data.movie);
        setReviews(movieRes.data.reviews);

        if (user) {
          const wishRes = await api.get("/bookings/wishlist");
          const list = wishRes.data.wishlist as Movie[];
          setIsWishlisted(list.some((m) => m.id === parseInt(id!)));
        }
      } catch (err) {
        console.error("Failed to load movie details:", err);
      }
    };
    fetchMovieDetails();
  }, [id, user]);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const res = await api.get(
          `/shows?movieId=${id}&citySlug=${selectedCity.slug}`,
        );
        setShows(res.data.shows);
      } catch (err) {
        console.error("Failed to load showtimes:", err);
      }
    };
    if (movie?.isNowShowing) {
      fetchShows();
    }
  }, [id, movie, selectedCity]);

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate("/auth", { state: { from: `/movies/${id}` } });
      return;
    }
    try {
      const res = await api.post("/bookings/wishlist/toggle", { movieId: id });
      setIsWishlisted(res.data.isWishlisted);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: movie?.title, url });
      } catch {
        // User cancelled — ignore
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleCreateGroupRoom = async () => {
    if (!user) {
      navigate("/auth", { state: { from: `/movies/${id}` } });
      return;
    }
    setGroupLoading(true);
    try {
      const name = `${movie?.title} Plan - ${user.fullName.split(" ")[0]}'s Crew`;
      const res = await api.post("/groups/create", { name });
      const room = res.data.room;

      await api.post(`/groups/${room.id}/vote`, {
        voteType: "movie",
        votedId: id,
      });

      navigate(`/group/${room.inviteCode}`);
    } catch (err) {
      console.error(err);
    } finally {
      setGroupLoading(false);
    }
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-12 h-12 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter shows by selected date and group by theatre
  const dailyShows = shows.filter((s) => s.date === selectedDate);
  const theatresMap: Record<
    number,
    { name: string; address: string; shows: Show[] }
  > = {};

  dailyShows.forEach((show) => {
    if (!theatresMap[show.theatre.id]) {
      theatresMap[show.theatre.id] = {
        name: show.theatre.name,
        address: show.theatre.address,
        shows: [],
      };
    }
    theatresMap[show.theatre.id].shows.push(show);
  });

  return (
    <div className="bg-background text-white pb-20 font-poppins min-h-screen">
      {/* 1. HERO BACKDROP SECTION */}
      <div className="relative h-[45vh] sm:h-[55vh] w-full overflow-hidden flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-50"
          // ✅ Use getImageUrl()
style={{ backgroundImage: `url(${getImageUrl(movie.posterUrl)})` }}

        ></div>
        <div className="absolute inset-0 gradient-overlay"></div>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        <div className="relative z-10 px-6 sm:px-12 pb-8 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-8 items-end">
          <div className="w-40 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-premium border border-neutral-800 flex-shrink-0">
            <img
              src={getImageUrl(movie.posterUrl)}
              alt={movie.title}
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="flex-grow">
            <h1 className="text-3xl sm:text-5xl font-black mb-3">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3.5 text-sm font-semibold mb-5 font-inter">
              <span className="flex items-center gap-1 text-accent">
                <Star className="w-4 h-4 fill-accent" /> {movie.ratingValue} /
                10
              </span>
              <span className="text-neutral-400">•</span>
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Clock className="w-4 h-4" /> {movie.durationMins} Mins
              </span>
              <span className="text-neutral-400">•</span>
              <span className="px-2.5 py-0.5 border border-neutral-800 rounded bg-neutral-900 text-neutral-300 text-xs">
                {movie.rating}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 font-inter mb-6 leading-relaxed max-w-3xl">
              {movie.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setTrailerOpen(true)}
                className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:border-primary rounded-xl flex items-center gap-2 shadow-premium hover:scale-105 active:scale-95 transition-all text-sm font-bold"
              >
                <Play className="w-4 h-4 text-primary fill-primary" /> Watch
                Trailer
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                  isWishlisted
                    ? "border-primary bg-primary bg-opacity-20 text-primary"
                    : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-primary" : ""}`}
                />
                <span className="text-sm font-bold hidden sm:inline">
                  Wishlist
                </span>
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-bold hidden sm:inline">
                  Share
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE BODY */}
      <div className="max-w-6xl mx-auto px-6 sm:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GROUP BOOKING PROMOTIONAL WIDGET */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-card border border-primary border-opacity-30 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary opacity-5 blur-[80px]"></div>
          <div>
            <span className="px-2.5 py-0.5 bg-primary bg-opacity-15 border border-primary rounded text-xs font-bold text-primary uppercase tracking-wide">
              CineCircle USP Feature
            </span>
            <h3 className="text-xl font-bold text-white mt-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Plan with Friends!
            </h3>
            <p className="text-xs text-neutral-400 font-inter mt-1.5 leading-relaxed max-w-xl">
              Can't decide on theatres or timings? Create a Group Room to invite
              friends, vote on options, coordinate seats, and book tickets
              together!
            </p>
          </div>
          <button
            onClick={handleCreateGroupRoom}
            disabled={groupLoading}
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-sm flex-shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            {groupLoading ? "Creating Room..." : "Plan in Group"}
          </button>
        </div>

        {/* SHOWTIMES (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-primary pl-3">
            Showtimes
          </h2>

          {movie.isNowShowing ? (
            <>
              {/* DATE SELECT PANEL */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {DATE_OPTIONS.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  // Parse as local date to avoid UTC offset shifting the day
                  const [year, month, day] = dateStr.split("-").map(Number);
                  const dateObj = new Date(year, month - 1, day);
                  const weekday = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dayNum = dateObj.getDate();
                  const monthStr = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                  });

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex flex-col items-center p-3 rounded-xl border min-w-16 font-inter transition-all ${
                        isSelected
                          ? "border-primary bg-primary bg-opacity-20 text-white shadow-xl"
                          : "border-neutral-900 bg-neutral-950 bg-opacity-40 hover:bg-neutral-900 text-muted"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase opacity-65">
                        {weekday}
                      </span>
                      <span className="text-lg font-black mt-0.5">
                        {dayNum}
                      </span>
                      <span className="text-[10px] uppercase font-bold opacity-65">
                        {monthStr}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* THEATRES SHOWTIMES LIST */}
              <div className="space-y-4 mt-6">
                {Object.keys(theatresMap).length > 0 ? (
                  Object.entries(theatresMap).map(([tId, th]) => (
                    <div
                      key={tId}
                      className="p-5 rounded-2xl bg-card border border-neutral-900 flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="max-w-xs">
                        <h4 className="font-bold text-sm text-white">
                          {th.name}
                        </h4>
                        <p className="text-xs text-neutral-500 font-inter mt-1 leading-relaxed">
                          {th.address}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2.5 items-center">
                        {th.shows.map((show) => (
                          <button
                            key={show.id}
                            onClick={() =>
                              navigate(`/shows/${show.id}/booking`)
                            }
                            className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-primary rounded-xl text-xs font-semibold text-primary transition-all hover:scale-105 active:scale-95"
                          >
                            <span className="block font-bold">
                              {show.startTime}
                            </span>
                            <span className="block text-[8px] text-neutral-500 font-inter uppercase mt-0.5">
                              {show.screen.type} Screen
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center rounded-xl bg-neutral-950 bg-opacity-40 border border-neutral-900 text-muted flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-neutral-700" />
                    <p className="text-sm font-medium">
                      No shows scheduled at {selectedCity.name} on this date.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center rounded-xl bg-neutral-950 bg-opacity-40 border border-neutral-900 text-muted flex flex-col items-center gap-2.5">
              <Clock className="w-8 h-8 text-accent animate-pulse" />
              <h4 className="font-bold text-white text-sm">
                Coming Soon in Theatres
              </h4>
              <p className="text-xs font-inter max-w-sm">
                This film is not showing yet. We will notify you once booking
                and advance ticketing triggers are active!
              </p>
            </div>
          )}
        </div>

        {/* USER REVIEWS (Right column) */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-accent pl-3">
            User Reviews
          </h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 bg-neutral-950 bg-opacity-50 border border-neutral-900 rounded-xl font-inter"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">
                      {rev.user?.fullName || "Anonymous User"}
                    </span>
                    <span className="flex items-center gap-0.5 text-accent text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-accent" /> {rev.rating}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {rev.comment || "Excellent movie, highly recommended!"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-600 text-center py-6 font-inter">
                Be the first to review this movie after booking tickets!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. WATCH TRAILER MODAL PLAYER */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90 backdrop-blur-md">
          <div className="w-full max-w-3xl aspect-video rounded-2xl border border-neutral-800 bg-black relative shadow-premium overflow-hidden animate-zoom-in">
            <button
              onClick={() => setTrailerOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={`${movie.title} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Trailer coming soon 🎬
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
