import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Targets from "./pages/Targets";
import Study from "./pages/Study";
import Workout from "./pages/Workout";
import Nutrition from "./pages/Nutrition";
import Sleep from "./pages/Sleep";
import Analytics from "./pages/Analytics";
import AIPlanner from "./pages/AIPlanner";
import Focus from "./pages/Focus";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="targets" element={<Targets />} />
          <Route path="study" element={<Study />} />
          <Route path="workout" element={<Workout />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="sleep" element={<Sleep />} />
          <Route path="focus" element={<Focus />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai-planner" element={<AIPlanner />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
