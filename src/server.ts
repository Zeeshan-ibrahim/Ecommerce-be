import express from "express";
import router from "./routes";
import "dotenv/config";
import authRoutes from "./routes/auth";

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// middleware
app.use(express.json());

// routes
app.use("/", router);
app.use("/api/auth", authRoutes);

// start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default server;
