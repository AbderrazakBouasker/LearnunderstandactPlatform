import Feedback from "../models/Feedback.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";
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

// Get general cluster statistics for an organization
export const getClusterStatsByOrganization = async (req, res) => {
  try {
    const { organization } = req.params;

    if (!organization) {
      return res
        .status(400)
        .json({ error: "Organization parameter is required" });
    }

    // Get all cluster analyses for the organization
    const clusterAnalyses = await ClusterAnalysis.find({ organization });

    if (clusterAnalyses.length === 0) {
      return res.status(200).json({
        organization,
        totalClusters: 0,
        formsWithClusters: 0,
        clustersWithTickets: 0,
        highImpactClusters: 0,
        urgentClusters: 0,
        averageSentimentPercentage: 0,
        averageClusterSize: 0,
      });
    }

    // Calculate general statistics
    const totalClusters = clusterAnalyses.length;
    const formsWithClusters = new Set(
      clusterAnalyses.map((analysis) => analysis.formId.toString())
    ).size;
    const clustersWithTickets = clusterAnalyses.filter(
      (analysis) => analysis.ticketCreated
    ).length;
    const highImpactClusters = clusterAnalyses.filter(
      (analysis) => analysis.impact === "high"
    ).length;
    const urgentClusters = clusterAnalyses.filter(
      (analysis) => analysis.urgency === "immediate"
    ).length;

    // Calculate average sentiment percentage
    const totalSentiment = clusterAnalyses.reduce(
      (sum, analysis) => sum + (analysis.sentimentPercentage || 0),
      0
    );
    const averageSentimentPercentage = totalSentiment / totalClusters;

    // Calculate average cluster size
    const totalClusterSize = clusterAnalyses.reduce(
      (sum, analysis) => sum + (analysis.clusterSize || 0),
      0
    );
    const averageClusterSize = totalClusterSize / totalClusters;

    // Group by impact and urgency for detailed breakdown
    const impactBreakdown = {
      high: clusterAnalyses.filter((analysis) => analysis.impact === "high")
        .length,
      medium: clusterAnalyses.filter((analysis) => analysis.impact === "medium")
        .length,
      low: clusterAnalyses.filter((analysis) => analysis.impact === "low")
        .length,
    };

    const urgencyBreakdown = {
      immediate: clusterAnalyses.filter(
        (analysis) => analysis.urgency === "immediate"
      ).length,
      soon: clusterAnalyses.filter((analysis) => analysis.urgency === "soon")
        .length,
      later: clusterAnalyses.filter((analysis) => analysis.urgency === "later")
        .length,
    };

    // Recent cluster creation trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentClusters = clusterAnalyses.filter(
      (analysis) => analysis.createdAt >= thirtyDaysAgo
    ).length;

    res.status(200).json({
      organization,
      totalClusters,
      formsWithClusters,
      clustersWithTickets,
      highImpactClusters,
      urgentClusters,
      averageSentimentPercentage:
        Math.round(averageSentimentPercentage * 100) / 100,
      averageClusterSize: Math.round(averageClusterSize * 100) / 100,
      impactBreakdown,
      urgencyBreakdown,
      recentClusters,
    });
  } catch (error) {
    console.error("Error in getClusterStatsByOrganization:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get cluster sentiment tracking by form over time
export const getClusterSentimentByForm = async (req, res) => {
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

    console.log(
      "Cluster sentiment query criteria:",
      JSON.stringify(matchCriteria)
    );

    // Get cluster sentiment data over time
    const sentimentData = await ClusterAnalysis.aggregate([
      {
        $match: matchCriteria,
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          averageSentiment: { $avg: "$sentimentPercentage" },
          totalClusters: { $sum: 1 },
          highImpactClusters: {
            $sum: {
              $cond: [{ $eq: ["$impact", "high"] }, 1, 0],
            },
          },
          urgentClusters: {
            $sum: {
              $cond: [{ $eq: ["$urgency", "immediate"] }, 1, 0],
            },
          },
          clustersWithTickets: {
            $sum: {
              $cond: ["$ticketCreated", 1, 0],
            },
          },
          totalClusterSize: { $sum: "$clusterSize" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          averageSentiment: { $round: ["$averageSentiment", 2] },
          totalClusters: 1,
          highImpactClusters: 1,
          urgentClusters: 1,
          clustersWithTickets: 1,
          averageClusterSize: {
            $round: [{ $divide: ["$totalClusterSize", "$totalClusters"] }, 2],
          },
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    // Get form title for context
    let formData = await Feedback.findOne(
      { formId: formIdQuery },
      { formTitle: 1 }
    );
    if (!formData) {
      formData = await Feedback.findOne({ formId }, { formTitle: 1 });
    }

    const formTitle = formData ? formData.formTitle : "Unknown Form";

    // Calculate overall statistics for the period
    const overallStats = await ClusterAnalysis.aggregate([
      {
        $match: matchCriteria,
      },
      {
        $group: {
          _id: null,
          totalClusters: { $sum: 1 },
          averageSentiment: { $avg: "$sentimentPercentage" },
          highImpactClusters: {
            $sum: {
              $cond: [{ $eq: ["$impact", "high"] }, 1, 0],
            },
          },
          urgentClusters: {
            $sum: {
              $cond: [{ $eq: ["$urgency", "immediate"] }, 1, 0],
            },
          },
          clustersWithTickets: {
            $sum: {
              $cond: ["$ticketCreated", 1, 0],
            },
          },
          averageClusterSize: { $avg: "$clusterSize" },
        },
      },
      {
        $project: {
          _id: 0,
          totalClusters: 1,
          averageSentiment: { $round: ["$averageSentiment", 2] },
          highImpactClusters: 1,
          urgentClusters: 1,
          clustersWithTickets: 1,
          averageClusterSize: { $round: ["$averageClusterSize", 2] },
        },
      },
    ]);

    console.log(
      `Found ${sentimentData.length} sentiment data points for form ${formId}`
    );

    res.status(200).json({
      formId,
      formTitle,
      dateRange: {
        startDate,
        endDate,
      },
      overallStats: overallStats[0] || {
        totalClusters: 0,
        averageSentiment: 0,
        highImpactClusters: 0,
        urgentClusters: 0,
        clustersWithTickets: 0,
        averageClusterSize: 0,
      },
      sentimentTrend: sentimentData,
    });
  } catch (error) {
    console.error("Error in getClusterSentimentByForm:", error);
    res.status(500).json({ error: error.message });
  }
};
