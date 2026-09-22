import { Router } from 'express';
import {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
} from '../controllers/task.contollers.js';
import {
  verifyJWT,
  validateProjectPermission,
} from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { AvailableUserRole, UserRolesEnum } from '../utils/constant.js';

const router = Router();
const taskManagers = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];

router.use(verifyJWT);

router
  .route('/:projectId')
  .get(validateProjectPermission(AvailableUserRole), getTasks)
  .post(
    validateProjectPermission(taskManagers),
    upload.array('attachments', 5),
    createTask
  );

router
  .route('/:projectId/t/:taskId')
  .get(validateProjectPermission(AvailableUserRole), getTaskById)
  .put(
    validateProjectPermission(taskManagers),
    upload.array('attachments', 5),
    updateTask
  )
  .delete(validateProjectPermission(taskManagers), deleteTask);

router
  .route('/:projectId/t/:taskId/subtasks')
  .post(validateProjectPermission(taskManagers), createSubTask);

router
  .route('/:projectId/st/:subTaskId')
  .put(validateProjectPermission(AvailableUserRole), updateSubTask)
  .delete(validateProjectPermission(taskManagers), deleteSubTask);

export default router;
