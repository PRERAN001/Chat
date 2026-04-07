import mongoose from "mongoose";
const uri=process.env.mongoo_url
let chached=global.mongoose||{ conn: null, promise: null }
const connectDB = async () => {
    if (chached.conn) {
        return chached.conn;
    }
    if (!chached.promise) {
        chached.promise = mongoose.connect("mongodb://localhost:27017", {
            dbName: "chat-app--",
        }).then((mongoose) => {
            console.log("connected to db")
            return mongoose;
        });
    }
    chached.conn = await chached.promise;
    global.mongoose = chached;    
};
export default connectDB;