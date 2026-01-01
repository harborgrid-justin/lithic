/**
 * Express Server - Patient Management API
 * Lithic Healthcare Platform
 */

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import patientsRouter from "./routes/patients";
import patientsSearchRouter from "./routes/patients.search";
import patientsMergeRouter from "./routes/patients.merge";
import patientsDocumentsRouter from "./routes/patients.documents";
import patientsInsuranceRouter from "./routes/patients.insurance";

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mock authentication middleware (replace with real auth in production)
app.use((req: Request, res: Response, next: NextFunction) => {
  req.user = {
    id: "user-123",
    name: "Test User",
    role: "doctor",
  };
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/patients", patientsRouter);
app.use("/api/patients/search", patientsSearchRouter);
app.use("/api/patients/merge", patientsMergeRouter);
app.use("/api/patients/documents", patientsDocumentsRouter);
app.use("/api/patients/insurance", patientsInsuranceRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Lithic Patient Management API running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API Base: http://localhost:${PORT}/api`);
});

export default app;
