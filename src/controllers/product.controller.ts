import { Request, Response } from "express";
import {
  createProduct,
  parseCreateProductBody,
  parseImageMeta,
  parseProductImagesFromBody,
  ProductImageInput,
} from "@/services/product";
import { sendProductError } from "@/utils/apiErrors";

export const createProductHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files?.length) {
      res.status(400).json({
        success: false,
        message: "At least one image file is required (field: images)",
      });
      return;
    }

    let input;
    try {
      input = parseCreateProductBody(req.body);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Invalid product data",
      });
      return;
    }

    let imageMeta;
    try {
      imageMeta = parseImageMeta(req.body.imageMeta);
    } catch {
      res.status(400).json({
        success: false,
        message: "imageMeta must be valid JSON array",
      });
      return;
    }

    const imageInputs: ProductImageInput[] = files.map((file, index) => ({
      buffer: file.buffer,
      alt: imageMeta[index]?.alt,
      sortOrder: imageMeta[index]?.sortOrder,
      isPrimary: imageMeta[index]?.isPrimary,
    }));

    await createProduct(input, imageInputs);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  } catch (error) {
    sendProductError(res, error);
  }
};

export const createProductJsonHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let input;
    let imageInputs: ProductImageInput[];

    try {
      input = parseCreateProductBody(req.body);
      imageInputs = parseProductImagesFromBody(req.body);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err instanceof Error ? err.message : "Invalid product data",
      });
      return;
    }

    const product = await createProduct(input, imageInputs);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    sendProductError(res, error);
  }
};
