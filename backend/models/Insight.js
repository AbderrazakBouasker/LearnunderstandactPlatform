import mongoose from "mongoose";

const insightSchema = mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    organization: {
      type: String,
      required: true,
    },
    formTitle: {
      type: String,
      required: true,
    },
    formDescription: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      enum: [
        "very dissatisfied",
        "dissatisfied",
        "neutral",
        "satisfied",
        "very satisfied",
      ],
      required: true,
    },
    feedbackDescription: {
      type: String,
      required: true,
    },
    keywords: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);
const Insight = mongoose.model("Insight", insightSchema);
export default Insight;
