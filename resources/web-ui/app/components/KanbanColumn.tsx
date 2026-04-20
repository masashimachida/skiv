"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task, Status, STATUS_LABELS } from "../../types/index";
import TaskCard from "./TaskCard";

interface Props {
  status: Status;
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onAddTask: (status: Status) => void;
}

export default function KanbanColumn({ status, tasks, onCardClick, onAddTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 flex-1 min-h-20 rounded-lg p-2 transition-colors ${
          isOver ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 border-dashed" : "bg-gray-200/60 dark:bg-gray-800/60"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onCardClick(task)} />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddTask(status)}
          className="mt-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-1 rounded hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors text-left px-2"
        >
          + タスクを追加
        </button>
      </div>
    </div>
  );
}
