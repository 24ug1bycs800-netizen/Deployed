import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// CITIES TABLE
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// USERS TABLE
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("user").notNull(), // 'user' | 'admin'
  profilePic: text("profile_pic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MOVIES TABLE
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  genre: varchar("genre", { length: 100 }).notNull(),
  language: varchar("language", { length: 100 }).notNull(),
  durationMins: integer("duration_mins").notNull(),
  rating: varchar("rating", { length: 10 }).notNull(), // e.g. "UA", "A", "U"
  ratingValue: varchar("rating_value", { length: 10 }).default("4.5"),
  releaseDate: varchar("release_date", { length: 50 }).notNull(),
  trailerUrl: varchar("trailer_url", { length: 255 }),
  posterUrl: varchar("poster_url", { length: 255 }).notNull(),
  isNowShowing: boolean("is_now_showing").default(true).notNull(),
  trending: boolean("trending").default(false).notNull(),
  topRated: boolean("top_rated").default(false).notNull(),
});

// THEATRES TABLE
export const theatres = pgTable("theatres", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cityId: integer("city_id")
    .references(() => cities.id, { onDelete: "cascade" })
    .notNull(),
  address: text("address").notNull(),
});

// SCREENS TABLE
export const screens = pgTable("screens", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  type: varchar("type", { length: 50 }).default("2D").notNull(), // '2D' | '3D' | 'IMAX'
  theatreId: integer("theatre_id")
    .references(() => theatres.id, { onDelete: "cascade" })
    .notNull(),
});

// SHOWS TABLE
export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" })
    .notNull(),
  screenId: integer("screen_id")
    .references(() => screens.id, { onDelete: "cascade" })
    .notNull(),
  language: varchar("language", { length: 100 }).notNull(),
  startTime: varchar("start_time", { length: 50 }).notNull(), // e.g. "06:30 PM"
  date: varchar("date", { length: 50 }).notNull(),            // e.g. "2026-05-31"
  priceRegular: integer("price_regular").default(150).notNull(),
  pricePremium: integer("price_premium").default(250).notNull(),
  priceRecliner: integer("price_recliner").default(450).notNull(),
  // "active" = bookable, "expired" = past show (soft delete — preserves booking history)
  status: varchar("status", { length: 20 }).default("active").notNull(),
}, (table) => ({
  movieIdIdx: index("shows_movie_id_idx").on(table.movieId),
  screenIdIdx: index("shows_screen_id_idx").on(table.screenId),
  dateIdx: index("shows_date_idx").on(table.date),
  statusIdx: index("shows_status_idx").on(table.status),
}));

// SEATS TABLE
export const seats = pgTable("seats", {
  id: serial("id").primaryKey(),
  screenId: integer("screen_id")
    .references(() => screens.id, { onDelete: "cascade" })
    .notNull(),
  row: varchar("row", { length: 5 }).notNull(),       // A, B, C...
  number: integer("number").notNull(),                 // 1, 2, 3...
  category: varchar("category", { length: 50 }).default("Regular").notNull(), // 'Regular' | 'Premium' | 'Recliner'
});

// BOOKINGS TABLE
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  showId: integer("show_id")
    .references(() => shows.id, { onDelete: "cascade" })
    .notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending' | 'confirmed' | 'cancelled'
  code: varchar("code", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  showIdIdx: index("bookings_show_id_idx").on(table.showId),
}));

// BOOKING SEATS (Link table) — surrogate PK to avoid composite key issues
export const bookingSeats = pgTable("booking_seats", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  seatId: integer("seat_id")
    .notNull()
    .references(() => seats.id, { onDelete: "cascade" }),
});

// PAYMENTS TABLE
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),

  bookingId: integer("booking_id")
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),

  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),

  amount: integer("amount"),
  method: varchar("method", { length: 50 }),

  status: varchar("status", { length: 50 })
    .default("pending")
    .notNull(),

  transactionId: varchar("transaction_id", { length: 255 }),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// GROUP ROOMS TABLE (Collaborative Booking)
export const groupRooms = pgTable("group_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  creatorId: integer("creator_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  inviteCode: varchar("invite_code", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default("voting").notNull(), // 'voting' | 'finalizing' | 'booked'
  selectedMovieId: integer("selected_movie_id").references(() => movies.id),
  selectedTheatreId: integer("selected_theatre_id").references(() => theatres.id),
  selectedShowId: integer("selected_show_id").references(() => shows.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// GROUP MEMBERS TABLE
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .references(() => groupRooms.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});
export const seatLocks = pgTable("seat_locks", {
  id: serial("id").primaryKey(),

  seatId: integer("seat_id")
    .notNull()
    .references(() => seats.id),

  showId: integer("show_id")
    .notNull()
    .references(() => shows.id),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});
// VOTES TABLE
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .references(() => groupRooms.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  voteType: varchar("vote_type", { length: 50 }).notNull(), // 'movie' | 'theatre' | 'showtime'
  votedId: integer("voted_id").notNull(),
});

// NOTIFICATIONS TABLE
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// REVIEWS TABLE
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  movieId: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" })
    .notNull(),
  rating: integer("rating").notNull(), // 1 to 5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// WISHLIST TABLE
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  movieId: integer("movie_id")
    .references(() => movies.id, { onDelete: "cascade" })
    .notNull(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────

export const citiesRelations = relations(cities, ({ many }) => ({
  theatres: many(theatres),
}));

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  groupRooms: many(groupRooms),
  groupMembers: many(groupMembers),
  votes: many(votes),
  notifications: many(notifications),
  reviews: many(reviews),
  wishlist: many(wishlist),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  shows: many(shows),
  reviews: many(reviews),
  wishlist: many(wishlist),
}));

export const theatresRelations = relations(theatres, ({ one, many }) => ({
  city: one(cities, { fields: [theatres.cityId], references: [cities.id] }),
  screens: many(screens),
}));

export const screensRelations = relations(screens, ({ one, many }) => ({
  theatre: one(theatres, {
    fields: [screens.theatreId],
    references: [theatres.id],
  }),
  shows: many(shows),
  seats: many(seats),
}));

export const showsRelations = relations(shows, ({ one, many }) => ({
  movie: one(movies, { fields: [shows.movieId], references: [movies.id] }),
  screen: one(screens, { fields: [shows.screenId], references: [screens.id] }),
  bookings: many(bookings),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  screen: one(screens, { fields: [seats.screenId], references: [screens.id] }),
  bookingSeats: many(bookingSeats),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  show: one(shows, { fields: [bookings.showId], references: [shows.id] }),
  bookingSeats: many(bookingSeats),
  payments: many(payments),
}));

export const bookingSeatsRelations = relations(bookingSeats, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingSeats.bookingId],
    references: [bookings.id],
  }),
  seat: one(seats, {
    fields: [bookingSeats.seatId],
    references: [seats.id],
  }),
}));
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));
export const groupRoomsRelations = relations(groupRooms, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupRooms.creatorId],
    references: [users.id],
  }),
  members: many(groupMembers),
  votes: many(votes),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  room: one(groupRooms, {
    fields: [groupMembers.roomId],
    references: [groupRooms.id],
  }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  room: one(groupRooms, {
    fields: [votes.roomId],
    references: [groupRooms.id],
  }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  movie: one(movies, { fields: [reviews.movieId], references: [movies.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, { fields: [wishlist.userId], references: [users.id] }),
  movie: one(movies, { fields: [wishlist.movieId], references: [movies.id] }),
}));
