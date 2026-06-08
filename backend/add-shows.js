const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let nextId = Math.max(...db.shows.map(s => s.id)) + 1;

const extraShowTimes = ['10:00 AM', '03:30 PM', '09:30 PM'];
const newShows = [];

db.shows.forEach(show => {
  extraShowTimes.forEach(time => {
    newShows.push({
      id: nextId++,
      movieId: show.movieId,
      screenId: show.screenId,
      language: show.language,
      startTime: time,
      date: show.date,
      priceRegular: show.priceRegular,
      pricePremium: show.pricePremium,
      priceRecliner: show.priceRecliner
    });
  });
});

db.shows.push(...newShows);
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Successfully added ${newShows.length} new showtimes!`);
