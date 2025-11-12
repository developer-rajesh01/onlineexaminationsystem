import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    // not authenticated, continue (controller can fallback to req.body uploader info)
    return next();
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // select only fields you need:
    const user = await User.findById(payload.id).select("_id email name");
    if (user) req.user = user;
  } catch (err) {
    console.warn("JWT verify failed:", err.message);
    // do not throw: allow controllers to still accept uploader info from body if provided
  }
  next();
}
