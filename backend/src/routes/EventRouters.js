import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getActiveEvents,
  updateEventStatus
} from '../controllers/EventController.js';
import { auth } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/authorize.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveEvents);
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes (Admin only)
router.use(auth);
router.use(authorizeRoles('admin'));

router.post('/', createEvent);
router.put('/:id', updateEvent);
router.put('/:id/status', updateEventStatus);
router.delete('/:id', deleteEvent);

export default router;
