import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
dotenv.config({
    path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

// Setup of Express Server

const port = process.env.PORT || 3000



// app.listen(port, () => {
//   console.log(`Server is listening on port ${port}`)
// })

// console.log("Hello Hussain");
// console.log(process.env.Name);
// console.log(process.env.API_KEY);

