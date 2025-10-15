<<<<<<< HEAD
// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import image from "../assets/login.jpg"; // Keep your path as is

// function LoginPage() {
//     const navigate = useNavigate();
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         // Simulated auth logic — replace with your actual login API & response
//         const fakeAuth = {
//             role: email === "faculty@example.com" ? "faculty" : "student",
//         };

//         // Save user role in localStorage for layout and redirect logic
     
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-white px-4">
//             <div className="flex w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden">
//                 {/* Left: Login Form */}
//                 <div className="flex-1 p-10 flex flex-col justify-center">
//                     <h2 className="text-3xl font-extrabold text-blue-900 mb-8 text-center">
//                         Login to Your Account
//                     </h2>
//                     <form onSubmit={handleSubmit}>
//                         <input
//                             type="email"
//                             placeholder="Email address"
//                             className="w-full px-5 py-3 mb-6 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
//                             required
//                             autoComplete="email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                         />
//                         <input
//                             type="password"
//                             placeholder="Password"
//                             className="w-full px-5 py-3 mb-6 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
//                             required
//                             autoComplete="current-password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                         />
//                         <button
//                             type="submit"
//                             className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold py-3 rounded-xl shadow-md"
//                         >
//                             Login
//                         </button>
//                     </form>
//                     <div className="text-center mt-6 text-sm text-gray-600">
//                         Don't have an account?{" "}
//                         <Link
//                             to="/register"
//                             className="text-indigo-600 hover:text-indigo-800 font-medium underline"
//                         >
//                             Register
//                         </Link>
//                     </div>
//                 </div>
//                 {/* Right: Image section */}
//                 <div
//                     className="md:w-1/2 w-full relative flex flex-col justify-center items-center bg-center bg-cover"
//                     style={{
//                         backgroundImage: `url(${image})`,
//                         minHeight: "400px",
//                     }}
//                 ></div>
//             </div>
//         </div>
//     );
// }

// export default LoginPage;

// ---------------------------------------------------------------

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image from "../assets/login.jpg";
=======
import React, { useEffect,useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import image from "../assets/login.jpg"; // Make sure image path is correct
>>>>>>> ae045380ffec25ede23368061158e30ed56c1943

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // ✅ Success/Error message
  const [loading, setLoading] = useState(false);

<<<<<<< HEAD
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (res.data.token) {
        // ✅ Store token & user info
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("name", res.data.user.name);
=======

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simulated authentication logic
        const fakeAuth = {
            role: email === "faculty@example.com" ? "faculty" : "student",
        };

        // Save user role and email in localStorage
        localStorage.setItem("userRole", fakeAuth.role);
        localStorage.setItem("userEmail", email);

        // Redirect based on role
        if (fakeAuth.role === "faculty") {
            navigate("/dashboard", { replace: true });
        } else if (fakeAuth.role === "student") {
            navigate("/student/dashboard", { replace: true });
        } else {
            navigate("/login", { replace: true }); // fallback
        }
    };
    useEffect(() => {
        // Replace current history entry so Back doesn't go anywhere previous
        window.history.replaceState(null, "", window.location.href);
    }, []);
>>>>>>> ae045380ffec25ede23368061158e30ed56c1943

        // ✅ Show success message
        setMessage("✅ Login successful! Redirecting...");
        setLoading(false);

        // ⏳ Redirect after 2 seconds
        setTimeout(() => {
          if (res.data.user.role === "faculty") {
            navigate("/faculty/dashboard");
          } else {
            navigate("/student/dashboard");
          }
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "❌ Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-white px-4">
      <div className="flex w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
        {/* Left: Login Form */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold text-blue-900 mb-8 text-center">
            Login to Your Account
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-5 py-3 mb-6 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-3 mb-6 rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* ✅ Message (Success/Error) */}
            {message && (
              <p
                className={`text-center mb-4 font-medium ${
                  message.includes("✅") ? "text-green-600" : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white shadow-md transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Right: Image section */}
        <div
          className="md:w-1/2 w-full relative flex flex-col justify-center items-center bg-center bg-cover"
          style={{
            backgroundImage: `url(${image})`,
            minHeight: "400px",
          }}
        ></div>
      </div>
    </div>
  );
}

export default LoginPage;
