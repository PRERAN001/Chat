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
    bio: {
        type: String,
        default: ""
    },
    githubLogin: {
        type: String,
        default: ""
    },
    githubId: {
        type: String,
        default: ""
    },
    githubProfileUrl: {
        type: String,
        default: ""
    },
    company: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    blog: {
        type: String,
        default: ""
    },
    twitterUsername: {
        type: String,
        default: ""
    },
    followers: {
        type: Number,
        default: 0
    },
    following: {
        type: Number,
        default: 0
    },
    publicRepos: {
        type: Number,
        default: 0
    },
    publicGists: {
        type: Number,
        default: 0
    },
    
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export default UserModel;