import mongoose from "mongoose";
const uri = process.env.mongoo_url || "mongodb://localhost:27017/chat-app--";
const dbName = process.env.MONGO_DB_NAME || "chat-app--";

let chached = global.mongoose || { conn: null, promise: null };
const connectDB = async () => {
    if (chached.conn) {
        return chached.conn;
    }
    if (!chached.promise) {
        chached.promise = mongoose.connect(uri, {
            dbName,
        }).then((mongooseInstance) => {
            console.log("connected to db");
            return mongooseInstance;
        });
    }
    chached.conn = await chached.promise;
    global.mongoose = chached;
    return chached.conn;
};
export default connectDB;
