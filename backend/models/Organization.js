import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      min: 1,
      max: 50,
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["Free", "Pro", "Enterprise"],
      default: "Free",
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "subadmin", "user"],
          default: "user",
        },
      },
    ],
    domains: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
