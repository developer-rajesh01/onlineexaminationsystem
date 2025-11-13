// src/pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image from "../assets/login.jpg";

const institutes = [
  "poornima university",
  "poornima Institute ",
];

const courses = [
  "MCA",
  "M.Tech",
  "MBA",
  "BBA",
  "BCA",
  "B.Sc",
  "B.Com",
  "BE/B.Tech",
  "PhD",
  "Diploma",
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    institute: "",
    branchBatch: "", // combined select value for students
  });

  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onInstituteInputChange = (e) => {
    const userInput = e.target.value;
    setFormData((prev) => ({ ...prev, institute: userInput }));

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
    setFormData((prev) => ({ ...prev, institute: suggestion }));
    setFilteredInstitutes([]);
    setShowSuggestions(false);
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
      branchBatch: value === "student" ? prev.branchBatch : "",
    }));
  };

  const validate = () => {
    if (!formData.name.trim()) return "Name is required.";
    if (!formData.email.trim()) return "Email is required.";
    if (!formData.password) return "Password is required.";
    if (!formData.role) return "Role is required.";
    if (!formData.institute.trim()) return "Institute is required.";

    if (formData.role === "student") {
      if (!formData.branchBatch) return "Please select a course or batch.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // trim fields
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        institute: formData.institute.trim(),
      };

      if (formData.role === "student") {
        payload.branchBatch = formData.branchBatch;
      }

      const res = await axios.post("http://localhost:5000/api/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });

      alert(res.data.message || "Registration Successful!");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const batchOptions = Array.from({ length: 10 }, (_, i) => `Batch ${i + 1}`);

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
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-4 py-3 mb-4 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="" disabled>
                Select role
              </option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>

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

            {formData.role === "student" && (
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">Course or Batch</label>
                <select
                  name="branchBatch"
                  value={formData.branchBatch}
                  onChange={(e) => setFormData({ ...formData, branchBatch: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                >
                  <option value="" disabled>
                    Select course or batch
                  </option>

                  <optgroup label="Courses">
                    {courses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Batches">
                    {batchOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

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
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl font-semibold mb-2 disabled:opacity-60"
            >
              {isSubmitting ? "Registering..." : "Register"}
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
        />
      </div>
    </div>
  );
}
