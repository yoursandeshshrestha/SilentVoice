// config/database.ts
import mongoose from "mongoose";

type Environment = "development" | "production" | "test";

interface DBConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

const getDBConfig = (): DBConfig => {
  // Get environment variables
  const nodeEnv = (process.env.NODE_ENV || "development") as Environment;
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/silentvoice_dev";

  const commonOptions: mongoose.ConnectOptions = {
    retryWrites: true,
    family: 4,
  };

  const configs: Record<Environment, mongoose.ConnectOptions> = {
    development: {
      ...commonOptions,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
    production: {
      ...commonOptions,
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      ssl: process.env.MONGODB_SSL === "true",
    },
    test: {
      ...commonOptions,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 30000,
    },
  };

  return {
    uri: mongoUri,
    options: configs[nodeEnv],
  };
};

const connectDB = async (): Promise<void> => {
  try {
    const config = getDBConfig();
    const nodeEnv = process.env.NODE_ENV || "development";

    // Enable debugging in development
    mongoose.set("debug", nodeEnv === "development");

    // Connect to MongoDB
    await mongoose.connect(config.uri, config.options);
    console.log(`🚀 Connected to ${nodeEnv} database successfully`);

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error(`MongoDB connection error in ${nodeEnv}:`, error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(
        `MongoDB disconnected in ${nodeEnv}. Attempting to reconnect...`
      );
    });

    mongoose.connection.on("reconnected", () => {
      console.log(`MongoDB reconnected in ${nodeEnv}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log(
          `MongoDB connection closed in ${nodeEnv} through app termination`
        );
        process.exit(0);
      } catch (error) {
        console.error(
          `Error while closing MongoDB connection in ${nodeEnv}:`,
          error
        );
        process.exit(1);
      }
    });
  } catch (error) {
    console.error(
      `Error connecting to MongoDB in ${process.env.NODE_ENV}:`,
      error
    );
    throw error;
  }
};

const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log(`Database connection closed in ${process.env.NODE_ENV}`);
  } catch (error) {
    console.error(
      `Error while disconnecting from database in ${process.env.NODE_ENV}:`,
      error
    );
    throw error;
  }
};

const getConnectionStatus = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export { connectDB, disconnectDB, getConnectionStatus };
