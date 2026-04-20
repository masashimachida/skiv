"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../../types/index";

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      suppressHydrationWarning
      className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all select-none"
    >
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug">{task.title}</p>
      {task.assignee && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{task.assignee}</p>
      )}
    </div>
  );
}
