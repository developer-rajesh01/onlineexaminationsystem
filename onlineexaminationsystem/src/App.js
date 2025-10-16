import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./component/Layout";
import HomeRedirect from "./component/HomeRedirect";
import ProtectedRoute from "./component/ProtectedRoute";

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
          <Route path="/" element={<HomeRedirect />} />  {/* Root redirect */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Faculty routes protected */}
          <Route path="/">
            <Route
              path="dashboard"
              element={
                <ProtectedRoute roleRequired="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="questions"
              element={
                <ProtectedRoute roleRequired="faculty">
                  <Questions />
                </ProtectedRoute>
              }
            />
            <Route
              path="scoreboard"
              element={
                <ProtectedRoute roleRequired="faculty">
                  <Scoreboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute roleRequired="faculty">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="createTest"
              element={
                <ProtectedRoute roleRequired="faculty">
                  <CreateTest />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Student routes protected */}
          <Route path="/student">
            <Route
              path="dashboard"
              element={
                <ProtectedRoute roleRequired="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute roleRequired="student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="scoreboard"
              element={
                <ProtectedRoute roleRequired="student">
                  <StudentScoreboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Optionally 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
