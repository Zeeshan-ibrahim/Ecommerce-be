import { Router } from 'express';
import waitlistRoutes from './waitlist';
import productRoutes from './product';
import categoryRoutes from './category';
import authRoutes from "./auth";

const router = Router();

router.use("/api/auth", authRoutes);
router.use('/api/waitlist', waitlistRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/products', productRoutes);

export default router;