"use client";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FormSelectCombobox } from "@/components/form-select-combobox";
import { FormDateSelector } from "@/components/form-date-selecter";

// Type definitions
interface FormOption {
  value: string;
  label: string;
}

interface ClusterStats {
  totalClusters: number;
  formsWithClusters: number;
  clustersWithTickets: number;
  highImpactClusters: number;
  urgentClusters: number;
  averageSentimentPercentage: number;
  averageClusterSize: number;
  impactBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  urgencyBreakdown: {
    immediate: number;
    soon: number;
    later: number;
  };
  recentClusters: number;
}

interface ClusterSentimentData {
  date: string;
  averageSentiment: number;
  totalClusters: number;
  highImpactClusters: number;
  urgentClusters: number;
  clustersWithTickets: number;
  averageClusterSize: number;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  organization: string[];
  createdAt: string;
  organizationDetails: any[];
  id: string;
}

export function Dashboard({
  selectedOrganization,
  userData,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0];

  // State variables for data
  const [organizationFeedbackTrend, setOrganizationFeedbackTrend] = useState<
    any[]
  >([]);
  const [formFeedbackTrend, setFormFeedbackTrend] = useState<any[]>([]);
  const [feedbackByFormData, setFeedbackByFormData] = useState<any[]>([]);
  const [opinionDistribution, setOpinionDistribution] = useState<any[]>([]);
  const [clusterStats, setClusterStats] = useState<ClusterStats | null>(null);
  const [clusterSentimentTrend, setClusterSentimentTrend] = useState<
    ClusterSentimentData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: oneMonthAgoStr,
    endDate: tomorrowStr,
  });
  const [forms, setForms] = useState<FormOption[]>([]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  // Fetch forms for the organization
  const fetchForms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/organization/${selectedOrganization}`
      );

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      // Check if response has content
      const text = await response.text();
      if (!text) {
        setForms([]);
        return;
      }

      try {
        const formsData = JSON.parse(text);
        setForms(
          formsData.map((form: any) => ({ value: form._id, label: form.title }))
        );

        if (formsData.length > 0 && !selectedForm) {
          setSelectedForm(formsData[0]._id);
        }
      } catch (parseError) {
        console.error("Failed to parse forms response:", parseError);
        setForms([]);
      }
    } catch (error) {
      console.error("Failed to fetch forms:", error);
      setForms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all statistical data
  const fetchDashboardData = async () => {
    if (!selectedOrganization || !dateRange.startDate || !dateRange.endDate)
      return;

    try {
      setIsLoading(true);

      // Helper function to safely parse JSON response
      const safeJsonParse = async (response: Response) => {
        const text = await response.text();
        if (!text) return [];
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return [];
        }
      };

      // 1. Feedback count over time for organization
      const orgFeedbackResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/${selectedOrganization}/feedback-count?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      let orgFeedbackData = [];
      if (orgFeedbackResponse.ok) {
        orgFeedbackData = await safeJsonParse(orgFeedbackResponse);
      }

      // 2. Total feedback count by form for organization
      const feedbackByFormResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/${selectedOrganization}/feedback-total-by-form`
      );
      let feedbackByFormData = [];
      if (feedbackByFormResponse.ok) {
        feedbackByFormData = await safeJsonParse(feedbackByFormResponse);
      }

      // 3. Feedback count over time for selected form
      let formFeedbackData = [];
      if (selectedForm) {
        const formFeedbackResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/form/${selectedForm}/feedback-count?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        );
        if (formFeedbackResponse.ok) {
          formFeedbackData = await safeJsonParse(formFeedbackResponse);
        }

        // 4. Opinion distribution for selected form
        const opinionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/form/${selectedForm}/opinion-counts`
        );
        if (opinionResponse.ok) {
          const opinionData = await safeJsonParse(opinionResponse);
          setOpinionDistribution(opinionData.opinionCounts || []);
        } else {
          setOpinionDistribution([]);
        }

        // 5. Cluster sentiment trend for selected form
        const clusterSentimentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/form/${selectedForm}/cluster-sentiment?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        );
        if (clusterSentimentResponse.ok) {
          const clusterSentimentData = await safeJsonParse(
            clusterSentimentResponse
          );
          setClusterSentimentTrend(clusterSentimentData.sentimentTrend || []);
        } else {
          setClusterSentimentTrend([]);
        }
      }

      // 6. Cluster statistics for organization
      const clusterStatsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/${selectedOrganization}/cluster-stats`
      );
      if (clusterStatsResponse.ok) {
        const clusterStatsData = await safeJsonParse(clusterStatsResponse);
        setClusterStats(clusterStatsData);
      } else {
        setClusterStats(null);
      }

      // Update state with fetched data
      setOrganizationFeedbackTrend(
        (orgFeedbackData || []).map((item: any) => ({
          date: item._id,
          count: item.count,
          // Add normalized value for gradient fill
          normalizedValue: item.count,
        }))
      );

      setFormFeedbackTrend(
        (formFeedbackData || []).map((item: any) => ({
          date: item._id,
          count: item.count,
          // Add normalized value for gradient fill
          normalizedValue: item.count,
        }))
      );

      setFeedbackByFormData(
        (feedbackByFormData || []).map((item: any, index: number) => ({
          name: item.formTitle || `Form ${index + 1}`,
          count: item.count,
          fill: `rgba(33, 150, 243, ${
            0.4 + (0.6 * index) / feedbackByFormData.length
          })`,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Reset all data to empty arrays on error
      setOrganizationFeedbackTrend([]);
      setFormFeedbackTrend([]);
      setFeedbackByFormData([]);
      setOpinionDistribution([]);
      setClusterStats(null);
      setClusterSentimentTrend([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrganization) {
      fetchForms();
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (selectedOrganization && dateRange.startDate && dateRange.endDate) {
      fetchDashboardData();
    }
  }, [selectedOrganization, dateRange, selectedForm]);

  // Chart colors
  const BLUE_COLORS = [
    "#E3F2FD",
    "#BBDEFB",
    "#90CAF9",
    "#64B5F6",
    "#42A5F5",
    "#2196F3",
    "#1E88E5",
    "#1976D2",
    "#1565C0",
    "#0D47A1",
  ];

  const OPINION_COLORS = {
    "very dissatisfied": "#EF5350",
    dissatisfied: "#FFA726",
    neutral: "#FFEE58",
    satisfied: "#66BB6A",
    "very satisfied": "#26C6DA",
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Dashboard Analytics
          </h1>
          <p className="text-gray-600">
            View feedback statistics and metrics for your organization
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <FormDateSelector
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateChange={(dates) => setDateRange(dates)}
          />
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Form
            </label>
            <FormSelectCombobox
              items={forms}
              selectedValue={selectedForm}
              onValueChange={(value) => setSelectedForm(value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[300px] w-full items-center justify-center">
          <div className="animate-spin rounded-full border-t-2 border-l-2 border-blue-500 h-12 w-12"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Feedback Trend */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Organization Feedback Trend
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={organizationFeedbackTrend}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    tick={{ fill: "#666" }}
                  />
                  <YAxis tick={{ fill: "#666" }} />
                  <Tooltip />
                  <defs>
                    <linearGradient
                      id="orgGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2196F3"
                    fill="url(#orgGradient)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cluster Statistics Overview */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Cluster Statistics Overview
            </h3>
            {clusterStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {clusterStats.totalClusters}
                  </div>
                  <div className="text-sm text-gray-600">Total Clusters</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {clusterStats.formsWithClusters}
                  </div>
                  <div className="text-sm text-gray-600">
                    Forms with Clusters
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {clusterStats.highImpactClusters}
                  </div>
                  <div className="text-sm text-gray-600">High Impact</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {clusterStats.urgentClusters}
                  </div>
                  <div className="text-sm text-gray-600">Urgent</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {clusterStats.clustersWithTickets}
                  </div>
                  <div className="text-sm text-gray-600">With Tickets</div>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">
                    {clusterStats.averageSentimentPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Sentiment</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No cluster statistics available
              </div>
            )}
          </div>

          {/* Form Feedback Trend */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Form Feedback Trend{" "}
              <span className="text-sm font-normal text-gray-500 ml-2">
                {forms.find((f) => f.value === selectedForm)?.label}
              </span>
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formFeedbackTrend}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    tick={{ fill: "#666" }}
                  />
                  <YAxis tick={{ fill: "#666" }} />
                  <Tooltip />
                  <defs>
                    <linearGradient
                      id="formGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#1976D2"
                    fill="url(#formGradient)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Total Feedback by Form */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Total Feedback by Form
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={feedbackByFormData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    horizontal={false}
                  />
                  <XAxis type="number" tick={{ fill: "#666" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fill: "#666" }}
                    tickFormatter={(value) =>
                      value.length > 20 ? `${value.substring(0, 18)}...` : value
                    }
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    name="Feedback Count"
                    radius={[0, 4, 4, 0]}
                  >
                    {feedbackByFormData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.fill || BLUE_COLORS[index % BLUE_COLORS.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Opinion Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Opinion Distribution
              <span className="text-sm font-normal text-gray-500 ml-2">
                {forms.find((f) => f.value === selectedForm)?.label}
              </span>
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={opinionDistribution}
                    dataKey="count"
                    nameKey="opinion"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                    label={(entry) => `${entry.opinion}: ${entry.count}`}
                    labelLine={false}
                  >
                    {opinionDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          OPINION_COLORS[
                            entry.opinion as keyof typeof OPINION_COLORS
                          ] || BLUE_COLORS[index % BLUE_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cluster Sentiment Trend */}
          {selectedForm && clusterSentimentTrend.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Cluster Sentiment Trend
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {forms.find((f) => f.value === selectedForm)?.label}
                </span>
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={clusterSentimentTrend}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      tick={{ fill: "#666" }}
                    />
                    <YAxis
                      tick={{ fill: "#666" }}
                      domain={[0, 100]}
                      label={{
                        value: "Sentiment %",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <defs>
                      <linearGradient
                        id="sentimentGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#26C6DA"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#26C6DA"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="averageSentiment"
                      stroke="#26C6DA"
                      fill="url(#sentimentGradient)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
