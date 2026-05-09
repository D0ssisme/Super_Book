// backend/src/server.js

import "dotenv/config";
import express from "express";
import userRoute from "./routes/UserRouters.js";
import bookRoute from "./routes/BookRouters.js";
import cartRoute from "./routes/CartRouters.js";
import { connectDB } from "./config/db.js";
import cors from "cors";
import { seedAdmin } from "./utils/seedAdmin.js";
import { cleanupCorruptedCarts } from "./utils/cleanupCarts.js";
import categoryRoute from "./routes/CategoryRouters.js";
import orderRoute from "./routes/OrderRouters.js";
import authRoute from "./routes/AuthRouters.js";
import authorRouter from "./routes/AuthorRouters.js";
import publisherRouter from "./routes/PublisherRouters.js";
import supplierRouter from "./routes/SupplierRouters.js";
import { setup } from "./utils/hosting.js";
import supplyReceiptRouter from "./routes/SupplyReceiptRouters.js";
import paymentRouter from "./routes/PaymentRouters.js";
import eventRouter from "./routes/EventRouters.js";
import { errorHandler } from "./middlewares/errorHandle.js";
import addressRouter from "./routes/AddressRouters.js";
import statisticsRouter from "./routes/StatisticsRouters.js";
import couponRouter from "./routes/CouponRouters.js";
import reviewRouter from "./routes/ReviewRouters.js";
import { seedDefaultCoupon } from "./utils/seedCoupon.js";
import { startAutoCancelOrders } from "./utils/autoCancelOrders.js";

const app = express();
connectDB(process.env.MONGODB_URL);
// setup(app) // TODO: Uncomment khi deploy production

// CORS - cho phép nhiều origin dev để tránh lỗi Network Error khi mở app qua localhost/ngrok
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(",") : []),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

const apiTag = process.env.API_TAG || "/api/v1";

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(apiTag + "/auth", authRoute);
app.use(apiTag + "/address", addressRouter);
app.use(apiTag + "/users", userRoute);
app.use(apiTag + "/books", bookRoute);
app.use(apiTag + "/cart", cartRoute);
app.use(apiTag + "/categories", categoryRoute);
app.use(apiTag + "/orders", orderRoute);
app.use(apiTag + "/authors", authorRouter);
app.use(apiTag + "/publishers", publisherRouter);
app.use(apiTag + "/suppliers", supplierRouter);
app.use(apiTag + "/supply-receipts", supplyReceiptRouter);
app.use(apiTag + "/payment", paymentRouter);
app.use(apiTag + "/events", eventRouter);
app.use(apiTag + "/statistics", statisticsRouter);
app.use(apiTag + "/coupons", couponRouter);
app.use(apiTag + "/reviews", reviewRouter);

const PORT = process.env.PORTBE || process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", async () => {
  console.log("Server is running on port " + PORT);
});
await cleanupCorruptedCarts().catch((err) =>
  console.warn("Cleanup warning:", err.message),
);
await seedAdmin();
await seedDefaultCoupon();
startAutoCancelOrders();

app.use(errorHandler);
