import dotenv from "dotenv"
dotenv.config();
import mongoose from "mongoose";
import bodyParser from "body-parser";
import express, { Express } from "express";
import usersRoute from "./routes/usersRoute";
import postsRoute from "./routes/postsRoute";
import commentsRoute from "./routes/commentsRoute";
import authRoutes from "./routes/authRoute";
import likesRoutes from "./routes/likedObjectRoute";
import fileRoute from "./routes/fileRoute";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import askGPT from './openai';
import cors from "cors";


const app: Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173', // Your React app's URL
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
  });

app.use("/posts", postsRoute);
app.use("/comments", commentsRoute);
app.use("/auth", authRoutes);
app.use("/storage", fileRoute);
app.use("/users", usersRoute);
app.use("/likes", likesRoutes);
app.use("/api/askGPT", askGPT);

app.use("/storage", express.static("storage"));
app.use(express.static("front"));


const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Web Dev 2025 REST API",
        version: "1.0.0",
        description: "REST server including authentication using JWT",
      },
      servers: [{ url: "http://localhost:3000", },],
    },
    apis: ["./src/routes/*.ts"],
  };
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));


const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));


const initApp = () => {
    return new Promise<Express>((resolve, reject) => {
      if (!process.env.DB_CONNECT) {
        reject("DB_CONNECT is not defined in .env file");
      } else {
        mongoose
          .connect(process.env.DB_CONNECT)
          .then(() => {
            resolve(app);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  };

  export default initApp;