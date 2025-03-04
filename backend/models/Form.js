import mongoose from "mongoose";

const formSchema = mongoose.Schema(
  {
    title: String,
    description: {
      type: String,
      required: true,
    },
    opinion: {
      type: String,
      enum: ["unhappy", "neutral", "happy"],
      required: true,
    },
    picturePath: [
      {
        type: String,
      },
    ],
    fields: [
      {
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["text", "number", "date", "email", "textarea"],
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: false,
        },
      },
    ],
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);

export default Form;
