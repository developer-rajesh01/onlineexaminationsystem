import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Register a new user.
 * Expects JSON body:
 * { name, email, password, role, institute, branchBatch? }
 * - branchBatch is required when role === "student"
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, institute, branchBatch } = req.body;

    // basic validation
    if (!name || !email || !password || !role || !institute) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["student", "faculty"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'student' or 'faculty'." });
    }

    // if student, branchBatch must be provided
    if (role === "student" && (!branchBatch || !String(branchBatch).trim())) {
      return res.status(400).json({ message: "branchBatch is required for students" });
    }

    // Check if user already exists by email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user object
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      institute: institute.trim(),
    };

    if (role === "student") {
      userData.branchBatch = String(branchBatch).trim();
    }

    // Create new user document
    const newUser = new User(userData);
    await newUser.save();

    // Prepare returned user (omit password)
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      institute: newUser.institute,
      branchBatch: newUser.branchBatch || "",
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({ message: "Registration successful", user: userResponse });
  } catch (error) {
    console.error("registerUser error:", error);
    // handle duplicate-key error more clearly
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(409).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

/**
 * Login a user.
 * Expects JSON body: { email, password }
 * Returns { message, token, user }
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Build JWT payload (include useful user info)
    const jwtPayload = {
      id: user._id,
      role: user.role,
      institute: user.institute,
      branchBatch: user.branchBatch || "",
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institute: user.institute,
      branchBatch: user.branchBatch || "",
    };

    return res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
