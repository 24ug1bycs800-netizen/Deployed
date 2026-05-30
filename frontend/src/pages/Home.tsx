import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCityStore } from "../store/useCityStore.js";
import {
  Play,
  Calendar,
  Star,
  Compass,
  Film,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../services/api.js";

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
  backdropUrl?: string;
  isNowShowing: boolean;
  trending: boolean;
  topRated: boolean;
}

interface Theatre {
  id: number;
  name: string;
  cityId: number;
  address: string;
}

// ✅ Added getImageUrl helper
const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url}`;
};

export const Home: React.FC = () => {
  const { selectedCity } = useCityStore();
  const navigate = useNavigate();

  const [nowShowing, setNowShowing] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const nowRes = await api.get("/movies?isNowShowing=true");
        setNowShowing(nowRes.data.movies);

        const soonRes = await api.get("/movies?isNowShowing=false");
        setComingSoon(soonRes.data.movies);
      } catch (err) {
        console.error("Failed to load movies:", err);
      }
    };
    fetchMovies();
  }, []);

  useEffect(() => {
    const fetchTheatres = async () => {
      try {
        const res = await api.get(`/theatres?citySlug=${selectedCity.slug}`);
        setTheatres(res.data.theatres);
      } catch (err) {
        console.error("Failed to load local theatres:", err);
      }
    };
    fetchTheatres();
  }, [selectedCity]);

  // Rotate Carousel Banners
  useEffect(() => {
    if (nowShowing.length === 0) return;
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % Math.min(nowShowing.length, 3));
    }, 6000);
    return () => clearInterval(interval);
  }, [nowShowing]);

  const activeHero = nowShowing[heroIdx];

  const handleNextHero = () => {
    setHeroIdx((prev) => (prev + 1) % Math.min(nowShowing.length, 3));
  };

  const handlePrevHero = () => {
    setHeroIdx(
      (prev) =>
        (prev - 1 + Math.min(nowShowing.length, 3)) %
        Math.min(nowShowing.length, 3),
    );
  };

  return (
    <div className="bg-[#0F1115] text-white pb-20 font-poppins min-h-screen">
      {/* 1. HERO SLIDING BANNER */}
      {activeHero && (
        <div className="relative h-[80vh] w-full overflow-hidden flex items-end">
          {/* Banner Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out scale-105 filter brightness-50"
            style={{
              // ✅ Fixed: use getImageUrl
              backgroundImage: `url(${getImageUrl(activeHero.backdropUrl || activeHero.posterUrl)})`,
            }}
          ></div>
          <div className="absolute inset-0 gradient-overlay"></div>
          <div className="absolute inset-0 gradient-overlay-horizontal hidden md:block"></div>

          {/* Banner details */}
          <div className="relative z-10 px-6 sm:px-12 pb-12 w-full max-w-4xl animate-fade-in">
            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-4 inline-block tracking-wider shadow-xl animate-pulse">
              NOW SHOWING
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
              {activeHero.title}
            </h1>
            <p className="text-sm text-neutral-300 font-inter max-w-2xl mb-6 leading-relaxed hidden sm:block">
              {activeHero.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-6">
              <span className="px-2 py-0.5 border border-neutral-700 rounded text-neutral-300">
                {activeHero.language}
              </span>
              <span className="px-2 py-0.5 border border-neutral-700 rounded text-neutral-300">
                {activeHero.genre}
              </span>
              <span className="flex items-center gap-1 text-accent">
                <Star className="w-3.5 h-3.5 fill-accent" />{" "}
                {activeHero.ratingValue}
              </span>
              <span className="text-neutral-400">
                {activeHero.durationMins} Mins
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(`/movies/${activeHero.id}`)}
                className="px-8 py-4 bg-primary text-black font-bold rounded-full flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
              >
                <Film className="w-4 h-4" /> Book Tickets
              </button>
              <button
                onClick={() =>
                  navigate(`/movies/${activeHero.id}?playTrailer=true`)
                }
                className="px-8 py-4 border border-primary text-primary rounded-full font-bold flex items-center gap-2 hover:bg-primary hover:text-black transition-all"
              >
                <Play className="w-4 h-4 text-primary" /> Watch Trailer
              </button>
            </div>
          </div>

          {/* Banner Controls */}
          <div className="absolute right-6 bottom-12 z-20 flex gap-2">
            <button
              onClick={handlePrevHero}
              className="p-2.5 rounded-full bg-neutral-900 bg-opacity-60 border border-neutral-800 hover:border-primary text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextHero}
              className="p-2.5 rounded-full bg-neutral-900 bg-opacity-60 border border-neutral-800 hover:border-primary text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC LOCATION WARNING BAR */}
      <div className="px-6 sm:px-12 py-3 bg-primary bg-opacity-10 border-y border-neutral-900 flex items-center justify-between text-xs sm:text-sm font-semibold text-primary font-inter">
        <div className="flex items-center gap-2">
          <Compass
            className="w-4 h-4 text-primary animate-spin"
            style={{ animationDuration: "6s" }}
          />
          <span>
            Showing options for theatres located in{" "}
            <strong className="text-white underline">
              {selectedCity.name}
            </strong>
          </span>
        </div>
        <span className="text-neutral-500 text-xs hidden md:inline">
          Persisted locally in storage
        </span>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-black text-white">
          Experience Cinema Like Never Before
        </h2>

        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          Book tickets, watch trailers and discover the latest blockbusters.
        </p>
      </div>

      {/* 3. NOW SHOWING GRID */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-5 h-5 text-primary text-premium-card" /> Now
            Showing
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {nowShowing.map((movie) => (
            <div
              key={movie.id}
              onClick={() => navigate(`/movies/${movie.id}`)}
              className="group cursor-pointer premium-card overflow-hidden"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                {/* ✅ Fixed: use getImageUrl */}
                <img
                  src={getImageUrl(movie.posterUrl)}
                  alt={movie.title}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black bg-opacity-70 rounded border border-neutral-800 text-[10px] text-accent flex items-center gap-0.5 font-bold">
                  <Star className="w-2.5 h-2.5 fill-accent text-accent" />
                  {movie.ratingValue}
                </div>
              </div>
              <div className="p-4">
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                  {movie.language} • {movie.genre.split("/")[0]}
                </span>
                <h3 className="font-bold text-base mt-2 text-white group-hover:text-primary transition-colors">
                  {movie.title}
                </h3>
                <p className="text-[10px] text-neutral-500 font-inter mt-1">
                  Duration: {movie.durationMins} Mins
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. COMING SOON GRID */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" /> Coming Soon
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {comingSoon.map((movie) => (
            <div
              key={movie.id}
              onClick={() => navigate(`/movies/${movie.id}`)}
              className="group cursor-pointer premium-card overflow-hidden"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                {/* ✅ Fixed: use getImageUrl */}
                <img
                  src={getImageUrl(movie.posterUrl)}
                  alt={movie.title}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-accent bg-opacity-25 rounded border border-accent border-opacity-50 text-[9px] text-accent font-bold uppercase tracking-wider">
                  COMING SOON
                </div>
              </div>
              <div className="p-4">
                <span className="text-[10px] text-accent uppercase font-bold tracking-wider">
                  {movie.language} • {movie.genre.split("/")[0]}
                </span>
                <h3 className="font-bold text-sm truncate mt-1 text-white group-hover:text-accent transition-colors">
                  {movie.title}
                </h3>
                <p className="text-[10px] text-neutral-500 font-inter mt-1">
                  Release: {movie.releaseDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. POPULAR THEATRES SECTION */}
      <div className="premium-card p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary" /> Popular Theatres in{" "}
          {selectedCity.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {theatres.length > 0 ? (
            theatres.map((theatre) => (
              <div
                key={theatre.id}
                className="p-5 rounded-xl bg-[#1A1D24] border border-gray-700 flex items-start gap-3"
              >
                <div className="p-2.5 bg-primary bg-opacity-10 rounded-lg text-primary mt-1">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {theatre.name}
                  </h4>
                  <p className="text-xs text-neutral-500 font-inter mt-1">
                    {theatre.address}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500 col-span-3 text-center py-6">
              No theatres found for this location. Map is being updated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
