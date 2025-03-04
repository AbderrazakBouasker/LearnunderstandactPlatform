import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // firstName: {
    //   type: String,
    //   required: true,
    //   min: 1,
    //   max: 50,
    // },
    // lastName: {
    //   type: String,
    //   required: true,
    //   min: 1,
    //   max: 50,
    // },
    email: {
      type: String,
      required: true,
      max: 20,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
    },
    role:{
      type: String,
      required: true,
      default: "admin",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
