import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, "Label is required"],
  },
  type: {
    type: String,
    enum: [
      "text",
      "number",
      "tel",
      "date",
      "time",
      "email",
      "textarea",
      "file",
      "checkbox",
      "radio",
      "color",
    ],
    required: [true, "Type is required"],
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
});

const formSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    opinion: {
      type: [String],
      required: true,
      default: [
        "very dissatisfied",
        "dissatisfied",
        "neutral",
        "satisfied",
        "very satisfied",
      ],
    },
    fields: [fieldSchema],
    organization: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);

export default Form;
