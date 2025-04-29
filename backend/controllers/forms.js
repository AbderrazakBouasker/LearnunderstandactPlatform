import Form from "../models/Form.js";
import logger from "../logger.js";

//CREATE
export const createForm = async (req, res) => {
  try {
    const { title, description, opinion, fields, organization } = req.body;
    const newForm = new Form({
      title,
      description,
      fields,
      organization,
    });
    await newForm.save();
    res.status(201).json(newForm);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error creating form", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ
export const getForms = async (req, res) => {
  try {
    const form = await Form.find();
    if (form.length === 0) {
      return res.status(204).json();
    }
    res.status(200).json(form);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving forms", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ BY ORGANIZATION
export const getFormsByOrganization = async (req, res) => {
  try {
    const { organization } = req.params;
    const forms = await Form.find({ organization });
    if (forms.length === 0) {
      return res.status(204).json();
    }
    res.status(200).json(forms);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving forms by organization", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//READ BY ID
export const getForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.status(200).json(form);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error retrieving form by ID", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

//UPDATE
export const editForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, opinion, fields } = req.body;
    const form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    // if (opinion !== undefined) form.opinion = opinion;
    form.fields = fields;

    await form.save();
    res.status(200).json(form);
  } catch (error) {
    // Log the error with additional context
    logger.error("Error updating form", {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ error: error.message });
  }
};

//DELETE
export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedForm = await Form.findByIdAndDelete(id);
    if (!deletedForm) {
      return res.status(404).json({ error: "Form not found" });
    }
    res.status(200).json({ deletedForm });
  } catch (error) {
    // Log the error with additional context
    logger.error("Error deleting form", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
