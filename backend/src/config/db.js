import mongoose from "mongoose";

export const connectDB = async (mongoURL) => {
    try {
        await mongoose.connect(mongoURL);
        console.log("URL: " + mongoURL+ "\nĐã kết nối đến database thành công"       );
    } catch (error) {
        console.log("Đéo link được db");
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
}