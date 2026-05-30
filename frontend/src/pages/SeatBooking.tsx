import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import {
  Star,
  Clock,
  Ticket,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Heart,
} from "lucide-react";
import api, { simulatePayment } from "../services/api.js";

interface ShowDetails {
  id: number;
  startTime: string;
  date: string;
  priceRegular: number;
  pricePremium: number;
  priceRecliner: number;
  movie: {
    id: number;
    title: string;
    posterUrl: string;
    genre: string;
    ratingValue: string;
  };
  screen: { id: number; number: number; type: string };
  theatre: { id: number; name: string; address: string };
}

interface Seat {
  id: number;
  row: string;
  number: number;
  category: string;
  status: string; // 'available' | 'booked' | 'selected'
}

export const SeatBooking: React.FC = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState<ShowDetails | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment Simulation States
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: `/shows/${showId}/booking` } });
      return;
    }

    const fetchSeats = async () => {
      try {
        const res = await api.get(`/bookings/shows/${showId}/seats`);
        setShow(res.data.show);
        setSeats(res.data.seats);
      } catch (err) {
        console.error("Failed to load show seat layout:", err);
        setError("Unable to load theatre seat details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [showId, user]);

  const handleSeatClick = (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId)!;
    if (seat.status === "booked") return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= 6) {
          setError("You can book a maximum of 6 seats at once.");
          setTimeout(() => setError(""), 4000);
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  const getSelectedSeatNames = () => {
    return seats
      .filter((s) => selectedSeats.includes(s.id))
      .map((s) => `${s.row}${s.number}`)
      .join(", ");
  };

  const calculateTotalPrice = () => {
    if (!show) return 0;
    let total = 0;
    seats
      .filter((s) => selectedSeats.includes(s.id))
      .forEach((seat) => {
        if (seat.category === "Premium") total += show.pricePremium;
        else if (seat.category === "Recliner") total += show.priceRecliner;
        else total += show.priceRegular;
      });
    return total;
  };

  const handleCheckoutSubmit = async () => {
    if (selectedSeats.length === 0) return;
    setError("");
    try {
      // 1. Create pending booking order on API
      const res = await api.post("/bookings/create", {
        showId,
        seatIds: selectedSeats,
      });
      setOrderId(res.data.razorpayOrderId);

      // 2. Launch checkout portal overlay
      setPaymentOpen(true);
      setPaymentProcessing(true);

      // 3. Simulating Razorpay Checkout response
      const payResult: any = await simulatePayment(
        res.data.razorpayOrderId,
        calculateTotalPrice(),
      );

      // 4. Verify payment via API
      const verifyRes = await api.post("/bookings/verify", {
        razorpayOrderId: payResult.razorpayOrderId,
        razorpayPaymentId: payResult.razorpayPaymentId,
      });

      setPaymentProcessing(false);
      setPaymentSuccess(true);
      setTicketCode(verifyRes.data.ticketCode);

      // Refresh seat layout behind overlay
      const refreshRes = await api.get(`/bookings/shows/${showId}/seats`);
      setSeats(refreshRes.data.seats);
      setSelectedSeats([]);
    } catch (err: any) {
      console.error(err);
      setPaymentOpen(false);
      setError(
        err.response?.data?.error || "Booking failed. Please try again.",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-12 h-12 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="min-h-screen bg-background text-white pb-20 font-poppins relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INTERACTIVE SEAT GRID PANEL (Left 2 columns) */}
        <div className="lg:col-span-2 flex flex-col items-center">
          {/* THEATRE SCREEN GRAPHIC */}
          <div className="w-full max-w-lg mb-16 relative flex flex-col items-center">
            {/* Projector light beam */}
            <div className="absolute -top-10 w-9/12 h-20 bg-primary opacity-[0.03] blur-xl rounded-full"></div>
            {/* Curved Screen */}
            <div className="w-full h-2.5 bg-neutral-800 rounded-full shadow-xl border-t border-primary border-opacity-35 relative z-10"></div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.25em] mt-3 font-inter">
              SCREEN THIS WAY
            </p>
          </div>

          {/* GRID MATRIX */}
          <div className="space-y-3 max-w-full overflow-x-auto pb-4">
            {["A", "B", "C", "D", "E", "F"].map((rowLetter) => {
              const rowSeats = seats.filter((s) => s.row === rowLetter);
              const categoryName = rowSeats[0]?.category;
              let rowColor =
                "border-neutral-700 bg-neutral-900 bg-opacity-30 hover:border-primary";
              if (categoryName === "Premium")
                rowColor =
                  "border-accent border-opacity-60 bg-neutral-950 bg-opacity-30 hover:border-accent";
              else if (categoryName === "Recliner")
                rowColor =
                  "border-primary border-opacity-70 bg-primary bg-opacity-5 hover:bg-opacity-15 hover:border-primary";

              return (
                <div
                  key={rowLetter}
                  className="flex items-center gap-3 min-w-[380px]"
                >
                  {/* Row Indicator */}
                  <span className="w-5 text-xs text-neutral-500 font-bold text-center font-inter">
                    {rowLetter}
                  </span>

                  {/* Row Seats list */}
                  <div className="flex gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeats.includes(seat.id);
                      const isBooked = seat.status === "booked";

                      let seatClass = rowColor;
                      if (isSelected) {
                        seatClass =
                          "border-success bg-success bg-opacity-25 text-white shadow-xl animate-pulse";
                      } else if (isBooked) {
                        seatClass =
                          "border-neutral-900 bg-neutral-900 bg-opacity-15 text-neutral-700 cursor-not-allowed";
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seat.id)}
                          className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg border text-[10px] font-bold font-inter transition-all flex items-center justify-center ${seatClass}`}
                        >
                          {seat.number}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[9px] text-neutral-500 font-bold font-inter opacity-50 px-2 uppercase">
                    {categoryName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* GRID LEGENDS */}
          <div className="flex flex-wrap gap-6 mt-12 justify-center text-xs font-semibold font-inter">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-neutral-700 bg-neutral-900 bg-opacity-30"></div>
              <span className="text-neutral-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-accent border-opacity-60 bg-neutral-950 bg-opacity-30"></div>
              <span className="text-accent">
                Premium (Rs {show.pricePremium})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-primary border-opacity-70 bg-primary bg-opacity-5"></div>
              <span className="text-primary">
                Recliner (Rs {show.priceRecliner})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-success bg-success bg-opacity-20"></div>
              <span className="text-success">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-neutral-900 bg-neutral-900 bg-opacity-15 text-neutral-800 flex items-center justify-center font-bold text-[9px]">
                X
              </div>
              <span className="text-neutral-500">Booked</span>
            </div>
          </div>
        </div>

        {/* SIDE CHECKOUT SUMMARY SIDEBAR (Right column) */}
        <div className="space-y-6">
          {/* TICKET DETAILS PREVIEW CARD */}
          <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 shadow-premium relative">
            <div className="flex gap-4">
              <img
                src={show.movie.posterUrl}
                alt={show.movie.title}
                className="w-20 aspect-[2/3] object-cover rounded-xl border border-neutral-800"
              />
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  {show.movie.title}
                </h3>
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider mt-1.5 inline-block">
                  {show.movie.genre.split("/")[0]}
                </span>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-neutral-400 font-inter">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span>{show.movie.ratingValue} / 10</span>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-900 mt-6 pt-5 space-y-3 font-inter text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Theatre:</span>
                <span className="font-bold text-white">
                  {show.theatre.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-bold text-white">
                  {show.date} @ {show.startTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Screen Type:</span>
                <span className="font-bold text-white uppercase">
                  {show.screen.type} (Screen {show.screen.number})
                </span>
              </div>
            </div>
          </div>

          {/* CHECKOUT CALCULATION WIDGET */}
          <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 shadow-premium">
            <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-primary" /> Booking Summary
            </h4>

            {error && (
              <div className="mb-4 p-3.5 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-xl flex items-center gap-2 text-xs text-red-400 font-inter">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4 font-inter text-xs text-neutral-400 mb-6 border-b border-neutral-900 pb-5">
              <div className="flex justify-between">
                <span>Selected Seats:</span>
                <span className="font-bold text-white truncate max-w-40">
                  {getSelectedSeatNames() || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Regular Tickets Count:</span>
                <span className="font-bold text-white">
                  {selectedSeats.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-neutral-900 border-opacity-50">
                <span className="font-poppins">Total Amount:</span>
                <span className="text-lg text-primary text-premium-card font-poppins">
                  Rs {calculateTotalPrice()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              disabled={selectedSeats.length === 0}
              className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              Confirm & Pay Rs {calculateTotalPrice()}
            </button>
          </div>
        </div>
      </div>

      {/* 3. SIMULATED RAZORPAY CHECKOUT PORTAL OVERLAY */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-95 backdrop-blur-md">
          <div className="w-full max-w-md p-8 rounded-2xl border border-neutral-800 bg-[#0f0f0f] relative shadow-premium flex flex-col items-center justify-center text-center animate-zoom-in">
            {/* RAZORPAY LOGO SIMULATOR */}
            <div className="flex items-center gap-1.5 text-lg font-black text-white tracking-widest font-poppins mb-6">
              <Sparkles className="w-5 h-5 text-[#0B72E7]" />
              RAZORPAY
              <span className="text-[#0B72E7] font-medium text-sm">
                checkout
              </span>
            </div>

            {paymentProcessing && (
              <div className="py-8 space-y-5 animate-pulse">
                <div className="w-12 h-12 border-4 border-solid border-t-[#0B72E7] border-neutral-800 rounded-full animate-spin mx-auto"></div>
                <h3 className="font-bold text-white text-base">
                  Processing Payment Securely...
                </h3>
                <p className="text-xs text-neutral-500 font-inter max-w-xs mx-auto">
                  Connecting with bank servers. Please do not close this window
                  or click refresh.
                </p>
                <div className="border-t border-neutral-900 pt-4 text-xs font-inter text-neutral-600 flex justify-center gap-2 items-center">
                  <ShieldCheck className="w-4 h-4 text-neutral-500" /> PCI-DSS
                  Compliant Gateway
                </div>
              </div>
            )}

            {paymentSuccess && (
              <div className="py-8 space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-success bg-opacity-15 border border-success flex items-center justify-center mx-auto text-success shadow-xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Payment Successful!
                  </h3>
                  <p className="text-xs text-success font-inter font-semibold mt-1">
                    Ticket Confirmed • Code: {ticketCode}
                  </p>
                </div>
                <p className="text-xs text-neutral-500 font-inter max-w-xs mx-auto">
                  Your digital movie passes have been credited to your personal
                  CineCircle Dashboard. Thank you for booking with us!
                </p>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 bg-success hover:bg-green-600 text-white font-bold font-poppins rounded-xl shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
                >
                  View My Tickets
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
