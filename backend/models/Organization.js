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
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "user"],
          default: "user",
        },
      },
    ],
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
