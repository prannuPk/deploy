import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext"; // Import the SocketProvider
import VideoMeetComponent from "./pages/VideoMeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import withAuth from "./utils/withAuth"; // Import the withAuth HOC

// Wrap your VideoMeetComponent and History with the withAuth HOC
const AuthVideoMeetComponent = withAuth(VideoMeetComponent);
const AuthHistory = withAuth(History);

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <SocketProvider>
            {" "}
            {/* Wrap with SocketProvider */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Authentication />} />
              <Route path="/home" element={<HomeComponent />} />
              <Route path="/history" element={<AuthHistory />} />{" "}
              {/* Protect the History route */}
              <Route path="/:url" element={<AuthVideoMeetComponent />} />{" "}
              {/* Protect the VideoMeet route */}
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
