import mongoose from "mongoose";
import { type } from "os";

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
    recommendationThreshold: {
      type: Number,
      default: 0.5, // Default threshold for AI recommendations
      min: 0,
      max: 1,
    },
    ticketCreationDelay: {
      type: Number,
      default: 7, // Default delay in days before creating a ticket for insights
      min: 1,
      max: 365, // Maximum delay of 365 days
    },
    notificationThreshold: {
      type: Number,
      default: 0.7, // Default threshold for sending notifications
      min: 0,
      max: 1, // Percentage threshold for notifications
    },
    // Jira Integration Configuration
    jiraConfig: {
      host: {
        type: String,
        required: false,
      },
      username: {
        type: String,
        required: false,
      },
      apiToken: {
        type: String,
        required: false,
      },
      projectKey: {
        type: String,
        required: false,
      },
      issueType: {
        type: String,
        default: "Task",
        required: false,
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
