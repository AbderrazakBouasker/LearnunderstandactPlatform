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
    email: {
      type: String,
    },
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
        validate: {
          validator: function (v) {
            // Allow empty values or valid hostnames
            if (!v) return true;
            // Clean the host for validation (remove protocol if present)
            const cleanHost = v.replace(/^https?:\/\//, "").replace(/\/$/, "");
            // Basic hostname validation
            return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanHost);
          },
          message:
            "Host should be a valid hostname (e.g., company.atlassian.net) without protocol",
        },
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
      supportsPriority: {
        type: Boolean,
        default: true,
        required: false,
      },
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
