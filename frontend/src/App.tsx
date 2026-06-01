import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { Home } from './pages/Home.js';
import { Auth } from './pages/Auth.js';
import { MovieDetails } from './pages/MovieDetails.js';
import { SeatBooking } from './pages/SeatBooking.js';
import { GroupBooking } from './pages/GroupBooking.js';
import { GroupRoomsList } from './pages/GroupRoomsList.js';
import { Dashboard } from './pages/Dashboard.js';
import { AdminPanel } from './pages/AdminPanel.js';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background flex flex-col justify-between select-none">
          <div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/movies/:id" element={<MovieDetails />} />
              <Route path="/shows/:showId/booking" element={<SeatBooking />} />
              <Route path="/group/:inviteCode" element={<GroupBooking />} />
              <Route path="/groups" element={<GroupRoomsList />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
