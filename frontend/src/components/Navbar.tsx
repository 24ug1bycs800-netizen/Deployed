import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useCityStore } from "../store/useCityStore.js";
import { CitySelectorModal } from "./CitySelectorModal.js";
import {
  Film,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Ticket,
  MessageSquare,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCity } = useCityStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-gray-800">
        {/* LOGO & LOCATION */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold text-primary tracking-wide"
          >
            <Film className="w-7 h-7 text-primary" />
            CineCircle
          </Link>

          {/* CITY SELECTOR */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-gray-700 rounded-full hover:border-primary transition-all"
          >
            <MapPin className="w-4 h-4 text-primary" />
            {selectedCity.name}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium font-inter text-muted">
          <Link to="/" className="hover:text-white transition-colors">
            Movies
          </Link>
          <Link
            to="/groups"
            className="hover:text-white text-white font-semibold flex items-center gap-1.5 bg-card border border-primary/30 px-3 py-1 rounded-md border border-primary border-opacity-30"
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            Group Rooms
          </Link>
        </div>

        {/* USER PROFILE & LOGOUT */}
        <div className="relative">
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 hover:text-primary focus:outline-none transition-colors"
              >
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="profile"
                    className="w-8 h-8 rounded-full border border-neutral-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-850 flex items-center justify-center border border-neutral-750">
                    <User className="w-4 h-4 text-muted" />
                  </div>
                )}
                <span className="hidden sm:inline text-sm font-medium font-inter">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* PROFILE DROPDOWN */}
              {menuOpen && (
                <div className="absolute right-0 top-11 w-48 rounded-xl bg-card border border-gray-700 shadow-xl py-2 z-50 text-sm font-inter animate-fade-in">
                  <div className="px-4 py-2 border-b border-neutral-800 border-opacity-50">
                    <p className="font-semibold text-white truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-muted hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Ticket className="w-4 h-4" />
                    My Bookings
                  </Link>

                  <Link
                    to="/groups"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-muted hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    My Group Rooms
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-accent hover:text-white hover:bg-neutral-800 transition-colors border-t border-neutral-800 border-opacity-50"
                    >
                      <LayoutDashboard className="w-4 h-4 text-accent" />
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-error hover:bg-neutral-800 transition-colors border-t border-neutral-800 border-opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="
px-5 py-2
rounded-full
bg-primary
text-black
font-semibold
hover:scale-105
transition-all
"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* RENDER MODAL */}
      <CitySelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};
