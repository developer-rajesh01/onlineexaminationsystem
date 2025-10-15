// import React from 'react';
// import './App.css';
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Layout from "./component/Layout";  // Your dynamic role-based layout

// import LoginPage from "./pages/login";
// import RegisterPage from "./pages/register";
// import FacultyDashboard from "./pages/faculty/Dashboard";
// import StudentDashboard from "./pages/student/Dashboard";
// import Navbar from './component/Navbar';
// import Footer from './component/Footer';
// // import { AuthContext } from "./AuthContext";


// function App() {
  
//   return (
//     <BrowserRouter>
//       {/* Wrap routes inside Layout which handles header/footer */}
//       <Layout>
//         <Routes>
//           <Route path="/" element={<LoginPage />} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />
//           <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
//           <Route path="/student/dashboard" element={<StudentDashboard />} />
//           <Route path="/navbar" element={<Navbar />} />
//           <Route path="/footer" element={<Footer />} />
//           {/* <Route path="/authcontext" element={<AuthContext />} /> */}
//           {/* other routes */}
//           {/* Optionally 404 page */}
//           {/* <Route path="*" element={<NotFound />} /> */}
//         </Routes>
//       </Layout>
      
//     </BrowserRouter>
//   );
// }

// export default App;

// -----------------------------------------------------------------

import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

<<<<<<< HEAD
// ✅ Always confirm correct folder names: is it "components" or "component"?
import Layout from "./component/Layout";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import FacultyDashboard from "./pages/faculty/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
=======
import Layout from "./component/Layout";
import HomeRedirect from "./component/HomeRedirect";
import ProtectedRoute from "./component/ProtectedRoute";

import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";

import FacultyDashboard from "./pages/faculty/Dashboard";
import Questions from "./pages/faculty/questions";
import Scoreboard from "./pages/faculty/scoreboard";
import Profile from './pages/faculty/Profile';

import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentScoreboard from "./pages/student/scoreboard";
>>>>>>> ae045380ffec25ede23368061158e30ed56c1943

function App() {
  return (
    <BrowserRouter>
<<<<<<< HEAD
      {/* Layout wraps all pages (includes navbar/footer if needed) */}
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/navbar" element={<Navbar />} />
          <Route path="/footer" element={<Footer />} />
          {/* Add a 404 route if you want */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Layout>
=======
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
>>>>>>> ae045380ffec25ede23368061158e30ed56c1943
    </BrowserRouter>
  );
}

export default App;
