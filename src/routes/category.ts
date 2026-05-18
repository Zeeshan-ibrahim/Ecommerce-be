import { Router } from "express";
import {
  createCategoryHandler,
  listCategoriesHandler,
} from "@/controllers/category.controller";

const categoryRouter = Router();

categoryRouter.get("/", listCategoriesHandler);
categoryRouter.post("/", createCategoryHandler);

export default categoryRouter;
