import { Router } from 'express';
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from '../controllers/note.controllers.js';
import {
  validateProjectPermission,
  verifyJWT,
} from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { noteContentValidator } from '../validators/index.js';
import { AvailableUserRole, UserRolesEnum } from '../utils/constant.js';

const router = Router();
router.use(verifyJWT);

router
  .route('/:projectId')
  .get(validateProjectPermission(AvailableUserRole), getNotes)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    noteContentValidator(),
    validate,
    createNote
  );

router
  .route('/:projectId/n/:noteId')
  .get(validateProjectPermission(AvailableUserRole), getNoteById)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    noteContentValidator(),
    validate,
    updateNote
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteNote);

export default router;
