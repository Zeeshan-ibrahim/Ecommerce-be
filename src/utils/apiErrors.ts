import { Response } from "express";

const DEFAULT_BAD_REQUEST_KEYWORDS = ["required", "integer", "images"];

export function isBadRequestMessage(
  message: string,
  extraKeywords: string[] = []
): boolean {
  if (message.startsWith("Duplicate")) {
    return true;
  }
  return [...DEFAULT_BAD_REQUEST_KEYWORDS, ...extraKeywords].some((keyword) =>
    message.includes(keyword)
  );
}

type HandleControllerErrorOptions = {
    notFoundMessages?: string[];
    badRequestKeywords?: string[];
  };
  export function handleControllerError(
    res: Response,
    error: unknown,
    options: HandleControllerErrorOptions = {}
  ): void {
    console.error(error);
    const { notFoundMessages = [], badRequestKeywords = [] } = options;
  if (error instanceof Error) {
    if (notFoundMessages.includes(error.message)) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (isBadRequestMessage(error.message, badRequestKeywords)) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
  }
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export function sendProductError(res: Response, error: unknown): void {
    handleControllerError(res, error, {
      notFoundMessages: ["Category not found"],
    });
  }
  export function sendCategoryError(res: Response, error: unknown): void {
    handleControllerError(res, error, {
      badRequestKeywords: ["slug"],
    });
  }
  