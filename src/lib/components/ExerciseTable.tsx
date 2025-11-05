import React, { useState } from "react";
import { ChevronDown, ChevronUp, Play } from "lucide-react";

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
  onStartExercise?: (exerciseId: string) => void;
}

const ExerciseTable: React.FC<ExerciseTableProps> = ({
  exercises,
  type,
  selectedWeek,
  selectedDay,
  notes,
  onNoteChange,
  onStartExercise,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
    new Set(exercises.map((_, idx) => `${type}-${idx}`))
  );

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
        <div className="space-y-3">
          {exercises.map((ex, idx) => {
            const exerciseId = `${type}-${idx}`;
            const isExerciseExpanded = expandedExercises.has(exerciseId);

            return (
              <div
                key={idx}
                className="bg-gray-800/70 rounded-lg border border-gray-700 overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="p-4 border-b border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-orange-400">
                        {ex.name}
                      </h4>
                      {onStartExercise && (
                        <button
                          onClick={() => onStartExercise(exerciseId)}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                          title="Start exercise timer"
                        >
                          <Play size={12} />
                          Start
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedExercises);
                        if (isExerciseExpanded) {
                          newExpanded.delete(exerciseId);
                        } else {
                          newExpanded.add(exerciseId);
                        }
                        setExpandedExercises(newExpanded);
                      }}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title={isExerciseExpanded ? "Collapse" : "Expand"}
                    >
                      {isExerciseExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Individual Set Rows */}
                {isExerciseExpanded && (
                  <div className="border-t border-gray-700">
                    {Array.from({ length: ex.sets }, (_, setIndex) => {
                      const setNumber = setIndex + 1;
                      const setNoteKey = `w${selectedWeek}-d${selectedDay}-${exerciseId}-set${setNumber}`;

                      return (
                        <div
                          key={setIndex}
                          className="p-3 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/40"
                        >
                          {/* Set Info */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-300">
                              Set {setNumber}
                            </span>
                            <span className="text-sm text-gray-400">
                              {ex.reps} reps
                            </span>
                            {setIndex < ex.sets - 1 && (
                              <span className="text-xs text-gray-500">
                                • Rest: {ex.rest}
                              </span>
                            )}
                          </div>

                          {/* Set-specific notes */}
                          <input
                            type="text"
                            placeholder={`Notes for set ${setNumber}...`}
                            value={notes[setNoteKey] || ""}
                            onChange={(e) =>
                              onNoteChange(
                                selectedWeek,
                                selectedDay,
                                `${exerciseId}-set${setNumber}`,
                                e.target.value
                              )
                            }
                            className="w-full bg-gray-900/50 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExerciseTable;
