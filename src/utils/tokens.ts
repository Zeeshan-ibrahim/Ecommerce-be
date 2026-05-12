import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

export const generateAccessToken = (user: User) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: "15m",
    },
  );
};

export const generateRefreshToken = (user: User) => {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: "7d",
    },
  );
};
