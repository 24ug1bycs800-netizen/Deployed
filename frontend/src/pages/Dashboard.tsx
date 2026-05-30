import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  Ticket,
  Heart,
  MessageSquare,
  Compass,
  User,
  Calendar,
  ShieldCheck,
  Download,
  ExternalLink,
} from "lucide-react";
import api from "../services/api.js";

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "wishlist" | "rooms">(
    "bookings",
  );

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const bookingsRes = await api.get("/bookings/my-bookings");
        setBookings(bookingsRes.data.bookings);

        const wishRes = await api.get("/bookings/wishlist");
        setWishlist(wishRes.data.wishlist);

        const roomsRes = await api.get("/groups/my-rooms");
        setRooms(roomsRes.data.rooms);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      }
    };
    fetchDashboardData();
  }, [user]);

  const handlePrintTicket = (booking: any) => {
    // Basic printable view alert simulation
    window.print();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-white pb-20 font-poppins relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT COLUMN: USER DETAILS SIDEBAR */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 flex flex-col items-center justify-center text-center max-h-[350px]">
          <div className="w-20 h-20 rounded-full bg-primary bg-opacity-10 border border-primary border-opacity-35 flex items-center justify-center text-primary text-2xl font-black uppercase mb-4 shadow-xl">
            {user.fullName.substring(0, 2)}
          </div>
          <h2 className="font-bold text-white text-lg">{user.fullName}</h2>
          <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] text-neutral-500 font-semibold font-inter mt-1 tracking-wide uppercase">
            {user.role}
          </span>
          <p className="text-xs text-neutral-500 font-inter mt-3 leading-relaxed truncate max-w-full">
            {user.email}
          </p>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="mt-6 w-full py-2.5 border border-error border-opacity-30 bg-error bg-opacity-5 hover:bg-error hover:bg-opacity-15 text-error rounded-xl text-xs font-bold transition-all"
          >
            Logout Account
          </button>
        </div>

        {/* RIGHT COLUMN: TABS CONTAINER (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB HEADERS */}
          <div className="flex border-b border-neutral-900 gap-6 font-poppins font-bold text-sm">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`pb-3 flex items-center gap-1.5 transition-all ${
                activeTab === "bookings"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-white"
              }`}
            >
              <Ticket className="w-4 h-4" /> My Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`pb-3 flex items-center gap-1.5 transition-all ${
                activeTab === "wishlist"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-white"
              }`}
            >
              <Heart className="w-4 h-4" /> Wishlist ({wishlist.length})
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`pb-3 flex items-center gap-1.5 transition-all ${
                activeTab === "rooms"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Group Rooms ({rooms.length})
            </button>
          </div>

          {/* TAB BODY VIEWS */}
          <div className="space-y-6">
            {/* A. MY BOOKINGS VIEW */}
            {activeTab === "bookings" && (
              <div className="space-y-4">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-6 rounded-2xl ticket-card shadow-premium grid grid-cols-1 md:grid-cols-4 gap-6 items-center relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary opacity-5 blur-[80px]"></div>

                      {/* Poster and Details */}
                      <div className="md:col-span-3 flex gap-4">
                        <img
                          src={booking.movie.posterUrl}
                          alt="pic"
                          className="w-16 sm:w-20 aspect-[2/3] object-cover rounded-xl border border-neutral-800 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-white text-base leading-snug">
                            {booking.movie.title}
                          </h4>
                          <span className="text-[10px] text-primary uppercase font-bold tracking-wider mt-1 inline-block">
                            {booking.movie.genre.split("/")[0]}
                          </span>

                          <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-1.5 font-inter text-xs text-neutral-500">
                            <div>
                              Theatre:{" "}
                              <strong className="text-white">
                                {booking.theatre.name}
                              </strong>
                            </div>
                            <div>
                              Date & Show:{" "}
                              <strong className="text-white">
                                {booking.show.date} @ {booking.show.startTime}
                              </strong>
                            </div>
                            <div>
                              Seats:{" "}
                              <strong className="text-accent">
                                {booking.seats
                                  .map((s: any) => `${s.row}${s.number}`)
                                  .join(", ")}
                              </strong>
                            </div>
                            <div>
                              Ticket Code:{" "}
                              <strong className="text-white font-mono">
                                {booking.code}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Printable slip checkout triggers */}
                      <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-neutral-800 border-opacity-50 pt-4 md:pt-0 md:pl-6 text-center flex flex-col gap-3 justify-center">
                        <div className="text-xs text-neutral-500 font-inter">
                          Total Amount paid
                        </div>
                        <div className="text-xl font-black text-primary text-premium-card font-poppins">
                          Rs {booking.totalAmount}
                        </div>
                        <button
                          onClick={() => handlePrintTicket(booking)}
                          className="px-4 py-2 border border-neutral-800 hover:border-primary bg-neutral-900 bg-opacity-60 rounded-xl text-xs font-bold hover:text-white text-muted transition-all flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Pass
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600 text-center py-12 font-inter">
                    No ticket bookings recorded yet. Launch booking triggers
                    from now showing films!
                  </p>
                )}
              </div>
            )}

            {/* B. WISHLIST VIEW */}
            {activeTab === "wishlist" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {wishlist.length > 0 ? (
                  wishlist.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => navigate(`/movies/${movie.id}`)}
                      className="group cursor-pointer rounded-xl overflow-hidden bg-card border border-gray-700 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-primary"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-xs truncate mt-1 text-white group-hover:text-primary transition-colors">
                          {movie.title}
                        </h4>
                        <p className="text-[9px] text-neutral-500 font-inter mt-0.5">
                          {movie.genre.split("/")[0]}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600 text-center py-12 font-inter col-span-4">
                    No films wishlisted yet.
                  </p>
                )}
              </div>
            )}

            {/* C. MY GROUP ROOMS VIEW */}
            {activeTab === "rooms" && (
              <div className="space-y-4">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => navigate(`/group/${room.inviteCode}`)}
                      className="p-5 rounded-2xl bg-card border border-gray-700 border border-neutral-900 hover:border-primary cursor-pointer shadow-premium transition-all hover:scale-[1.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-xl text-primary flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-primary text-premium-card" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">
                            {room.name}
                          </h4>
                          <span className="text-[10px] text-neutral-500 font-inter mt-1.5 inline-block">
                            Invite Code:{" "}
                            <strong className="text-accent font-mono">
                              {room.inviteCode}
                            </strong>{" "}
                            • Creator: {room.creator.fullName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 font-inter text-xs text-neutral-500">
                        <div>
                          Members:{" "}
                          <strong className="text-white">
                            {room.membersCount}
                          </strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 border rounded uppercase text-[9px] font-bold ${
                              room.status === "voting"
                                ? "border-primary bg-primary bg-opacity-10 text-primary"
                                : "border-success bg-success bg-opacity-10 text-success"
                            }`}
                          >
                            {room.status}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-600 text-center py-12 font-inter">
                    No collaborative planning rooms created or joined yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
