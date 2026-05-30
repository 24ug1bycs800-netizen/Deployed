import { Request, Response } from "express";
import { isFallback, db, fallbackDb } from "../db/db";
import {
  bookings,
  bookingSeats,
  payments,
  seats,
  shows,
  movies,
  screens,
  theatres,
  wishlist,
  reviews,
} from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// GET SEAT MAP FOR A SHOW
export const getSeatsForShow = async (req: Request, res: Response) => {
  try {
    const showId = parseInt(req.params.showId);
    if (isNaN(showId)) {
      return res.status(400).json({ error: "Invalid show ID" });
    }

    let showItem: any = null;
    let screenItem: any = null;
    let theatreItem: any = null;
    let movieItem: any = null;
    let allSeatsList: any[] = [];
    let bookedSeatIds: number[] = [];

    if (isFallback) {
      showItem = fallbackDb.shows.find((s) => s.id === showId);
      if (!showItem) return res.status(404).json({ error: "Show not found" });

      screenItem = fallbackDb.screens.find((s) => s.id === showItem.screenId);
      theatreItem = fallbackDb.theatres.find(
        (t) => t.id === screenItem.theatreId,
      );
      movieItem = fallbackDb.movies.find((m) => m.id === showItem.movieId);

      allSeatsList = fallbackDb.seats.filter(
        (s) => s.screenId === showItem.screenId,
      );

      // Find all booked/reserved seats for this show
      const activeBookings = fallbackDb.bookings.filter(
        (b) =>
          b.showId === showId &&
          (b.status === "confirmed" || b.status === "pending"),
      );
      const activeBookingIds = activeBookings.map((b) => b.id);
      const bookingSeatsList = fallbackDb.bookingSeats.filter((bs) =>
        activeBookingIds.includes(bs.bookingId),
      );
      bookedSeatIds = bookingSeatsList.map((bs) => bs.seatId);
    } else {
      const dbShows = await db
        .select()
        .from(shows)
        .where(eq(shows.id, showId))
        .limit(1);
      showItem = dbShows[0] || null;
      if (!showItem) return res.status(404).json({ error: "Show not found" });

      const dbScreens = await db
        .select()
        .from(screens)
        .where(eq(screens.id, showItem.screenId))
        .limit(1);
      screenItem = dbScreens[0];
      const dbTheatres = await db
        .select()
        .from(theatres)
        .where(eq(theatres.id, screenItem.theatreId))
        .limit(1);
      theatreItem = dbTheatres[0];
      const dbMovies = await db
        .select()
        .from(movies)
        .where(eq(movies.id, showItem.movieId))
        .limit(1);
      movieItem = dbMovies[0];

      allSeatsList = await db
        .select()
        .from(seats)
        .where(eq(seats.screenId, showItem.screenId));

      const activeBookings = await db
        .select()
        .from(bookings)
        .where(
          and(eq(bookings.showId, showId), eq(bookings.status, "confirmed")),
        );
      for (const booking of activeBookings) {
        const linkedSeats = await db
          .select()
          .from(bookingSeats)
          .where(eq(bookingSeats.bookingId, booking.id));
        linkedSeats.forEach((ls: any) => bookedSeatIds.push(ls.seatId));
      }
    }

    // Map seats overlaying booking status
    const seatsLayout = allSeatsList.map((seat) => {
      const isBooked = bookedSeatIds.includes(seat.id);
      let status = "available";
      if (isBooked) {
        status = "booked";
      }
      return {
        ...seat,
        status,
      };
    });

    res.status(200).json({
      show: {
        id: showItem.id,
        startTime: showItem.startTime,
        date: showItem.date,
        priceRegular: showItem.priceRegular,
        pricePremium: showItem.pricePremium,
        priceRecliner: showItem.priceRecliner,
        movie: movieItem,
        screen: screenItem,
        theatre: theatreItem,
      },
      seats: seatsLayout,
    });
  } catch (err) {
    console.error("Fetch show seat layout error:", err);
    res
      .status(500)
      .json({ error: "Internal server error fetching seats layout" });
  }
};

// CREATE A BOOKING ORDER (Integrating simulated Razorpay order creation)
export const createBooking = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { showId, seatIds } = req.body;

    if (
      !showId ||
      !seatIds ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0
    ) {
      return res.status(400).json({
        error: "showId and a non-empty array of seatIds are required",
      });
    }

    const showInt = parseInt(showId);
    let showItem: any = null;
    let seatsList: any[] = [];
    let alreadyBooked = false;

    if (isFallback) {
      showItem = fallbackDb.shows.find((s) => s.id === showInt);
      if (!showItem) return res.status(404).json({ error: "Show not found" });

      seatsList = fallbackDb.seats.filter(
        (s) => seatIds.includes(s.id) && s.screenId === showItem.screenId,
      );

      // Check if any seat is already booked for this show
      const activeBookings = fallbackDb.bookings.filter(
        (b) => b.showId === showInt && b.status === "confirmed",
      );
      const activeBookingIds = activeBookings.map((b) => b.id);
      const bookedSeatIds = fallbackDb.bookingSeats
        .filter((bs) => activeBookingIds.includes(bs.bookingId))
        .map((bs) => bs.seatId);
      alreadyBooked = seatIds.some((sId) => bookedSeatIds.includes(sId));
    } else {
      const dbShows = await db
        .select()
        .from(shows)
        .where(eq(shows.id, showInt))
        .limit(1);
      showItem = dbShows[0] || null;
      if (!showItem) return res.status(404).json({ error: "Show not found" });

      seatsList = await db
        .select()
        .from(seats)
        .where(and(eq(seats.screenId, showItem.screenId)));
      seatsList = seatsList.filter((s) => seatIds.includes(s.id));

      const activeBookings = await db
        .select()
        .from(bookings)
        .where(
          and(eq(bookings.showId, showInt), eq(bookings.status, "confirmed")),
        );
      const bookedSeatIds: number[] = [];
      for (const booking of activeBookings) {
        const linkedSeats = await db
          .select()
          .from(bookingSeats)
          .where(eq(bookingSeats.bookingId, booking.id));
        linkedSeats.forEach((ls: any) => bookedSeatIds.push(ls.seatId));
      }
      alreadyBooked = seatIds.some((sId) => bookedSeatIds.includes(sId));
    }

    if (alreadyBooked) {
      return res.status(409).json({
        error: "One or more of the selected seats are already booked.",
      });
    }

    // CALCULATE PRICE DYNAMICALLY BASED ON CATEGORIES
    let totalAmount = 0;
    seatsList.forEach((seat) => {
      if (seat.category === "Premium") totalAmount += showItem.pricePremium;
      else if (seat.category === "Recliner")
        totalAmount += showItem.priceRecliner;
      else totalAmount += showItem.priceRegular;
    });

    const bookingCode = `CC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const razorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;

    let newBooking: any = null;

    if (isFallback) {
      const bookingId = fallbackDb.bookings.length + 1;
      newBooking = {
        id: bookingId,
        userId: user.id,
        showId: showInt,
        totalAmount,
        status: "pending",
        code: bookingCode,
        createdAt: new Date().toISOString(),
      };
      fallbackDb.bookings.push(newBooking);

      // Link seats
      seatIds.forEach((sId) => {
        fallbackDb.bookingSeats.push({ bookingId, seatId: sId });
      });

      // Add payment entry
      fallbackDb.payments.push({
        id: fallbackDb.payments.length + 1,
        bookingId,
        razorpayOrderId,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      fallbackDb.save();
    } else {
      const inserted = await db
        .insert(bookings)
        .values({
          userId: user.id,
          showId: showInt,
          totalAmount,
          status: "pending",
          code: bookingCode,
        })
        .returning();
      newBooking = inserted[0];

      // Link seats in pg
      for (const sId of seatIds) {
        await db.insert(bookingSeats).values({
          bookingId: newBooking.id,
          seatId: sId,
        });
      }

      // Add payment
      await db.insert(payments).values({
        bookingId: newBooking.id,
        razorpayOrderId,
        status: "pending",
      });
    }

    res.status(201).json({
      message: "Booking order created successfully",
      booking: newBooking,
      razorpayOrderId,
      amount: totalAmount,
      currency: "INR",
    });
  } catch (err) {
    console.error("Create booking order error:", err);
    res.status(500).json({ error: "Internal server error creating booking" });
  }
};

// VERIFY PAYMENT & CONFIRM TICKET
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId) {
      return res.status(400).json({ error: "razorpayOrderId is required" });
    }

    // In local mode or mock environment, we verify instantly!
    const mockPaymentId =
      razorpayPaymentId || `pay_${crypto.randomBytes(8).toString("hex")}`;

    let updatedBooking: any = null;

    if (isFallback) {
      const paymentItem = fallbackDb.payments.find(
        (p) => p.razorpayOrderId === razorpayOrderId,
      );
      if (!paymentItem) {
        return res.status(404).json({ error: "Order transaction not found" });
      }

      paymentItem.status = "success";
      paymentItem.razorpayPaymentId = mockPaymentId;

      const bookingItem = fallbackDb.bookings.find(
        (b) => b.id === paymentItem.bookingId,
      );
      if (bookingItem) {
        bookingItem.status = "confirmed";
        updatedBooking = bookingItem;
      }

      fallbackDb.save();
    } else {
      const paymentItems = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayOrderId, razorpayOrderId))
        .limit(1);
      const paymentItem = paymentItems[0];
      if (!paymentItem) {
        return res.status(404).json({ error: "Order transaction not found" });
      }

      await db
        .update(payments)
        .set({
          status: "success",
          razorpayPaymentId: mockPaymentId,
        })
        .where(eq(payments.id, paymentItem.id));

      const updated = await db
        .update(bookings)
        .set({
          status: "confirmed",
        })
        .where(eq(bookings.id, paymentItem.bookingId))
        .returning();
      updatedBooking = updated[0];
    }

    res.status(200).json({
      message: "Payment verified and ticket confirmed successfully!",
      booking: updatedBooking,
      ticketCode: updatedBooking?.code,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ error: "Internal server error verifying payment" });
  }
};

// GET USER BOOKINGS HISTORY
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let bookingList: any[] = [];

    if (isFallback) {
      const userBookings = fallbackDb.bookings.filter(
        (b) => b.userId === user.id,
      );
      bookingList = userBookings
        .map((b) => {
          const show = fallbackDb.shows.find((s) => s.id === b.showId)!;
          const movie = fallbackDb.movies.find((m) => m.id === show.movieId)!;
          const screen = fallbackDb.screens.find(
            (s) => s.id === show.screenId,
          )!;
          const theatre = fallbackDb.theatres.find(
            (t) => t.id === screen.theatreId,
          )!;

          const linkSeats = fallbackDb.bookingSeats.filter(
            (bs) => bs.bookingId === b.id,
          );
          const seatIds = linkSeats.map((ls) => ls.seatId);
          const bookedSeats = fallbackDb.seats.filter((s) =>
            seatIds.includes(s.id),
          );

          return {
            ...b,
            show,
            movie,
            theatre,
            screen,
            seats: bookedSeats,
          };
        })
        .sort((a, b) => b.id - a.id);
    } else {
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, user.id));
      const list = [];
      for (const b of userBookings) {
        const showItem = await db
          .select()
          .from(shows)
          .where(eq(shows.id, b.showId))
          .limit(1);
        if (showItem[0]) {
          const movieItem = await db
            .select()
            .from(movies)
            .where(eq(movies.id, showItem[0].movieId))
            .limit(1);
          const screenItem = await db
            .select()
            .from(screens)
            .where(eq(screens.id, showItem[0].screenId))
            .limit(1);
          const theatreItem = await db
            .select()
            .from(theatres)
            .where(eq(theatres.id, screenItem[0].theatreId))
            .limit(1);

          const linkSeats = await db
            .select()
            .from(bookingSeats)
            .where(eq(bookingSeats.bookingId, b.id));
          const seatIds = linkSeats.map((ls) => ls.seatId);
          const bookedSeats = await db.select().from(seats); // standard array filter is fine in node size
          const filteredSeats = bookedSeats.filter((s) =>
            seatIds.includes(s.id),
          );

          list.push({
            ...b,
            show: showItem[0],
            movie: movieItem[0],
            theatre: theatreItem[0],
            screen: screenItem[0],
            seats: filteredSeats,
          });
        }
      }
      bookingList = list.sort((a, b) => b.id - a.id);
    }

    res.status(200).json({ bookings: bookingList });
  } catch (err) {
    console.error("Fetch my bookings error:", err);
    res
      .status(500)
      .json({ error: "Internal server error fetching booking history" });
  }
};

// WISHLIST TOGGLE
export const toggleWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: "movieId is required" });

    let isAdded = false;

    if (isFallback) {
      const existingIdx = fallbackDb.wishlist.findIndex(
        (w) => w.userId === user.id && w.movieId === parseInt(movieId),
      );
      if (existingIdx !== -1) {
        fallbackDb.wishlist.splice(existingIdx, 1);
        isAdded = false;
      } else {
        fallbackDb.wishlist.push({
          id: fallbackDb.wishlist.length + 1,
          userId: user.id,
          movieId: parseInt(movieId),
        });
        isAdded = true;
      }
      fallbackDb.save();
    } else {
      const existing = await db
        .select()
        .from(wishlist)
        .where(
          and(
            eq(wishlist.userId, user.id),
            eq(wishlist.movieId, parseInt(movieId)),
          ),
        )
        .limit(1);
      if (existing[0]) {
        await db.delete(wishlist).where(eq(wishlist.id, existing[0].id));
        isAdded = false;
      } else {
        await db
          .insert(wishlist)
          .values({ userId: user.id, movieId: parseInt(movieId) });
        isAdded = true;
      }
    }

    res.status(200).json({ success: true, isWishlisted: isAdded });
  } catch (err) {
    console.error("Toggle wishlist error:", err);
    res.status(500).json({ error: "Internal server error updating wishlist" });
  }
};

// GET USER WISHLIST
export const getMyWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let movieItems = [];

    if (isFallback) {
      const myWish = fallbackDb.wishlist.filter((w) => w.userId === user.id);
      const mIds = myWish.map((w) => w.movieId);
      movieItems = fallbackDb.movies.filter((m) => mIds.includes(m.id));
    } else {
      const myWish = await db
        .select()
        .from(wishlist)
        .where(eq(wishlist.userId, user.id));
      const mIds = myWish.map((w) => w.movieId);
      const allMovies = await db.select().from(movies);
      movieItems = allMovies.filter((m) => mIds.includes(m.id));
    }

    res.status(200).json({ wishlist: movieItems });
  } catch (err) {
    console.error("Fetch wishlist error:", err);
    res.status(500).json({ error: "Internal server error fetching wishlist" });
  }
};

// POST A MOVIE REVIEW
export const addReview = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { movieId, rating, comment } = req.body;

    if (!movieId || !rating) {
      return res
        .status(400)
        .json({ error: "movieId and rating (1-5) are required" });
    }

    let newReview: any = null;

    if (isFallback) {
      newReview = {
        id: fallbackDb.reviews.length + 1,
        userId: user.id,
        movieId: parseInt(movieId),
        rating: parseInt(rating),
        comment,
        createdAt: new Date().toISOString(),
      };
      fallbackDb.reviews.push(newReview);
      fallbackDb.save();
    } else {
      const inserted = await db
        .insert(reviews)
        .values({
          userId: user.id,
          movieId: parseInt(movieId),
          rating: parseInt(rating),
          comment,
        })
        .returning();
      newReview = inserted[0];
    }

    res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ error: "Internal server error adding review" });
  }
};
