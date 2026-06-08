import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as dotenv from "dotenv";
import { screens, seats, shows } from "../src/db/schema";
 
dotenv.config({ path: ".env" });
if (!process.env.DATABASE_URL) dotenv.config({ path: "../.env" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not found");
 
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool);
 
// ─── YOUR REAL THEATRE IDs (1–22) ────────────────────────────────────────────
const THEATRE_SCREENS = [
  { theatreId: 1,  screenNumber: 1, type: "2D"   },
  { theatreId: 1,  screenNumber: 2, type: "3D"   },
  { theatreId: 2,  screenNumber: 1, type: "IMAX" },
  { theatreId: 2,  screenNumber: 2, type: "2D"   },
  { theatreId: 3,  screenNumber: 1, type: "IMAX" },
  { theatreId: 3,  screenNumber: 2, type: "3D"   },
  { theatreId: 4,  screenNumber: 1, type: "2D"   },
  { theatreId: 4,  screenNumber: 2, type: "IMAX" },
  { theatreId: 5,  screenNumber: 1, type: "3D"   },
  { theatreId: 5,  screenNumber: 2, type: "2D"   },
  { theatreId: 6,  screenNumber: 1, type: "IMAX" },
  { theatreId: 6,  screenNumber: 2, type: "2D"   },
  { theatreId: 7,  screenNumber: 1, type: "2D"   },
  { theatreId: 8,  screenNumber: 1, type: "3D"   },
  { theatreId: 9,  screenNumber: 1, type: "IMAX" },
  { theatreId: 10, screenNumber: 1, type: "2D"   },
  { theatreId: 11, screenNumber: 1, type: "3D"   },
  { theatreId: 12, screenNumber: 1, type: "IMAX" },
  { theatreId: 13, screenNumber: 1, type: "2D"   },
  { theatreId: 14, screenNumber: 1, type: "2D"   },
  { theatreId: 15, screenNumber: 1, type: "3D"   },
  { theatreId: 16, screenNumber: 1, type: "2D"   },
  { theatreId: 17, screenNumber: 1, type: "2D"   },
  { theatreId: 18, screenNumber: 1, type: "IMAX" },
  { theatreId: 19, screenNumber: 1, type: "IMAX" },
  { theatreId: 20, screenNumber: 1, type: "3D"   },
  { theatreId: 21, screenNumber: 1, type: "2D"   },
  { theatreId: 22, screenNumber: 1, type: "IMAX" },
];
 
// Seat layout: A-B = Regular, C-D = Premium, E-F = Recliner (10 seats each)
const ROWS = [
  { row: "A", category: "Regular"  },
  { row: "B", category: "Regular"  },
  { row: "C", category: "Premium"  },
  { row: "D", category: "Premium"  },
  { row: "E", category: "Recliner" },
  { row: "F", category: "Recliner" },
];
const SEATS_PER_ROW = 10;
 
// Shows for today and next 4 days for all 12 movies
const TODAY = new Date();
const DATES = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(TODAY);
  d.setDate(TODAY.getDate() + i);
  return d.toISOString().split("T")[0];
});
 
const TIMES = ["10:00 AM", "01:30 PM", "05:00 PM", "09:00 PM"];
 
// Each movie gets shows across multiple screens
const MOVIE_SCREEN_MAP: { movieId: number; screenIndexes: number[] }[] = [
  { movieId: 1,  screenIndexes: [0, 2, 4]  },
  { movieId: 2,  screenIndexes: [1, 5, 8]  },
  { movieId: 3,  screenIndexes: [3, 6, 10] },
  { movieId: 4,  screenIndexes: [7, 11, 13]},
  { movieId: 5,  screenIndexes: [9, 14, 16]},
  { movieId: 6,  screenIndexes: [12, 17, 19]},
  { movieId: 7,  screenIndexes: [15, 20, 22]},
  { movieId: 8,  screenIndexes: [18, 21, 23]},
  { movieId: 9,  screenIndexes: [24, 25, 26]},
  { movieId: 10, screenIndexes: [0, 3, 7]  },
  { movieId: 11, screenIndexes: [1, 6, 12] },
  { movieId: 12, screenIndexes: [2, 5, 9]  },
];
 
async function seed() {
  console.log("🌱 Starting seed...\n");
 
  // 1. Insert screens
  console.log("📺 Inserting screens...");
  const insertedScreens: { id: number }[] = [];
  for (const s of THEATRE_SCREENS) {
    const result = await db
      .insert(screens)
      .values({ number: s.screenNumber, type: s.type, theatreId: s.theatreId })
      .returning({ id: screens.id });
    insertedScreens.push(result[0]);
  }
  console.log(`  ✅ ${insertedScreens.length} screens inserted\n`);
 
  // 2. Insert seats for every screen
  console.log("💺 Inserting seats...");
  for (const screen of insertedScreens) {
    for (const rowDef of ROWS) {
      for (let num = 1; num <= SEATS_PER_ROW; num++) {
        await db.insert(seats).values({
          screenId: screen.id,
          row: rowDef.row,
          number: num,
          category: rowDef.category,
        });
      }
    }
  }
  console.log(`  ✅ ${insertedScreens.length * 60} seats inserted\n`);
 
  // 3. Insert shows
  console.log("🎬 Inserting shows...");
  let showCount = 0;
  for (const mapping of MOVIE_SCREEN_MAP) {
    for (const screenIdx of mapping.screenIndexes) {
      const screen = insertedScreens[screenIdx];
      if (!screen) continue;
      for (const date of DATES) {
        for (const time of TIMES) {
          await db.insert(shows).values({
            movieId: mapping.movieId,
            screenId: screen.id,
            language: "Hindi",
            startTime: time,
            date,
            priceRegular: 150,
            pricePremium: 250,
            priceRecliner: 450,
          });
          showCount++;
        }
      }
    }
  }
  console.log(`  ✅ ${showCount} shows inserted\n`);
 
  console.log("✅ Seed complete!");
  await pool.end();
}
 
seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
 
