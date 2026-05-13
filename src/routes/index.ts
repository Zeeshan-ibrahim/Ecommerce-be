import { Router } from 'express';
import waitlistRoutes from './waitlist';

const router = Router();


router.use('/api/waitlist', waitlistRoutes);

export default router;