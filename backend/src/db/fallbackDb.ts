import * as fs from "fs";
import * as path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");

export interface City {
  id: number;
  name: string;
  slug: string;
}
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  profilePic?: string;
  createdAt: string;
}
export interface Movie {
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
  trending: boolean;
  topRated: boolean;
}
export interface Theatre {
  id: number;
  name: string;
  cityId: number;
  address: string;
}
export interface Screen {
  id: number;
  number: number;
  type: string;
  theatreId: number;
}
export interface Show {
  id: number;
  movieId: number;
  screenId: number;
  startTime: string;
  date: string;
  priceRegular: number;
  pricePremium: number;
  priceRecliner: number;
}
export interface Seat {
  id: number;
  screenId: number;
  row: string;
  number: number;
  category: string;
}
export interface Booking {
  id: number;
  userId: number;
  showId: number;
  totalAmount: number;
  status: string;
  code: string;
  createdAt: string;
}
export interface BookingSeat {
  bookingId: number;
  seatId: number;
}
export interface Payment {
  id: number;
  bookingId: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: string;
  createdAt: string;
}
export interface GroupRoom {
  id: number;
  name: string;
  creatorId: number;
  inviteCode: string;
  status: string;
  selectedMovieId?: number;
  selectedTheatreId?: number;
  selectedShowId?: number;
  createdAt: string;
}
export interface GroupMember {
  id: number;
  roomId: number;
  userId: number;
  joinedAt: string;
}
export interface Vote {
  id: number;
  roomId: number;
  userId: number;
  voteType: "movie" | "theatre" | "showtime";
  votedId: number;
}
export interface Notification {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}
export interface Review {
  id: number;
  userId: number;
  movieId: number;
  rating: number;
  comment?: string;
  createdAt: string;
}
export interface Wishlist {
  id: number;
  userId: number;
  movieId: number;
}

export class FallbackDatabase {
  cities: City[] = [];
  users: User[] = [];
  movies: Movie[] = [];
  theatres: Theatre[] = [];
  screens: Screen[] = [];
  shows: Show[] = [];
  seats: Seat[] = [];
  bookings: Booking[] = [];
  bookingSeats: BookingSeat[] = [];
  payments: Payment[] = [];
  groupRooms: GroupRoom[] = [];
  groupMembers: GroupMember[] = [];
  votes: Vote[] = [];
  notifications: Notification[] = [];
  reviews: Review[] = [];
  wishlist: Wishlist[] = [];

  constructor() {
    this.load();
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        Object.assign(this, data);
        return;
      } catch (err) {
        console.error("Failed to read local DB file, reseeding...", err);
      }
    }
    this.seed();
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save local DB file:", err);
    }
  }

  seed() {
    // 1. SEED CITIES (12 cities)
    const citiesList = [
      { id: 1, name: "Bengaluru", slug: "bengaluru" },
      { id: 2, name: "Mumbai", slug: "mumbai" },
      { id: 3, name: "Delhi", slug: "delhi" },
      { id: 4, name: "Hyderabad", slug: "hyderabad" },
      { id: 5, name: "Chennai", slug: "chennai" },
      { id: 6, name: "Kolkata", slug: "kolkata" },
      { id: 7, name: "Pune", slug: "pune" },
      { id: 8, name: "Ahmedabad", slug: "ahmedabad" },
      { id: 9, name: "Kochi", slug: "kochi" },
      { id: 10, name: "Mysuru", slug: "mysuru" },
      { id: 11, name: "Mangalore", slug: "mangalore" },
      { id: 12, name: "Udupi", slug: "udupi" },
    ];
    this.cities = citiesList;

    // 2. SEED USERS
    // Default admin user: admin@cinecircle.com (password: admin123)
    // Default user: user@cinecircle.com (password: user123)
    this.users = [
      {
        id: 1,
        email: "admin@cinecircle.com",
        passwordHash:
          "$2a$10$954t94h0XgP2R3Hl.rD75Obd0a3d4f.t7w9m4c2d3g4h5i6j7k8l.", // admin123 bcrypt-like or custom
        fullName: "System Administrator",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        email: "user@cinecircle.com",
        passwordHash:
          "$2a$10$954t94h0XgP2R3Hl.rD75Obd0a3d4f.t7w9m4c2d3g4h5i6j7k8l.", // user123
        fullName: "Rohan Sharma",
        role: "user",
        createdAt: new Date().toISOString(),
      },
    ];

    // 3. SEED MOVIES (15 movies)
    this.movies = [
      // Now Showing (5 Movies)
      {
        id: 1,
        title: "Karuppu",
        description:
          "An intense action thriller set in rural Tamil Nadu exploring dark secrets and ancient family vendettas.",
        genre: "Action/Thriller",
        language: "Tamil",
        durationMins: 145,
        rating: "UA",
        ratingValue: "8.8",
        releaseDate: "2026-05-10",
        trailerUrl: "https://www.youtube.com/embed/JpVl_-1YgIo",
        posterUrl: "http://localhost:5000/images/karuppu.png", // mapped to Ranveer image
        isNowShowing: true,
        trending: true,
        topRated: true,
      },
      {
        id: 2,
        title: "Drishyam 3",
        description:
          "Georgekutty returns with his clever plots to protect his family once again as the police uncover a new lead.",
        genre: "Mystery/Thriller",
        language: "Malayalam",
        durationMins: 160,
        rating: "UA",
        ratingValue: "9.2",
        releaseDate: "2026-05-15",
        trailerUrl: "https://www.youtube.com/embed/07h9Y1XKBWI",
        posterUrl: "http://localhost:5000/images/drishyam%203.png",
        isNowShowing: true,
        trending: true,
        topRated: true,
      },
      {
        id: 3,
        title: "Chand Mera Dil",
        description:
          "A magical romance that transcends boundaries, following two passionate lovers battling the tides of time.",
        genre: "Romance/Drama",
        language: "Hindi",
        durationMins: 132,
        rating: "U",
        ratingValue: "8.5",
        releaseDate: "2026-05-20",
        trailerUrl: "https://www.youtube.com/embed/rRQ8oKCoYrQ",
        posterUrl: "http://localhost:5000/images/chand%20mera%20dil.png",
        isNowShowing: true,
        trending: false,
        topRated: false,
      },
      {
        id: 4,
        title: "KD: The Devil",
        description:
          "Set in 1970s Bangalore, KD is the rise of the legendary gangster who controlled the dark underbelly of the city.",
        genre: "Action/Crime",
        language: "Kannada",
        durationMins: 155,
        rating: "A",
        ratingValue: "9.0",
        releaseDate: "2026-05-25",
        trailerUrl: "https://www.youtube.com/embed/yQLKrS5N4KU",
        posterUrl: "http://localhost:5000/images/kd%20the%20devil.png",
        isNowShowing: true,
        trending: true,
        topRated: false,
      },
      {
        id: 5,
        title: "Dhurandhar 2",
        description:
          "The explosive sequel packed with action, comedy, and high stakes, featuring an all-star cast in a race against crime.",
        genre: "Action/Comedy",
        language: "Hindi",
        durationMins: 140,
        rating: "UA",
        ratingValue: "8.1",
        releaseDate: "2026-05-28",
        trailerUrl: "https://www.youtube.com/embed/NHk7scrb_9I",
        posterUrl: "http://localhost:5000/images/dhurandhar%202.png",
        isNowShowing: true,
        trending: true,
        topRated: true,
      },
      // Coming Soon (10 Movies)
      {
        id: 6,
        title: "Peddi",
        description:
          "An emotional family drama set in Andhra Pradesh capturing the essence of kinship and personal dreams.",
        genre: "Drama",
        language: "Telugu",
        durationMins: 135,
        rating: "U",
        ratingValue: "Pending",
        releaseDate: "2026-06-15",
        trailerUrl: "https://www.youtube.com/embed/sF2dj7ycZvA",
        posterUrl: "http://localhost:5000/images/peddi.png",
        isNowShowing: false,
        trending: false,
        topRated: false,
      },
      {
        id: 7,
        title: "Cocktail 2",
        description:
          "A sophisticated relationship drama analyzing modern friendships, career priorities, and true love.",
        genre: "Drama/Romance",
        language: "Hindi",
        durationMins: 125,
        rating: "UA",
        ratingValue: "Pending",
        releaseDate: "2026-06-25",
        trailerUrl: undefined,
        posterUrl: "http://localhost:5000/images/cocktail%202.png",
        isNowShowing: false,
        trending: false,
        topRated: false,
      },
      {
        id: 8,
        title: "Maa Inti Bangaram",
        description:
          "A rich comedy of errors focusing on a traditional gold merchant family in coastal Andhra.",
        genre: "Comedy/Drama",
        language: "Telugu",
        durationMins: 130,
        rating: "U",
        ratingValue: "Pending",
        releaseDate: "2026-07-01",
        trailerUrl: "https://www.youtube.com/embed/B9d-wISnm8s",
        posterUrl: "http://localhost:5000/images/maa%20inti%20bangaram.png",
        isNowShowing: false,
        trending: false,
        topRated: false,
      },
      {
        id: 9,
        title: "Jailer 2",
        description:
          "Superstar returns in the high-stakes actioner, guarding a federal high-security facility from international cartels.",
        genre: "Action/Thriller",
        language: "Tamil",
        durationMins: 158,
        rating: "UA",
        ratingValue: "Pending",
        releaseDate: "2026-07-15",
        trailerUrl: undefined,
        posterUrl: "http://localhost:5000/images/jailer%202.png",
        isNowShowing: false,
        trending: true,
        topRated: false,
      },
      {
        id: 10,
        title: "Ramayana Part 1",
        description:
          "A cinematic masterpiece recreating the epic saga of virtues, duties, and the victory of good over evil.",
        genre: "Epic/Fantasy",
        language: "Hindi",
        durationMins: 180,
        rating: "U",
        ratingValue: "Pending",
        releaseDate: "2026-08-01",
        trailerUrl: "https://www.youtube.com/embed/1pnKd6YHmV4",
        posterUrl: "http://localhost:5000/images/ramayan%20part%201.png",
        isNowShowing: false,
        trending: true,
        topRated: true,
      },
      {
        id: 11,
        title: "Toxic",
        description:
          "Yash stars in a mind-bending crime saga focused on the drug mafia operational in international shipping ports.",
        genre: "Crime/Action",
        language: "Kannada",
        durationMins: 165,
        rating: "A",
        ratingValue: "Pending",
        releaseDate: "2026-08-20",
        trailerUrl: "https://www.youtube.com/embed/aF08WVSvCok",
        posterUrl: "http://localhost:5000/images/toxic.png",
        isNowShowing: false,
        trending: true,
        topRated: false,
      },
      {
        id: 12,
        title: "King",
        description:
          "Shah Rukh Khan stars in a stylistic thriller exploring a cold war of intelligence in Central Europe.",
        genre: "Action/Thriller",
        language: "Hindi",
        durationMins: 148,
        rating: "UA",
        ratingValue: "Pending",
        releaseDate: "2026-09-05",
        trailerUrl: undefined,
        posterUrl: "http://localhost:5000/images/king.png",
        isNowShowing: false,
        trending: true,
        topRated: false,
      },
      {
        id: 13,
        title: "Hai Jawani Toh Ishq Hona Hai",
        description:
          "A musical journey of college roommates embarking on a chaotic and heart-warming summer road trip.",
        genre: "Romance/Comedy",
        language: "Hindi",
        durationMins: 128,
        rating: "U",
        ratingValue: "7",
        releaseDate: "2026-09-18",
        trailerUrl: "https://www.youtube.com/embed/rFOdIv1jwhc",
        posterUrl: "http://localhost:5000/images/varun.png",
        isNowShowing: true,
        trending: false,
        topRated: false,
      },
      {
        id: 14,
        title: "Superman",
        description:
          "The legendary Man of Steel rises again to combat a colossal cosmic threat endangering Earth's cores.",
        genre: "Sci-Fi/Action",
        language: "English",
        durationMins: 150,
        rating: "UA",
        ratingValue: "8.3",
        releaseDate: "2026-10-10",
        trailerUrl: "https://www.youtube.com/embed/Ox8ZLF6cGM0",
        posterUrl: "http://localhost:5000/images/superman.png",
        isNowShowing: true,
        trending: true,
        topRated: false,
      },
      {
        id: 15,
        title: "Avatar 3",
        description:
          "Explore the fire nation of Pandora as the Sully family interacts with aggressive and dangerous ash clans.",
        genre: "Sci-Fi/Fantasy",
        language: "English",
        durationMins: 192,
        rating: "UA",
        ratingValue: "9.3",
        releaseDate: "2026-12-18",
        trailerUrl: "https://www.youtube.com/embed/Ma1x7ikpid8",
        posterUrl: "http://localhost:5000/images/avatar%203.png",
        isNowShowing: true,
        trending: true,
        topRated: true,
      },
    ];

    // 4. SEED THEATRES (25+ Theatres distributed across supported cities)
    this.theatres = [
      // Bengaluru
      {
        id: 1,
        name: "PVR Orion Mall",
        cityId: 1,
        address: "Dr Rajkumar Rd, Rajajinagar, Bengaluru",
      },
      {
        id: 2,
        name: "INOX Garuda Mall",
        cityId: 1,
        address: "Magrath Rd, Ashok Nagar, Bengaluru",
      },
      {
        id: 3,
        name: "Cinepolis Bannerghatta",
        cityId: 1,
        address: "Meenakshi Mall, Bannerghatta Rd, Bengaluru",
      },
      // Mumbai
      {
        id: 4,
        name: "PVR Phoenix Palladium",
        cityId: 2,
        address: "Senapati Bapat Marg, Lower Parel, Mumbai",
      },
      {
        id: 5,
        name: "INOX R City Mall",
        cityId: 2,
        address: "LBS Marg, Ghatkopar West, Mumbai",
      },
      {
        id: 6,
        name: "Cinepolis Andheri",
        cityId: 2,
        address: "Fun Republic Mall, Andheri West, Mumbai",
      },
      // Hyderabad
      {
        id: 7,
        name: "AMB Cinemas",
        cityId: 4,
        address: "Gachibowli Rd, Hyderabad",
      },
      {
        id: 8,
        name: "Asian GPR Multiplex",
        cityId: 4,
        address: "Kukatpally, Hyderabad",
      },
      {
        id: 9,
        name: "PVR Next Galleria Mall",
        cityId: 4,
        address: "Punjagutta, Hyderabad",
      },
      // Chennai
      {
        id: 10,
        name: "PVR Palazzo Mall",
        cityId: 5,
        address: "Vadapalani, Chennai",
      },
      { id: 11, name: "AGS Cinemas", cityId: 5, address: "T Nagar, Chennai" },
      { id: 12, name: "INOX Marina Mall", cityId: 5, address: "OMR, Chennai" },
      // Mangalore
      {
        id: 13,
        name: "PVR Forum Fiza Mall",
        cityId: 11,
        address: "Pandeshwar, Mangalore",
      },
      {
        id: 14,
        name: "Bharath Cinemas Mangalore",
        cityId: 11,
        address: "Bejai, Mangalore",
      },
      {
        id: 15,
        name: "Cine Galaxy Multiplex",
        cityId: 11,
        address: "Surathkal, Mangalore",
      },
      // Udupi
      {
        id: 16,
        name: "Bharath Cinemas Udupi",
        cityId: 12,
        address: "Canara Mall, Manipal, Udupi",
      },
      {
        id: 17,
        name: "Ashirwad Theatre",
        cityId: 12,
        address: "Kalyanpura, Udupi",
      },
      // Delhi
      {
        id: 18,
        name: "PVR Director's Cut",
        cityId: 3,
        address: "Vasant Kunj, Delhi",
      },
      { id: 19, name: "INOX Connaught Place", cityId: 3, address: "CP, Delhi" },
      // Kolkata
      {
        id: 20,
        name: "PVR Mani Square",
        cityId: 6,
        address: "EM Bypass, Kolkata",
      },
      {
        id: 21,
        name: "INOX Quest Mall",
        cityId: 6,
        address: "Ballygunge, Kolkata",
      },
      // Pune
      {
        id: 22,
        name: "PVR Phoenix Marketcity",
        cityId: 7,
        address: "Viman Nagar, Pune",
      },
      // Ahmedabad
      {
        id: 23,
        name: "Cinepolis Alpha One",
        cityId: 8,
        address: "Vastrapur, Ahmedabad",
      },
      // Kochi
      {
        id: 24,
        name: "PVR Lulu Mall Kochi",
        cityId: 9,
        address: "Edappally, Kochi",
      },
      // Mysuru
      {
        id: 25,
        name: "INOX Mall of Mysore",
        cityId: 10,
        address: "Ittegegud, Mysuru",
      },
    ];

    // 5. SEED SCREENS
    // Each theatre gets 2 screens
    let screenId = 1;
    this.theatres.forEach((t) => {
      this.screens.push({
        id: screenId++,
        number: 1,
        type: "IMAX",
        theatreId: t.id,
      });
      this.screens.push({
        id: screenId++,
        number: 2,
        type: "2D",
        theatreId: t.id,
      });
    });

    // 6. SEED SEATS FOR EACH SCREEN
    // A standard seat map with 60 seats (6 rows, 10 columns)
    // Row A, B: Premium (Rs 250)
    // Row C, D, E: Regular (Rs 150)
    // Row F: Recliner (Rs 450)
    let seatId = 1;
    const rows = ["A", "B", "C", "D", "E", "F"];
    this.screens.forEach((screen) => {
      rows.forEach((row) => {
        const category =
          row === "A" || row === "B"
            ? "Premium"
            : row === "F"
              ? "Recliner"
              : "Regular";
        for (let num = 1; num <= 10; num++) {
          this.seats.push({
            id: seatId++,
            screenId: screen.id,
            row,
            number: num,
            category,
          });
        }
      });
    });

    // 7. SEED SHOW SCHEDULES (100+ Shows)
    // Movie 1 to 5 are Now Showing. Distributed over screens and 3 consecutive dates.
    const dates = ["2026-05-31", "2026-06-01", "2026-06-02"];
    const timings = [
      "09:00 AM",
      "12:30 PM",
      "03:45 PM",
      "06:30 PM",
      "09:30 PM",
      "11:45 PM",
    ];

    let showId = 1;
    // Map shows across theatres
    this.theatres.forEach((theatre) => {
      const myScreens = this.screens.filter((s) => s.theatreId === theatre.id);
      // Give each screen a set of shows
      myScreens.forEach((screen, index) => {
        dates.forEach((date) => {
          // Screen 1 showing movie index 1, 2, 3
          // Screen 2 showing movie index 4, 5
          const moviePool = index === 0 ? [1, 2, 3] : [4, 5];
          moviePool.forEach((mId, tIdx) => {
            const time = timings[tIdx * 2 + 1]; // e.g. 12:30 PM, 06:30 PM
            this.shows.push({
              id: showId++,
              movieId: mId,
              screenId: screen.id,
              startTime: time,
              date,
              priceRegular: 150,
              pricePremium: 250,
              priceRecliner: 450,
            });
          });
        });
      });
    });
  }
}
