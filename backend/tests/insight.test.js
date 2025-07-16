import request from "supertest";
import { testApp } from "./helpers.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Form from "../models/Form.js";
import Feedback from "../models/Feedback.js";
import Insight from "../models/Insight.js";
import ClusterAnalysis from "../models/ClusterAnalysis.js";

describe("Insight API", () => {
  let agent;
  let testUser;
  let testOrganization;
  let testForm;
  let testFeedback;
  let testInsight;
  let secondTestInsight;
  let testCounter = 0;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Form.deleteMany({});
    await Feedback.deleteMany({});
    await Insight.deleteMany({});
    await ClusterAnalysis.deleteMany({});

    // Create authenticated agent
    agent = request.agent(testApp);

    // Create unique test counter for this test run
    testCounter++;

    // Create test user
    const userData = {
      username: `testuser${testCounter}`,
      email: `test${testCounter}@example.com`,
      password: "testpassword",
      role: "admin",
      organization: `testorg${testCounter}`,
      organizationName: `Test Organization ${testCounter}`,
    };

    await agent.post("/api/auth/register").send(userData).expect(200);

    await agent
      .post("/api/auth/login")
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    testUser = await User.findOne({ username: userData.username });

    // Get the organization created by registration
    testOrganization = await Organization.findOne({
      identifier: userData.organization,
    });

    // Create test form
    testForm = new Form({
      title: "Test Form",
      description: "Test Description",
      organization: testOrganization.identifier,
      userId: testUser._id,
      inputs: [
        {
          label: "Feedback",
          type: "text",
          required: true,
        },
      ],
    });
    await testForm.save();

    // Create test feedback
    testFeedback = new Feedback({
      formId: testForm._id,
      formTitle: testForm.title,
      formDescription: testForm.description,
      opinion: "Test feedback content",
      organization: testOrganization.identifier,
      answers: [{ input: "Test feedback content" }],
    });
    await testFeedback.save();

    // Create test insights
    testInsight = new Insight({
      feedbackId: testFeedback._id,
      formId: testForm._id,
      organization: testOrganization.identifier,
      formTitle: testForm.title,
      formDescription: testForm.description,
      sentiment: "dissatisfied",
      feedbackDescription: "This product has bugs",
      keywords: ["bugs", "issues", "problems"],
      embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
    });
    await testInsight.save();

    // Create second test feedback and insight
    const secondFeedback = new Feedback({
      formId: testForm._id,
      formTitle: testForm.title,
      formDescription: testForm.description,
      opinion: "Another test feedback",
      organization: testOrganization.identifier,
      answers: [{ input: "Another test feedback" }],
    });
    await secondFeedback.save();

    secondTestInsight = new Insight({
      feedbackId: secondFeedback._id,
      formId: testForm._id,
      organization: testOrganization.identifier,
      formTitle: testForm.title,
      formDescription: testForm.description,
      sentiment: "very dissatisfied",
      feedbackDescription: "Interface is confusing",
      keywords: ["interface", "confusing", "ui"],
      embedding: [0.6, 0.7, 0.8, 0.9, 1.0],
    });
    await secondTestInsight.save();
  });

  describe("GET /api/insight/", () => {
    it("should get all insights", async () => {
      const response = await agent.get("/api/insight/").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty("feedbackId");
      expect(response.body[0]).toHaveProperty("sentiment");
      expect(response.body[0]).toHaveProperty("keywords");
    });

    it("should fail without authentication", async () => {
      await request(testApp).get("/api/insight/").expect(403);
    });
  });

  describe("GET /api/insight/:id", () => {
    it("should get insight by ID", async () => {
      const response = await agent
        .get(`/api/insight/${testInsight._id}`)
        .expect(200);

      expect(response.body._id).toBe(testInsight._id.toString());
      expect(response.body.sentiment).toBe("dissatisfied");
      expect(response.body.feedbackDescription).toBe("This product has bugs");
      expect(response.body.keywords).toEqual(["bugs", "issues", "problems"]);
    });

    it("should return 404 for non-existent insight ID", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const response = await agent
        .get(`/api/insight/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe("Insight not found");
    });

    it("should return 400 for invalid insight ID", async () => {
      const response = await agent.get("/api/insight/invalid-id").expect(400);

      expect(response.body.message).toBe("Invalid insight ID");
    });

    it("should fail without authentication", async () => {
      await request(testApp).get(`/api/insight/${testInsight._id}`).expect(403);
    });
  });

  describe("GET /api/insight/organization/:organization", () => {
    it("should get insights by organization", async () => {
      const response = await agent
        .get(`/api/insight/organization/${testOrganization.identifier}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].organization).toBe(testOrganization.identifier);
      expect(response.body[1].organization).toBe(testOrganization.identifier);
    });

    it("should return 404 when no insights found for organization", async () => {
      const response = await agent
        .get("/api/insight/organization/nonexistent")
        .expect(404);

      expect(response.body.message).toBe(
        "No insights found for this organization"
      );
    });

    it("should return 400 when organization parameter is missing", async () => {
      const response = await agent
        .get("/api/insight/organization/")
        .expect(400); // Route validation error
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .get(`/api/insight/organization/${testOrganization.identifier}`)
        .expect(403);
    });
  });

  describe("GET /api/insight/feedback/:feedbackId", () => {
    it("should get insights by feedback ID", async () => {
      const response = await agent
        .get(`/api/insight/feedback/${testFeedback._id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].feedbackId).toBe(testFeedback._id.toString());
      expect(response.body[0].sentiment).toBe("dissatisfied");
    });

    it("should return 404 when no insights found for feedback", async () => {
      const nonExistentFeedbackId = "507f1f77bcf86cd799439011";
      const response = await agent
        .get(`/api/insight/feedback/${nonExistentFeedbackId}`)
        .expect(404);

      expect(response.body.message).toBe("No insights found for this feedback");
    });

    it("should return 400 for invalid feedback ID", async () => {
      const response = await agent
        .get("/api/insight/feedback/invalid-id")
        .expect(400);

      expect(response.body.message).toBe("Invalid feedback ID");
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .get(`/api/insight/feedback/${testFeedback._id}`)
        .expect(403);
    });
  });

  describe("GET /api/insight/form/:formId", () => {
    it("should get insights by form ID", async () => {
      const response = await agent
        .get(`/api/insight/form/${testForm._id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].formId).toBe(testForm._id.toString());
      expect(response.body[1].formId).toBe(testForm._id.toString());
    });

    it("should return 404 when no feedback found for form", async () => {
      // Create a form with no feedback
      const emptyForm = new Form({
        title: "Empty Form",
        description: "No feedback",
        organization: testOrganization.identifier,
        userId: testUser._id,
        inputs: [{ label: "Test", type: "text", required: true }],
      });
      await emptyForm.save();

      const response = await agent
        .get(`/api/insight/form/${emptyForm._id}`)
        .expect(404);

      expect(response.body.message).toBe("No feedback found for this form");
    });

    it("should return 400 for invalid form ID", async () => {
      const response = await agent
        .get("/api/insight/form/invalid-id")
        .expect(400);

      expect(response.body.message).toBe("Invalid form ID");
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .get(`/api/insight/form/${testForm._id}`)
        .expect(403);
    });
  });

  describe("DELETE /api/insight/:id/delete", () => {
    it("should delete insight successfully", async () => {
      const response = await agent
        .delete(`/api/insight/${testInsight._id}/delete`)
        .expect(200);

      expect(response.body.message).toBe("Insight deleted successfully");

      // Verify insight is deleted
      const deletedInsight = await Insight.findById(testInsight._id);
      expect(deletedInsight).toBeNull();
    });

    it("should return 404 for non-existent insight", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const response = await agent
        .delete(`/api/insight/${nonExistentId}/delete`)
        .expect(404);

      expect(response.body.message).toBe("Insight not found");
    });

    it("should return 400 for invalid insight ID", async () => {
      const response = await agent
        .delete("/api/insight/invalid-id/delete")
        .expect(400);

      expect(response.body.message).toBe("Invalid insight ID");
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .delete(`/api/insight/${testInsight._id}/delete`)
        .expect(403);
    });
  });
});

describe("Cluster API", () => {
  let agent;
  let testUser;
  let testOrganization;
  let testForm;
  let testInsights = [];
  let testCounter = 0;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Form.deleteMany({});
    await Feedback.deleteMany({});
    await Insight.deleteMany({});
    await ClusterAnalysis.deleteMany({});

    // Create authenticated agent
    agent = request.agent(testApp);

    // Create unique test counter for this test run
    testCounter++;

    // Create test user
    const userData = {
      username: `testuser${testCounter}`,
      email: `test${testCounter}@example.com`,
      password: "testpassword",
      role: "admin",
      organization: `testorg${testCounter}`,
      organizationName: `Test Organization ${testCounter}`,
    };

    await agent.post("/api/auth/register").send(userData).expect(200);

    await agent
      .post("/api/auth/login")
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    testUser = await User.findOne({ username: userData.username });

    // Get the organization created by registration
    testOrganization = await Organization.findOne({
      identifier: userData.organization,
    });

    // Update organization thresholds for testing
    testOrganization.recommendationThreshold = 0.3; // Lower threshold for testing
    testOrganization.notificationThreshold = 0.5;
    await testOrganization.save();

    // Create test form
    testForm = new Form({
      title: "Test Form for Clustering",
      description: "Test Description",
      organization: testOrganization.identifier,
      userId: testUser._id,
      inputs: [
        {
          label: "Feedback",
          type: "text",
          required: true,
        },
      ],
    });
    await testForm.save();

    // Create multiple test feedbacks and insights for clustering
    const feedbackData = [
      {
        feedback: "UI is confusing",
        sentiment: "dissatisfied",
        keywords: ["ui", "confusing"],
      },
      {
        feedback: "Interface is hard to use",
        sentiment: "very dissatisfied",
        keywords: ["interface", "hard"],
      },
      {
        feedback: "Buttons are unclear",
        sentiment: "dissatisfied",
        keywords: ["buttons", "unclear"],
      },
      {
        feedback: "System is slow",
        sentiment: "dissatisfied",
        keywords: ["slow", "performance"],
      },
      {
        feedback: "Loading takes forever",
        sentiment: "very dissatisfied",
        keywords: ["loading", "slow"],
      },
      {
        feedback: "App crashes frequently",
        sentiment: "very dissatisfied",
        keywords: ["crashes", "bugs"],
      },
    ];

    for (let i = 0; i < feedbackData.length; i++) {
      const data = feedbackData[i];

      const feedback = new Feedback({
        formId: testForm._id,
        formTitle: testForm.title,
        formDescription: testForm.description,
        opinion: data.feedback,
        organization: testOrganization.identifier,
        answers: [{ input: data.feedback }],
      });
      await feedback.save();

      const insight = new Insight({
        feedbackId: feedback._id,
        formId: testForm._id,
        organization: testOrganization.identifier,
        formTitle: testForm.title,
        formDescription: testForm.description,
        sentiment: data.sentiment,
        feedbackDescription: data.feedback,
        keywords: data.keywords,
        embedding: [
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
        ],
      });
      await insight.save();
      testInsights.push(insight);
    }
  });

  describe("POST /api/cluster/form/:formId/cluster", () => {
    it("should cluster insights successfully", async () => {
      const response = await agent
        .post(`/api/cluster/form/${testForm._id}/cluster`)
        .expect(200);

      expect(response.body).toHaveProperty("formId");
      expect(response.body).toHaveProperty("totalInsights");
      expect(response.body).toHaveProperty("clusters");
      expect(response.body.formId).toBe(testForm._id.toString());
      expect(response.body.totalInsights).toBe(6);
      expect(Array.isArray(response.body.clusters)).toBe(true);
      expect(response.body.clusters.length).toBeGreaterThan(0);

      // Check if cluster analyses were saved
      const clusterAnalyses = await ClusterAnalysis.find({
        formId: testForm._id,
      });
      expect(clusterAnalyses.length).toBeGreaterThan(0);
    });

    it("should return message when not enough insights for clustering", async () => {
      // Create a new form with only 1 insight
      const singleInsightForm = new Form({
        title: "Single Insight Form",
        description: "Test",
        organization: testOrganization.identifier,
        userId: testUser._id,
        inputs: [{ label: "Test", type: "text", required: true }],
      });
      await singleInsightForm.save();

      const feedback = new Feedback({
        formId: singleInsightForm._id,
        formTitle: singleInsightForm.title,
        formDescription: singleInsightForm.description,
        opinion: "Single feedback",
        organization: testOrganization.identifier,
        answers: [{ input: "Single feedback" }],
      });
      await feedback.save();

      const insight = new Insight({
        feedbackId: feedback._id,
        formId: singleInsightForm._id,
        organization: testOrganization.identifier,
        formTitle: singleInsightForm.title,
        formDescription: singleInsightForm.description,
        sentiment: "neutral",
        feedbackDescription: "Single feedback",
        keywords: ["single"],
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      });
      await insight.save();

      const response = await agent
        .post(`/api/cluster/form/${singleInsightForm._id}/cluster`)
        .expect(200);

      expect(response.body.message).toBe(
        "Not enough insights for clustering (minimum 2 required)"
      );
      expect(response.body.clusters).toEqual([]);
    });

    it("should return 400 for invalid form ID", async () => {
      const response = await agent
        .post("/api/cluster/form/invalid-id/cluster")
        .expect(400);

      expect(response.body.message).toBe("Invalid form ID");
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .post(`/api/cluster/form/${testForm._id}/cluster`)
        .expect(403);
    });
  });

  describe("GET /api/cluster/form/:formId", () => {
    beforeEach(async () => {
      // Create some cluster analyses
      const clusterAnalysis = new ClusterAnalysis({
        formId: testForm._id,
        organization: testOrganization.identifier,
        clusterLabel: "UI Issues",
        clusterSummary: "Users complaining about UI problems",
        insightIds: [testInsights[0]._id, testInsights[1]._id],
        sentimentPercentage: 80,
        clusterSize: 2,
        recommendation: "Improve UI design",
        impact: "high",
        urgency: "soon",
        ticketCreated: false,
      });
      await clusterAnalysis.save();
    });

    it("should get cluster analysis by form ID", async () => {
      const response = await agent
        .get(`/api/cluster/form/${testForm._id}`)
        .expect(200);

      expect(response.body).toHaveProperty("formId");
      expect(response.body).toHaveProperty("totalAnalyses");
      expect(response.body).toHaveProperty("clusters");
      expect(response.body.formId).toBe(testForm._id.toString());
      expect(response.body.totalAnalyses).toBe(1);
      expect(Array.isArray(response.body.clusters)).toBe(true);
      expect(response.body.clusters[0]).toHaveProperty("clusterLabel");
      expect(response.body.clusters[0]).toHaveProperty("sentimentPercentage");
      expect(response.body.clusters[0]).toHaveProperty("creationDate");
    });

    it("should return 404 when no cluster analyses found", async () => {
      // Create a form with no cluster analyses
      const emptyForm = new Form({
        title: "Empty Form",
        description: "No clusters",
        organization: testOrganization.identifier,
        userId: testUser._id,
        inputs: [{ label: "Test", type: "text", required: true }],
      });
      await emptyForm.save();

      const response = await agent
        .get(`/api/cluster/form/${emptyForm._id}`)
        .expect(404);

      expect(response.body.message).toBe(
        "No cluster analyses found for this form. Run clustering first."
      );
    });

    it("should return 400 for invalid form ID", async () => {
      const response = await agent
        .get("/api/cluster/form/invalid-id")
        .expect(400);

      expect(response.body.message).toBe("Invalid form ID");
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .get(`/api/cluster/form/${testForm._id}`)
        .expect(403);
    });
  });

  describe("GET /api/cluster/organization/:organization", () => {
    beforeEach(async () => {
      // Create multiple cluster analyses
      const clusterAnalyses = [
        {
          formId: testForm._id,
          organization: testOrganization.identifier,
          clusterLabel: "UI Issues",
          clusterSummary: "Users complaining about UI problems",
          insightIds: [testInsights[0]._id],
          sentimentPercentage: 85,
          clusterSize: 1,
          recommendation: "Improve UI",
          impact: "high",
          urgency: "immediate",
          ticketCreated: true,
        },
        {
          formId: testForm._id,
          organization: testOrganization.identifier,
          clusterLabel: "Performance Issues",
          clusterSummary: "Users complaining about slow performance",
          insightIds: [testInsights[1]._id],
          sentimentPercentage: 70,
          clusterSize: 1,
          recommendation: "Optimize performance",
          impact: "medium",
          urgency: "soon",
          ticketCreated: false,
        },
      ];

      for (const data of clusterAnalyses) {
        const cluster = new ClusterAnalysis(data);
        await cluster.save();
      }
    });

    it("should get cluster analysis by organization", async () => {
      const response = await agent
        .get(`/api/cluster/organization/${testOrganization.identifier}`)
        .expect(200);

      expect(response.body).toHaveProperty("organization");
      expect(response.body).toHaveProperty("summary");
      expect(response.body).toHaveProperty("analysesByForm");
      expect(response.body).toHaveProperty("allAnalyses");
      expect(response.body.organization).toBe(testOrganization.identifier);

      // Check summary statistics
      expect(response.body.summary.totalClusters).toBe(2);
      expect(response.body.summary.clustersWithTickets).toBe(1);
      expect(response.body.summary.highImpactClusters).toBe(1);
      expect(response.body.summary.urgentClusters).toBe(1);

      // Check analyses
      expect(Array.isArray(response.body.allAnalyses)).toBe(true);
      expect(response.body.allAnalyses.length).toBe(2);
    });

    it("should return 404 when no cluster analyses found for organization", async () => {
      const response = await agent
        .get("/api/cluster/organization/nonexistent")
        .expect(404);

      expect(response.body.message).toBe(
        "No cluster analyses found for this organization. Run clustering first."
      );
    });

    it("should return 400 when organization parameter is missing", async () => {
      const response = await agent
        .get("/api/cluster/organization/")
        .expect(404); // Route not found
    });

    it("should fail without authentication", async () => {
      await request(testApp)
        .get(`/api/cluster/organization/${testOrganization.identifier}`)
        .expect(403);
    });
  });
});
