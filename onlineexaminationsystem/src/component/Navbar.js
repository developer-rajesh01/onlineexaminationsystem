import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex shadow-md items-center justify-between bg-[#174B85] p-6">

      {/* Left side - Project Name */}
      <div className="text-white text-xl font-semibold">
        OnlineExaminationSystem
      </div>

      {/* Right side - Links */}
      <div className="space-x-4">
        <Link
          to="/login"
          className="text-white hover:text-gray-200 transition"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="text-white hover:text-gray-200 transition"
        >
          Register
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;