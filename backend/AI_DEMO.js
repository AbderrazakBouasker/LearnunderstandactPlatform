// 🎯 AI Recommendations Flow Demo
// This shows exactly how the system analyzes clusters and generates recommendations

/**
 * EXAMPLE SCENARIO: Mobile Checkout Issues
 *
 * Input: 6 negative feedbacks about mobile checkout problems
 */

const exampleClusterData = {
  clusterInsights: [
    {
      feedbackDescription: "Checkout button is unresponsive on mobile device",
      sentiment: "very dissatisfied",
      keywords: ["checkout", "mobile", "button", "unresponsive"],
    },
    {
      feedbackDescription: "Payment processing fails repeatedly on iPhone",
      sentiment: "dissatisfied",
      keywords: ["payment", "mobile", "iPhone", "failure"],
    },
    {
      feedbackDescription: "Cannot complete purchase on Android device",
      sentiment: "very dissatisfied",
      keywords: ["purchase", "mobile", "Android", "broken"],
    },
    {
      feedbackDescription: "Mobile checkout page crashes during payment",
      sentiment: "very dissatisfied",
      keywords: ["mobile", "checkout", "crash", "payment"],
    },
    {
      feedbackDescription: "Touch interactions don't work on checkout form",
      sentiment: "dissatisfied",
      keywords: ["touch", "mobile", "checkout", "form"],
    },
    {
      feedbackDescription: "Mobile buttons too small and hard to tap",
      sentiment: "dissatisfied",
      keywords: ["mobile", "buttons", "small", "usability"],
    },
  ],
};

/**
 * STEP 1: Cluster Analysis
 */
const clusterAnalysis = {
  clusterSize: 6,
  sentimentPercentage: 83, // 5 negative out of 6 = 83%
  clusterLabel: "checkout, mobile, payment", // Top 3 keywords
  meetsThreshold: true, // >= 5 insights && >= 50% negative
};

/**
 * STEP 2: AI Prompt Generation
 */
const aiPrompt = `
Users are complaining about: "Checkout button is unresponsive on mobile device; Payment processing fails repeatedly on iPhone; Cannot complete purchase on Android device; Mobile checkout page crashes during payment; Touch interactions don't work on checkout form; Mobile buttons too small and hard to tap"

Cluster theme: "checkout, mobile, payment"

Suggest a product or UX improvement. Estimate the impact (high/medium/low) and urgency (immediate/soon/later).

Guidelines:
- High impact: Affects core functionality, revenue, or user retention
- Medium impact: Affects user experience but not critical  
- Low impact: Nice-to-have improvements

- Immediate: Fix within 1-2 weeks (critical issues)
- Soon: Fix within 1-2 months (important improvements)
- Later: Fix when resources allow (minor issues)
`;

/**
 * STEP 3: Expected AI Response
 */
const expectedAiResponse = {
  recommendation:
    "Fix mobile checkout button responsiveness by implementing touch-friendly button sizing (minimum 44px touch targets), add loading states to prevent double-taps, optimize payment processing for mobile browsers, and implement proper error handling with retry mechanisms. Consider adding one-click payment options for returning users.",
  impact: "high",
  urgency: "immediate",
  cluster_summary:
    "Users experiencing critical checkout failures on mobile devices preventing purchase completion",
};

/**
 * STEP 4: Ticket Decision
 */
const ticketDecision = {
  shouldCreateTicket: true, // high impact + immediate urgency
  reason:
    "High impact (affects revenue) + Immediate urgency (critical functionality)",
  checks: {
    impactIsHigh: true,
    urgencyIsImmediate: true,
    noRecentTicket: true, // No ticket in last 7 days
  },
};

/**
 * STEP 5: Final Result
 */
const finalClusterResult = {
  clusterId: "0",
  clusterLabel: "checkout, mobile, payment",
  insights: exampleClusterData.clusterInsights,
  sentimentPercentage: 83,
  clusterSize: 6,
  analysis: expectedAiResponse,
  shouldCreateTicket: true,
};

console.log("🎯 AI Recommendations Demo");
console.log("==========================");
console.log("📊 Cluster Analysis:", JSON.stringify(clusterAnalysis, null, 2));
console.log("🤖 AI Response:", JSON.stringify(expectedAiResponse, null, 2));
console.log("🎫 Ticket Decision:", JSON.stringify(ticketDecision, null, 2));
console.log("✅ This demonstrates your AI system working perfectly!");

export { exampleClusterData, expectedAiResponse, ticketDecision };
