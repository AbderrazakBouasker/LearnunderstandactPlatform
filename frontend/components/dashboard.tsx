"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FormSelectCombobox } from "@/components/form-select-combobox";
import { FormDateSelector } from "@/components/form-date-selecter";

export function Dashboard({
  selectedOrganization,
  userData,
}: {
  selectedOrganization: string;
  userData: UserData;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [feedbackCountData, setFeedbackCountData] = useState([]);
  const [opinionData, setOpinionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: today,
    endDate: today,
  });
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/form/organization/${selectedOrganization}`
      );
      const formsData = await response.json();
      setForms(
        formsData.map((form) => ({ value: form._id, label: form.title }))
      );
    } catch (error) {
      console.error("Failed to fetch forms:", error);
    }
  };

  const fetchFeedbackStatistics = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;

    try {
      const feedbackCountResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/${selectedOrganization}/feedback-count?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      const feedbackCount = await feedbackCountResponse.json();

      const opinionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/stats/${selectedOrganization}/opinion-counts-by-form`
      );
      const opinions = await opinionResponse.json();

      setFeedbackCountData(
        feedbackCount.map((item) => ({ date: item._id, count: item.count }))
      );
      setOpinionData(
        opinions.map((item) => ({
          name: item.formTitle,
          value: item.opinions.reduce((acc, opinion) => acc + opinion.count, 0),
        }))
      );
    } catch (error) {
      console.error("Failed to fetch feedback statistics:", error);
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
      fetchFeedbackStatistics();
    }
  }, [selectedOrganization, dateRange]);

  const COLORS = ["#4caf50", "#f44336", "#ffeb3b"];

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <FormDateSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateChange={(dates) => setDateRange(dates)}
        />
        <FormSelectCombobox
          items={forms}
          selectedValue={selectedForm}
          onValueChange={(value) => setSelectedForm(value)}
        />
      </div>
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="animate-spin rounded-full border-t-2 border-l-2 border-primary h-8 w-8"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">
              Feedback Count Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feedbackCountData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">
              Opinions Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={opinionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                >
                  {opinionData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
