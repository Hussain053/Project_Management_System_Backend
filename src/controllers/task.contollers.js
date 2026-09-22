import mongoose from 'mongoose';
import { Project } from '../models/project.model.js';
import { ProjectMember } from '../models/projectmember.model.js';
import { Task } from '../models/task.model.js';
import { Subtask } from '../models/subtasks.model.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AvailableTaskStatues, UserRolesEnum } from '../utils/constant.js';

const ensureObjectId = (id, name) => {
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, `${name} is invalid`);
};

const getProjectTask = async (projectId, taskId) => {
  ensureObjectId(projectId, 'Project id');
  ensureObjectId(taskId, 'Task id');
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
};

const validateAssignee = async (projectId, assignedTo) => {
  if (assignedTo === undefined || assignedTo === null || assignedTo === '')
    return undefined;
  ensureObjectId(assignedTo, 'Assignee id');
  if (!(await ProjectMember.exists({ project: projectId, user: assignedTo }))) {
    throw new ApiError(400, 'Assignee must be a project member');
  }
  return assignedTo;
};

const attachmentMetadata = (files = []) =>
  files.map((file) => ({
    url: `${process.env.SERVER_URL || ''}/images/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  ensureObjectId(projectId, 'Project id');
  if (!(await Project.exists({ _id: projectId })))
    throw new ApiError(404, 'Project not found');
  const tasks = await Task.find({ project: projectId })
    .populate('assignedTo', 'avatar username fullName')
    .populate('assignedBy', 'avatar username fullName')
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;
  ensureObjectId(projectId, 'Project id');
  if (!title?.trim()) throw new ApiError(400, 'Title is required');
  if (status !== undefined && !AvailableTaskStatues.includes(status))
    throw new ApiError(400, 'Invalid task status');
  if (!(await Project.exists({ _id: projectId })))
    throw new ApiError(404, 'Project not found');
  const assignee = await validateAssignee(projectId, assignedTo);
  const task = await Task.create({
    title: title.trim(),
    description,
    project: projectId,
    assignedTo: assignee,
    assignedBy: req.user._id,
    status,
    attachments: attachmentMetadata(req.files),
  });
  return res
    .status(201)
    .json(new ApiResponse(201, task, 'Task created successfully'));
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await getProjectTask(req.params.projectId, req.params.taskId);
  const [taskWithPeople, subtasks] = await Promise.all([
    Task.findById(task._id)
      .populate('assignedTo', 'avatar username fullName')
      .populate('assignedBy', 'avatar username fullName'),
    Subtask.find({ task: task._id })
      .populate('createdBy', 'avatar username fullName')
      .sort({ createdAt: 1 }),
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...taskWithPeople.toObject(), subtasks },
        'Task fetched successfully'
      )
    );
});

const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const task = await getProjectTask(projectId, taskId);
  const { title, description, assignedTo, status } = req.body;
  const updates = {};
  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, 'Title cannot be empty');
    updates.title = title.trim();
  }
  if (description !== undefined) updates.description = description;
  if (status !== undefined) {
    if (!AvailableTaskStatues.includes(status))
      throw new ApiError(400, 'Invalid task status');
    updates.status = status;
  }
  if (assignedTo !== undefined)
    updates.assignedTo = await validateAssignee(projectId, assignedTo);
  const attachments = attachmentMetadata(req.files);
  if (attachments.length)
    updates.$push = { attachments: { $each: attachments } };
  if (!Object.keys(updates).length)
    throw new ApiError(400, 'No task fields to update');
  const updatedTask = await Task.findByIdAndUpdate(task._id, updates, {
    new: true,
    runValidators: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, 'Task updated successfully'));
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await getProjectTask(req.params.projectId, req.params.taskId);
  await Promise.all([
    Subtask.deleteMany({ task: task._id }),
    Task.deleteOne({ _id: task._id }),
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, task, 'Task deleted successfully'));
});

const createSubTask = asyncHandler(async (req, res) => {
  const task = await getProjectTask(req.params.projectId, req.params.taskId);
  const { title, isCompleted } = req.body;
  if (!title?.trim()) throw new ApiError(400, 'Subtask title is required');
  const completed =
    isCompleted === undefined ? false : parseBoolean(isCompleted);
  if (completed === undefined)
    throw new ApiError(400, 'isCompleted must be a boolean');
  const subtask = await Subtask.create({
    title: title.trim(),
    task: task._id,
    isCompleted: completed,
    createdBy: req.user._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, subtask, 'Subtask created successfully'));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  ensureObjectId(projectId, 'Project id');
  ensureObjectId(subTaskId, 'Subtask id');
  const subtask = await Subtask.findById(subTaskId).populate('task');
  if (
    !subtask ||
    !subtask.task ||
    subtask.task.project.toString() !== projectId
  )
    throw new ApiError(404, 'Subtask not found');
  const { title, isCompleted } = req.body;
  if (req.user.role === UserRolesEnum.MEMBER && title !== undefined)
    throw new ApiError(
      403,
      'Members can only update subtask completion status'
    );
  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, 'Subtask title cannot be empty');
    subtask.title = title.trim();
  }
  if (isCompleted !== undefined) {
    const completed = parseBoolean(isCompleted);
    if (completed === undefined)
      throw new ApiError(400, 'isCompleted must be a boolean');
    subtask.isCompleted = completed;
  }
  if (title === undefined && isCompleted === undefined)
    throw new ApiError(400, 'No subtask fields to update');
  await subtask.save();
  return res
    .status(200)
    .json(new ApiResponse(200, subtask, 'Subtask updated successfully'));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  ensureObjectId(projectId, 'Project id');
  ensureObjectId(subTaskId, 'Subtask id');
  const subtask = await Subtask.findById(subTaskId).populate('task');
  if (
    !subtask ||
    !subtask.task ||
    subtask.task.project.toString() !== projectId
  )
    throw new ApiError(404, 'Subtask not found');
  await subtask.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, subtask, 'Subtask deleted successfully'));
});

export {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  createSubTask,
  updateSubTask,
  deleteSubTask,
};
