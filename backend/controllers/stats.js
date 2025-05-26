import Feedback from "../models/Feedback.js";

// Get feedback count over time for an organization or form
export const getFeedbackCountOverTime = async (req, res) => {
  try {
    const { organization, formId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    const matchCriteria = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (organization) {
      matchCriteria.organization = organization;
    }

    if (formId) {
      matchCriteria.formId = formId;
    }

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

// Get the count of opinions grouped by form for an organization
export const getOpinionCountsByForm = async (req, res) => {
  try {
    const { organization } = req.params;

    const opinionCounts = await Feedback.aggregate([
      {
        $match: { organization },
      },
      {
        $group: {
          _id: {
            formId: "$formId",
            opinion: "$opinion",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.formId",
          opinions: {
            $push: {
              opinion: "$_id.opinion",
              count: "$count",
            },
          },
        },
      },
      {
        $lookup: {
          from: "forms",
          localField: "_id",
          foreignField: "_id",
          as: "formDetails",
        },
      },
      {
        $unwind: "$formDetails",
      },
      {
        $project: {
          _id: 0,
          formId: "$_id",
          formTitle: "$formDetails.title",
          opinions: 1,
        },
      },
      {
        $sort: { formTitle: 1 },
      },
    ]);

    res.status(200).json(opinionCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
