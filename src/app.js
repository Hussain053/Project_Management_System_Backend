import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app = express();
import healthcheckRouter from './routes/healthcheck.routes.js';
import authRouter from './routes/auth.routes.js';
import projectRouter from './routes/project.routes.js';
import taskRouter from './routes/task.routes.js';
import noteRouter from './routes/note.routes.js';

// basic configurations
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// cors configurations
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/notes', noteRouter);
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/instagram', (req, res) => {
  res.send('Hello World! from instagram but from app.js');
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    statusCode,
    data: err.data || null,
    message: err.message || 'Internal server error',
    success: false,
    errors: err.errors || [],
  });
});

export default app;
