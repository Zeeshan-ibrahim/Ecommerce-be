import { Router } from 'express';
import { createWaitlistEntry } from '@/services/waitlist';
const waitlistRouter = Router();

waitlistRouter.post('/', async (req, res, next) => {
    try {
        const {name,email} = req.body;
        const result = await createWaitlistEntry(email,name);

        res.json({
          message: "created",
          data: result
        });
    } catch (error) {
        next(error);
    }
});

export default waitlistRouter;