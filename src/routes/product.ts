import { Router } from "express";
import {
  createProductHandler,
  createProductJsonHandler,
} from "@/controllers/product.controller";
import { productImageUpload } from "@/middleware/upload";

const productRouter = Router();

/** JSON body with image URLs — use this in Postman (Body → raw → JSON) */
productRouter.post("/json", createProductJsonHandler);

/** Multipart form-data with image files (field name: images) */
productRouter.post(
  "/",
  productImageUpload.array("images", 10),
  createProductHandler
);

export default productRouter;
