import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
    idd:{
        type: String,
        required: true,
    },
    profilepic: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export default UserModel;