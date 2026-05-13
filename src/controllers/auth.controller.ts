import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import prisma from "../config/prisma";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens";
import {
  getBearerToken,
  getUserInfo,
  validateAuthToken,
} from "@/utils/user";

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


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User does not exist with this email.",
      });

      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid password.",
      });

      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers["user-agent"] as string | undefined,
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = getBearerToken(req.headers);

    if (!refreshToken || !(await validateAuthToken(req.headers))) {
      res.status(401).json({
        success: false,
        message: "Invalid or missing refresh token",
      });
      return;
    }

    const parsed = getUserInfo(refreshToken);
    if (!parsed) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    await prisma.session.deleteMany({
      where: {
        refreshToken,
        userId: parsed.user.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};