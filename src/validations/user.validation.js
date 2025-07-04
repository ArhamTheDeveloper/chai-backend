import { ApiError } from "../utils/ApiError.js";

function validateRegisterInput(req, res, next) {
  const { name, email, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Validate name
  if (!name || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Name must be at least 3 characters long.",
    });
  }

  // Validate email with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format." });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long.",
    });
  }

  // All good
  next();
}

export { validateRegisterInput };
