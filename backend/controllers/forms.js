import Form from "../models/Form.js";

//CREATE
export const createForm = async (req, res) => {
  try {
    const { title, description, opinion, picturePath, fields } = req.body;
    const newForm = new Form({
      title,
      description,
      opinion,
      picturePath,
      fields,
    });
    await newForm.save(); 
    const form = await Form.find();
    res.status(201).json(form);
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
};

//READ
export const getForms = async (req, res) => {
  try {
    const form = await Form.find();
    res.status(201).json(form);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

//READ BY ID
export const getForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findById( id );
    res.status(201).json(form);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

//UPDATE
export const editForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, opinion, picturePath, fields } = req.body;
    const form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    if (title !== undefined) 
      form.title = title;
    if (description !== undefined)
      form.description = description;
    if (opinion !== undefined)
      form.opinion = opinion;
    form.picturePath = picturePath;
    form.fields = fields;

    await form.save();
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//DELETE
export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedForm = await Form.findByIdAndDelete(id);
    res.status(201).json(deletedForm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
