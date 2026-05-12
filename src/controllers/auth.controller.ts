import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import prisma from "../config/prisma";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });

      return;
    }

    // Existing user
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    let errors: string = "";

    if (
      existingUsers.some((u) => u.email === email) &&
      existingUsers.some((u) => u.phone === phone)
    ) {
      errors = "Email and phone number already exist";
    } else if (existingUsers.some((u) => u.email === email)) {
      errors = "Email already exists";
    } else if (phone && existingUsers.some((u) => u.phone === phone)) {
      errors = "Phone number already exists";
    }

    if (Object.keys(errors).length > 0) {
      res.status(409).json({
        success: false,
        errors,
      });

      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
      },
    });

    // Response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Generate tokens
// const accessToken = generateAccessToken(user);
// const refreshToken = generateRefreshToken(user);

// Save session
// await prisma.session.create({
//   data: {
//     userId: user.id,
//     refreshToken,
//     userAgent: req.headers["user-agent"],
//     ipAddress: req.ip,
//     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//   },
// });

//   data: {
//     user: {
//       name: user.name,
//       email: user.email,
//     },

//     accessToken,
//     refreshToken,
//   },
