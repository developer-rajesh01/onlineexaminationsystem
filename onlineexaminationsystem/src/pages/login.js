import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import image from "../assets/login.jpg"; // Keep your path as is

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simulated auth logic — replace with your actual login API & response
        const fakeAuth = {
            role: email === "faculty@example.com" ? "faculty" : "student",
        };

        // Save user role in localStorage for layout and redirect logic
     
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-white px-4">
            <div className="flex w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden">
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
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold py-3 rounded-xl shadow-md"
                        >
                            Login
                        </button>
                    </form>
                    <div className="text-center mt-6 text-sm text-gray-600">
                        Don't have an account?{" "}
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
