import Feedback from "../models/Feedback.js";
import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

// Get feedback count over time for an organization
export const getFeedbackCountOverTimeByOrg = async (req, res) => {
  try {
    const { organization } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const matchCriteria = {
      organization,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const feedbackCounts = await Feedback.aggregate([
      {
        $match: matchCriteria,
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json(feedbackCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get feedback count over time for a specific form
export const getFeedbackCountOverTimeByForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    // Check if formId is a valid ObjectId
    let formIdQuery;
    try {
      formIdQuery = new ObjectId(formId);
    } catch (err) {
      formIdQuery = formId; // Fallback to string if not valid ObjectId
    }

    const matchCriteria = {
      formId: formIdQuery,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    console.log("Query criteria:", JSON.stringify(matchCriteria));

    const feedbackCounts = await Feedback.aggregate([
      {
        $match: matchCriteria,
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log(
      `Found ${feedbackCounts.length} feedback entries for form ${formId}`
    );
    res.status(200).json(feedbackCounts);
  } catch (error) {
    console.error("Error in getFeedbackCountOverTimeByForm:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get total feedback count grouped by form for an organization
export const getTotalFeedbackByForm = async (req, res) => {
  try {
    const { organization } = req.params;

    const feedbackCounts = await Feedback.aggregate([
      {
        $match: { organization },
      },
      {
        $group: {
          _id: "$formId",
          formTitle: { $first: "$formTitle" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json(feedbackCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get the count of opinions for a specific form
export const getOpinionCountsByForm = async (req, res) => {
  try {
    const { formId } = req.params;

    // Check if formId is a valid ObjectId
    let formIdQuery;
    try {
      formIdQuery = new ObjectId(formId);
    } catch (err) {
      formIdQuery = formId; // Fallback to string if not valid ObjectId
    }

    console.log(`Querying opinions for form: ${formId}`);

    const opinionCounts = await Feedback.aggregate([
      {
        $match: { formId: formIdQuery },
      },
      {
        $group: {
          _id: "$opinion",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          opinion: "$_id",
          count: 1,
        },
      },
      {
        $sort: { opinion: 1 },
      },
    ]);

    // If empty, let's run a diagnostic query
    if (opinionCounts.length === 0) {
      const feedbackCount = await Feedback.countDocuments({
        formId: formIdQuery,
      });
      console.log(`Total feedback for form ${formId}: ${feedbackCount}`);

      // Check if any feedbacks exist with this formId string
      const feedbackCountStr = await Feedback.countDocuments({ formId });
      console.log(
        `Total feedback with string formId ${formId}: ${feedbackCountStr}`
      );

      // Sample some feedback to examine the schema
      const sampleFeedback = await Feedback.findOne({}).lean();
      console.log(
        "Sample feedback schema:",
        sampleFeedback ? Object.keys(sampleFeedback) : "No feedback found"
      );
    }

    // Get form title for context - try both ObjectId and string versions
    let formData = await Feedback.findOne(
      { formId: formIdQuery },
      { formTitle: 1 }
    );
    if (!formData) {
      formData = await Feedback.findOne({ formId }, { formTitle: 1 });
    }

    const formTitle = formData ? formData.formTitle : "Unknown Form";

    res.status(200).json({
      formId,
      formTitle,
      opinionCounts,
    });
  } catch (error) {
    console.error("Error in getOpinionCountsByForm:", error);
    res.status(500).json({ error: error.message });
  }
};
