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


import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ✅ Always confirm correct folder names: is it "components" or "component"?
import Layout from "./component/Layout";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import FacultyDashboard from "./pages/faculty/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
