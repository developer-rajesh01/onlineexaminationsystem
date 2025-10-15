import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./component/Layout";  // Your dynamic role-based layout

import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import FacultyDashboard from "./pages/faculty/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import Navbar from './component/Navbar';
import Footer from './component/Footer';
import { AuthContext } from "./AuthContext";


function App() {
  
  return (
    <BrowserRouter>
      {/* Wrap routes inside Layout which handles header/footer */}
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          {/* other routes */}
          {/* Optionally 404 page */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Layout>
      
    </BrowserRouter>
  );
}

export default App;
