import React from "react";
import { Link } from "react-router-dom";
<Link to="/login">Login</Link>


const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex shadow-md items-center justify-between bg-[#174B85]  p-6">
      {/* <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50"> */}

      {/* Left side - Project Name */}
      <div className="text-white text-xl font-semibold">
        OnlineExaminationSystem
      </div>

      {/* Right side - Links */}
      <div className="space-x-4">
        <a
          href="/login"
          className="text-white hover:text-gray-200 transition"
        >
          Login
        </a>
        <a
          href="/register"
          className="text-white hover:text-gray-200 transition"
        >
          Register
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
