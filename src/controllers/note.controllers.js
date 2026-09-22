import mongoose from 'mongoose';
import { Project } from '../models/project.model.js';
import { ProjectNote } from '../models/note.model.js';
import { ApiError } from '../utils/api-errors.js';
import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

const ensureObjectId = (id, name) => {
  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, `${name} is invalid`);
};

const ensureProject = async (projectId) => {
  ensureObjectId(projectId, 'Project id');
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await ensureProject(projectId);
  const notes = await ProjectNote.find({ project: projectId })
    .populate('createdBy', 'avatar username fullName')
    .sort({ updatedAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, notes, 'Notes fetched successfully'));
});

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  await ensureProject(projectId);
  const note = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content: content.trim(),
  });
  return res
    .status(201)
    .json(new ApiResponse(201, note, 'Note created successfully'));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  await ensureProject(projectId);
  ensureObjectId(noteId, 'Note id');
  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  }).populate('createdBy', 'avatar username fullName');
  if (!note) throw new ApiError(404, 'Note not found');
  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note fetched successfully'));
});

const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;
  await ensureProject(projectId);
  ensureObjectId(noteId, 'Note id');
  const note = await ProjectNote.findOneAndUpdate(
    { _id: noteId, project: projectId },
    { content: content.trim() },
    { new: true, runValidators: true }
  );
  if (!note) throw new ApiError(404, 'Note not found');
  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note updated successfully'));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  await ensureProject(projectId);
  ensureObjectId(noteId, 'Note id');
  const note = await ProjectNote.findOneAndDelete({
    _id: noteId,
    project: projectId,
  });
  if (!note) throw new ApiError(404, 'Note not found');
  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note deleted successfully'));
});

export { getNotes, createNote, getNoteById, updateNote, deleteNote };
