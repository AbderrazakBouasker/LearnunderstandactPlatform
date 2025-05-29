"use client";

import * as React from "react";

export function FormDateSelector({
  startDate,
  endDate,
  onDateChange,
}: {
  startDate: string;
  endDate: string;
  onDateChange: (dates: { startDate: string; endDate: string }) => void;
}) {
  React.useEffect(() => {
    if (!startDate || !endDate) {
      const today = new Date().toISOString().split("T")[0];
      onDateChange({ startDate: today, endDate: today });
    }
  }, [startDate, endDate, onDateChange]);

  return (
    <div className="flex gap-4">
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          max={endDate} // Disable dates higher than the end date
          onChange={(e) => {
            const newStartDate = e.target.value;
            if (newStartDate > endDate) {
              onDateChange({ startDate: newStartDate, endDate: newStartDate });
            } else {
              onDateChange({ startDate: newStartDate, endDate });
            }
          }}
          className="border rounded px-2 py-1 w-[200px]"
        />
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium mb-1">
          End Date
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          min={startDate} // Disable dates older than the start date
          onChange={(e) => {
            const newEndDate = e.target.value;
            if (newEndDate >= startDate) {
              onDateChange({ startDate, endDate: newEndDate });
            }
          }}
          className="border rounded px-2 py-1 w-[200px]"
        />
      </div>
    </div>
  );
}
