import mongoose from "mongoose";

const feedbackSchema = mongoose.Schema(
    {
        formId: {
        type: mongoose.Schema.Types.ObjectId,
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
        opinion: {
        type: String,
        required: true,
        },
        fields: [
          {
            label: {
              type: String,
              required: true,
            },
            value: {
              type: mongoose.Schema.Types.Mixed,
              required: true,
            }
          }
        ]
    },
    { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;