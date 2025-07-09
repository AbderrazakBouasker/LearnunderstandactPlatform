import mongoose from "mongoose";

const clusterAnalysisSchema = mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Form",
    },
    organization: {
      type: String,
      required: true,
    },
    clusterLabel: {
      type: String,
      required: true,
    },
    clusterSummary: {
      type: String,
      required: true,
    },
    insightIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Insight",
      },
    ],
    sentimentPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    clusterSize: {
      type: Number,
      required: true,
    },
    recommendation: {
      type: String,
      required: false,
    },
    impact: {
      type: String,
      enum: ["high", "medium", "low"],
      required: false,
    },
    urgency: {
      type: String,
      enum: ["immediate", "soon", "later"],
      required: false,
    },
    ticketCreated: {
      type: Boolean,
      default: false,
    },
    lastTicketDate: {
      type: Date,
      required: false,
    },
    // Jira ticket information
    jiraTicketId: {
      type: String,
      required: false,
    },
    jiraTicketUrl: {
      type: String,
      required: false,
    },
    jiraTicketStatus: {
      type: String,
      required: false,
    },
    // Email notification tracking
    emailNotificationSent: {
      type: Boolean,
      default: false,
    },
    emailNotificationDate: {
      type: Date,
      required: false,
    },
    embeddings: {
      type: [Number],
      required: false, // We'll add this when we get transformers working
    },
  },
  { timestamps: true }
);

// Index for efficient querying
clusterAnalysisSchema.index({ formId: 1, createdAt: -1 });
clusterAnalysisSchema.index({ organization: 1, createdAt: -1 });

const ClusterAnalysis = mongoose.model(
  "ClusterAnalysis",
  clusterAnalysisSchema
);

export default ClusterAnalysis;
