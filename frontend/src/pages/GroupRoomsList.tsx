import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  MessageSquare,
  PlusCircle,
  Compass,
  AlertCircle,
  Loader,
  ArrowRight,
} from "lucide-react";
import api from "../services/api.js";

export const GroupRoomsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteInput, setInviteInput] = useState("");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [err, setErr] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await api.get("/groups/my-rooms");
      setRooms(res.data.rooms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: "/groups" } });
      return;
    }
    fetchRooms();
  }, [user]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput) return;
    setErr("");
    setActionLoading(true);

    try {
      const res = await api.post("/groups/join", { inviteCode: inviteInput });
      navigate(`/group/${res.data.inviteCode}`);
    } catch (error: any) {
      setErr(
        error.response?.data?.error ||
          "Failed to join room. Verify invite code.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNameInput) return;
    setErr("");
    setActionLoading(true);

    try {
      const res = await api.post("/groups/create", { name: roomNameInput });
      navigate(`/group/${res.data.room.inviteCode}`);
    } catch (error: any) {
      setErr(error.response?.data?.error || "Failed to create planning room.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-12 h-12 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 font-poppins relative">
      {/* CINEMATIC BACKDROP DECORATION */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-primary opacity-5 blur-[120px]"></div>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12 space-y-12">
        {/* HEADER BAR */}
        <div className="border-b border-neutral-900 pb-6">
          <h1 className="text-3xl font-black text-white tracking-wider flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary text-premium-card" />{" "}
            Collaborative Planning Rooms
          </h1>
          <p className="text-xs text-neutral-500 font-inter mt-1.5">
            Join forces with friends to coordinate movies, vote on showtimes,
            and book adjacent seats seamlessly.
          </p>
        </div>

        {err && (
          <div className="p-4 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-xl flex items-center gap-2.5 text-sm text-red-400 font-inter max-w-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {err}
          </div>
        )}

        {/* INPUT ACTIONS GRID (Join / Create Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* JOIN EXISTING ROOM */}
          <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 shadow-premium flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white mb-2">
                Join Existing Room
              </h3>
              <p className="text-xs text-neutral-500 font-inter leading-relaxed mb-6">
                Enter a 6-character room invite code shared by your friend to
                join their planning workspace.
              </p>
            </div>

            <form
              onSubmit={handleJoinRoom}
              className="flex gap-2.5 font-inter text-xs"
            >
              <input
                type="text"
                required
                maxLength={6}
                placeholder="INVITE CODE (e.g. AA3B6F)"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                className="flex-grow p-3.5 bg-neutral-950 border border-neutral-900 focus:border-primary rounded-xl focus:outline-none text-white font-mono uppercase tracking-wider text-sm"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-3.5 bg-primary hover:bg-secondary text-white font-bold rounded-xl flex items-center justify-center gap-1 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {actionLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Compass className="w-4 h-4" /> Join
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CREATE NEW ROOM */}
          <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 shadow-premium flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white mb-2">
                Spawn New Planning Room
              </h3>
              <p className="text-xs text-neutral-500 font-inter leading-relaxed mb-6">
                Create a dedicated planning space for your squad. You'll be the
                group host and coordinate finalized bookings.
              </p>
            </div>

            <form
              onSubmit={handleCreateRoom}
              className="flex gap-2.5 font-inter text-xs"
            >
              <input
                type="text"
                required
                placeholder="Squad Planning Name (e.g. Friday Blockbuster)"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                className="flex-grow p-3.5 bg-neutral-950 border border-neutral-900 focus:border-primary rounded-xl focus:outline-none text-white text-sm"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-3.5 bg-primary hover:bg-secondary text-white font-bold rounded-xl flex items-center justify-center gap-1 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {actionLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> Create
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ACTIVE GROUP ROOMS LIST */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-l-4 border-primary pl-3">
            My Planning Workspaces
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => navigate(`/group/${room.inviteCode}`)}
                  className="p-5 rounded-2xl bg-card border border-gray-700 border border-neutral-900 hover:border-primary cursor-pointer shadow-premium transition-all hover:scale-[1.01] flex justify-between items-center group relative overflow-hidden"
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-xl text-primary flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary text-premium-card" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm leading-tight group-hover:text-primary transition-colors">
                        {room.name}
                      </h4>
                      <span className="text-[10px] text-neutral-500 font-inter mt-1.5 inline-block">
                        Room Code:{" "}
                        <strong className="text-accent font-mono">
                          {room.inviteCode}
                        </strong>{" "}
                        • Members: {room.membersCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 font-inter">
                    <span
                      className={`px-2 py-0.5 border rounded uppercase text-[8px] font-bold ${
                        room.status === "voting"
                          ? "border-primary bg-primary bg-opacity-10 text-primary"
                          : "border-success bg-success bg-opacity-10 text-success"
                      }`}
                    >
                      {room.status}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-muted" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center col-span-2 rounded-2xl bg-neutral-950 bg-opacity-40 border border-neutral-900 text-neutral-500 flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-neutral-700" />
                <p className="text-sm font-medium">
                  You are not part of any group planning workspaces yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
