import "./App.css";
import { Routes, Route } from "react-router-dom";

import Layout from "./component/Layout";
import HomeRedirect from "./component/HomeRedirect";
import ProtectedRoute from "./component/ProtectedRoute";
import GuestRoute from "./component/GuestRoute";

import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";

import FacultyDashboard from "./pages/faculty/Dashboard";
import Questions from "./pages/faculty/questions";
import Scoreboard from "./pages/faculty/scoreboard";
import Profile from "./pages/faculty/Profile";
import CreateTest from "./pages/faculty/createTest";

import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentScoreboard from "./pages/student/scoreboard";

import StartTestPage from "./pages/StartTestPage";
import SecureTestPage from "./pages/SecureTestPage";
import TestReport from "./pages/faculty/TestReport";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        <Route path="dashboard" element={<ProtectedRoute roleRequired="faculty"><FacultyDashboard /></ProtectedRoute>} />
        <Route path="questions" element={<ProtectedRoute roleRequired="faculty"><Questions /></ProtectedRoute>} />
        <Route path="scoreboard" element={<ProtectedRoute roleRequired="faculty"><Scoreboard /></ProtectedRoute>} />

        <Route path="/test-report/:testId" element={<ProtectedRoute roleRequired="faculty"><TestReport /></ProtectedRoute>} />

        <Route path="profile" element={<ProtectedRoute roleRequired="faculty"><Profile /></ProtectedRoute>} />

        <Route path="createTest" element={<ProtectedRoute roleRequired="faculty"><CreateTest /></ProtectedRoute>} />
        <Route path="createTest/:id" element={<ProtectedRoute roleRequired="faculty"><CreateTest /></ProtectedRoute>} />

        <Route path="student/dashboard" element={<ProtectedRoute roleRequired="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="student/profile" element={<ProtectedRoute roleRequired="student"><StudentProfile /></ProtectedRoute>} />
        <Route path="student/scoreboard" element={<ProtectedRoute roleRequired="student"><StudentScoreboard /></ProtectedRoute>} />

        <Route path="test/:id" element={<ProtectedRoute roleRequired="student"><StartTestPage /></ProtectedRoute>} />

        <Route path="secure-test/:attemptId" element={<ProtectedRoute roleRequired="student"><SecureTestPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;