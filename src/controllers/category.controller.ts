import { Request, Response } from "express";
import {
  createCategory,
  listCategories,
  parseCreateCategoryBody,
} from "@/services/category";
import { sendCategoryError } from "@/utils/apiErrors";

export const listCategoriesHandler = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await listCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createCategoryHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const input = parseCreateCategoryBody(req.body);
    const category = await createCategory(input);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    sendCategoryError(res, error);
  }
};
