import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./component/Layout";
import HomeRedirect from "./component/HomeRedirect";
import ProtectedRoute from "./component/ProtectedRoute";
import GuestRoute from "./component/GuestRoute"; // You need to create this for unauth routes

import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";

import FacultyDashboard from "./pages/faculty/Dashboard";
import Questions from "./pages/faculty/questions";
import Scoreboard from "./pages/faculty/scoreboard";
import Profile from './pages/faculty/Profile';
import CreateTest from "./pages/faculty/createTest";

import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentScoreboard from "./pages/student/scoreboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home (could redirect depending on auth) */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Login/Register only accessible if not logged in */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Faculty routes (nested under /) */}
          <Route path="dashboard" element={
            <ProtectedRoute roleRequired="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="questions" element={
            <ProtectedRoute roleRequired="faculty">
              <Questions />
            </ProtectedRoute>
          } />
          <Route path="scoreboard" element={
            <ProtectedRoute roleRequired="faculty">
              <Scoreboard />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute roleRequired="faculty">
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="createTest" element={
            <ProtectedRoute roleRequired="faculty">
              <CreateTest />
            </ProtectedRoute>
          } />

          {/* Student routes (nested under /student) */}
          <Route path="student/dashboard" element={
            <ProtectedRoute roleRequired="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="student/profile" element={
            <ProtectedRoute roleRequired="student">
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="student/scoreboard" element={
            <ProtectedRoute roleRequired="student">
              <StudentScoreboard />
            </ProtectedRoute>
          } />

          {/* Optionally add 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
