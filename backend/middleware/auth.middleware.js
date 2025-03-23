import { createClerkClient } from "@clerk/clerk-sdk-node";

export const protectRoute = async (req, res, next) => {
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  if (req.auth.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
