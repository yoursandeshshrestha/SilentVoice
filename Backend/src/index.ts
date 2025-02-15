import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/Database";

dotenv.config();

const app = express();

const PORT: number = parseInt(process.env.PORT || "8000", 10);

const allowedOrigins: string[] = process.env.ORIGIN
  ? process.env.ORIGIN.split(",")
  : ["http://localhost:3000", "https://silentvoice.sandeshshrestha.tech"];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`got request with ${req.method} on ${req.url}`);
  next();
});

app.get("/", (req: Request, res: Response) => {
  try {
    res.status(200).json({
      message: "Welcome to SilentVoice!",
      status: "success",
      data: {
        apiVersion: "1.0",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in root route:", error);
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
      status: "error",
    });
  }
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();
