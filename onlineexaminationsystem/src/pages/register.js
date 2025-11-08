import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image from "../assets/login.jpg";

const institutes = [
  "poornima university",
  "poornima Institute ",
  "Institute C",
  "Institute of Technology",
  "Institute of Science",
  "New Horizon Institute",
];

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    institute: "",
  });

  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const onInstituteInputChange = (e) => {
    const userInput = e.target.value;
    setFormData({ ...formData, institute: userInput });

    if (userInput.length > 0) {
      const filtered = institutes.filter((inst) =>
        inst.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredInstitutes(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setFilteredInstitutes([]);
    }
  };

  const onSuggestionClick = (suggestion) => {
    setFormData({ ...formData, institute: suggestion });
    setFilteredInstitutes([]);
    setShowSuggestions(false);
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        institute: formData.institute,
      };

      const res = await axios.post("http://localhost:5000/api/auth/register", payload);
      alert(res.data.message || "Registration Successful!");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-2">
      <div
        className="w-full max-w-4xl bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-3xl shadow-2xl border-2 border-blue-200 flex flex-col md:flex-row overflow-hidden transform scale-105"
        style={{ willChange: "transform" }}
      >
        <div className="md:w-1/2 w-full p-10 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create an account</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
              className="w-full px-4 py-3 mb-4 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
              className="w-full px-4 py-3 mb-4 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
            <select
              name="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 mb-4 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="" disabled>
                Select role
              </option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>

            {/* Autocomplete Institute Input */}
            <div className="relative mb-4">
              <input
                type="text"
                name="institute"
                value={formData.institute}
                onChange={onInstituteInputChange}
                placeholder="Institute Name"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoComplete="off"
                required
              />
              {showSuggestions && filteredInstitutes.length > 0 && (
                <ul className="absolute bg-white border border-gray-300 w-full rounded-xl max-h-40 overflow-auto z-10">
                  {filteredInstitutes.map((inst, index) => (
                    <li
                      key={index}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-100"
                      onClick={() => onSuggestionClick(inst)}
                    >
                      {inst}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-3 text-blue-500 text-xs"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl font-semibold mb-2"
            >
              Register
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="underline text-blue-600">
              Login
            </Link>
          </div>
        </div>

        <div
          className="md:w-1/2 w-full relative flex flex-col justify-center items-center bg-center bg-cover"
          style={{ backgroundImage: `url(${image})` }}
        ></div>
      </div>
    </div>
  );
}

export default Register;
