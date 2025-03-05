import Feedback from '../models/Feedback.js';
import Form from '../models/Form.js';

// Helper function to map HTML types to JavaScript types
const mapHtmlTypeToJsType = (htmlType) => {
  const typeMapping = {
    text: 'string',
    number: 'number',
    date: 'string', // Dates are typically handled as strings in JS
    email: 'string',
    textarea: 'string'
  };
  return typeMapping[htmlType] || 'string';
};

//CREATE
export const createFeedback = async (req, res) => {
  try {
    const formId = req.params.id;
    const { opinion, fields } = req.body;

    // Get the form schema by ID
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Verify the inputs against the form schema
    const formFields = form.fields;
    for (const field of formFields) {
      const inputField = fields.find(f => f.label === field.label);
      if (!inputField) {
        return res.status(400).json({ error: `Missing field: ${field.label}` });
      }
      const expectedType = mapHtmlTypeToJsType(field.type);
      if (typeof inputField.value !== expectedType) {
        return res.status(400).json({ error: `Invalid type for field: ${field.label}. Expected ${expectedType}, got ${typeof inputField.value}` });
      }
    }

    // Store the feedback
    const newFeedback = new Feedback({
      formId,
      formTitle: form.title,
      formDescription: form.description,
      opinion,
      fields
    });
    await newFeedback.save();
    res.status(201).json(newFeedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//READ
export const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

//READ BY ID
export const getFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await Feedback.findById(id);
        if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
        }
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    };

//READ BY FORM ID
export const getFeedbackByFormId = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await Feedback.find({ formId: id });
        if (feedback.length === 0) {
            return res.status(404).json({ error: "No feedbacks found for this form" });
        }
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//DELETE
export const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await Feedback.findByIdAndDelete(id);
        if (!feedback) {
            return res.status(404).json({ error: "Feedback not found" });
        }
        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};