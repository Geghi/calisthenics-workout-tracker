import React from "react";

interface WorkoutSelectorProps {
  selectedWeek: number;
  selectedDay: number;
  onWeekChange: (week: number) => void;
  onDayChange: (day: number) => void;
  currentWeekData: {
    phase: string;
    description: string;
  } | null;
}

const WorkoutSelector: React.FC<WorkoutSelectorProps> = ({
  selectedWeek,
  selectedDay,
  onWeekChange,
  onDayChange,
  currentWeekData,
}) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mb-6 backdrop-blur">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-orange-400">
            Select Week
          </label>
          <select
            value={selectedWeek}
            onChange={(e) => onWeekChange(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-orange-400">
            Select Day
          </label>
          <select
            value={selectedDay}
            onChange={(e) => onDayChange(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-orange-500"
          >
            <option value={1}>Day 1 - Push</option>
            <option value={2}>Day 2 - Pull</option>
            <option value={3}>Day 3 - Full Body</option>
          </select>
        </div>
      </div>

      {currentWeekData && (
        <div className="bg-gray-900/50 rounded p-3 border border-gray-700">
          <h2 className="font-bold text-orange-400 mb-1">
            {currentWeekData.phase}
          </h2>
          <p className="text-sm text-gray-400">{currentWeekData.description}</p>
        </div>
      )}
    </div>
  );
};

export default WorkoutSelector;
