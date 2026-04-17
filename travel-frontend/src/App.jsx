import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home           from "./pages/Home";
import Login          from "./pages/Login";
import Profile        from "./pages/profile";
import Trips          from "./pages/trip";
import Explore        from "./pages/Explore";
import OptimizedRoute from "./pages/OptimizedRoute";
import MyTrips        from "./pages/MyTrips";
import ResetPassword  from "./pages/ResetPassword";
import Emergency      from "./pages/Emergency";
import Distance       from "./pages/Distance";
import Suggestions    from "./pages/Suggestions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/profile"        element={<Profile />} />
        <Route path="/trips"          element={<Trips />} />
        <Route path="/explore"        element={<Explore />} />
        <Route path="/route"          element={<OptimizedRoute />} />
        <Route path="/my-trips"       element={<MyTrips />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/emergency"      element={<Emergency />} />
        <Route path="/distance"       element={<Distance />} />
        <Route path="/suggestions"    element={<Suggestions />} />
      </Routes>
    </Router>
  );
}

export default App;
