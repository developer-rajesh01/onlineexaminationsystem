import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import image from "../assets/login.jpg";
import axios from "axios";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("name", res.data.user.name);
        localStorage.setItem("email", res.data.user.email);
        localStorage.setItem("institute", res.data.user.institute); 
        setMessage("✅ Login successful! Redirecting...");
        setLoading(false);

        // Redirect immediately with replace true
        if (res.data.user.role === "faculty") {
          navigate("/dashboard", { replace: true });
        } else if (res.data.user.role === "student") {
          navigate("/student/dashboard", { replace: true });
        } else {
          navigate("/student/dashboard", { replace: true });
        }
      }
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "❌ Invalid email or password");
    }
  };

  useEffect(() => {
    // Replace current history entry so Back doesn't go to login after redirect
    window.history.replaceState(null, "", window.location.href);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  via-indigo-50 to-white px-4">
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
