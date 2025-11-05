import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
  rest: string;
}

interface ExerciseTableProps {
  exercises: Exercise[];
  type: string;
  selectedWeek: number;
  selectedDay: number;
  notes: Record<string, string>;
  onNoteChange: (
    week: number,
    day: number,
    exerciseId: string,
    value: string
  ) => void;
}

const ExerciseTable: React.FC<ExerciseTableProps> = ({
  exercises,
  type,
  selectedWeek,
  selectedDay,
  notes,
  onNoteChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!exercises || exercises.length === 0) return null;

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "skill":
        return "🎯";
      case "strength":
        return "💪";
      case "core":
        return "🔥";
      case "conditioning":
        return "⚡";
      default:
        return "🏋️";
    }
  };

  const getSectionTitle = (type: string) => {
    switch (type) {
      case "skill":
        return "Skill Block";
      case "strength":
        return "Strength Work";
      case "core":
        return "Core";
      case "conditioning":
        return "Conditioning";
      default:
        return type;
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 text-left"
      >
        <h3 className="text-lg font-bold uppercase text-orange-500">
          {getSectionIcon(type)} {getSectionTitle(type)}
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-700 p-2 text-left text-sm">
                  Exercise
                </th>
                <th className="border border-gray-700 p-2 text-center text-sm w-16">
                  Sets
                </th>
                <th className="border border-gray-700 p-2 text-center text-sm w-20">
                  Reps/Time
                </th>
                <th className="border border-gray-700 p-2 text-center text-sm w-20">
                  Rest
                </th>
                <th className="border border-gray-700 p-2 text-left text-sm">
                  Notes (e.g., 7-7-6)
                </th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex, idx) => {
                const exerciseId = `${type}-${idx}`;
                const noteKey = `w${selectedWeek}-d${selectedDay}-${exerciseId}`;
                return (
                  <tr key={idx} className="hover:bg-gray-800/50">
                    <td className="border border-gray-700 p-2 text-sm">
                      {ex.name}
                    </td>
                    <td className="border border-gray-700 p-2 text-center text-sm">
                      {ex.sets}
                    </td>
                    <td className="border border-gray-700 p-2 text-center text-sm">
                      {ex.reps}
                    </td>
                    <td className="border border-gray-700 p-2 text-center text-sm">
                      {ex.rest}
                    </td>
                    <td className="border border-gray-700 p-2">
                      <input
                        type="text"
                        placeholder="e.g., 7-7-6 or 10s-8s-9s"
                        value={notes[noteKey] || ""}
                        onChange={(e) =>
                          onNoteChange(
                            selectedWeek,
                            selectedDay,
                            exerciseId,
                            e.target.value
                          )
                        }
                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExerciseTable;
