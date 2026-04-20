"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task, Status, STATUSES } from "../../types/index";
import { updateTaskStatusAction, listAllTasksAction } from "../../actions/task.actions";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import NewTaskModal from "./NewTaskModal";

interface Props {
  initialTasks: Task[];
  projectId: string;
}

export default function KanbanBoard({ initialTasks, projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<Status | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const isDragging = useRef(false);
  useEffect(() => {
    isDragging.current = activeTask !== null;
  }, [activeTask]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (isDragging.current) return;
      const result = await listAllTasksAction(projectId);
      if (result.data) setTasks(result.data);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  function getTasksByStatus(status: Status) {
    return tasks.filter((t) => t.status === status);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overIsColumn = STATUSES.includes(overId as Status);
    const overTask = tasks.find((t) => t.id === overId);
    const newStatus: Status = overIsColumn
      ? (overId as Status)
      : overTask
      ? overTask.status
      : activeTask.status;

    if (activeTask.status !== newStatus) {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t))
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    const overIsColumn = STATUSES.includes(overId as Status);
    const overTask = tasks.find((t) => t.id === overId);
    const finalStatus: Status = overIsColumn
      ? (overId as Status)
      : overTask
      ? overTask.status
      : task.status;

    if (!overIsColumn && overTask && task.status === finalStatus) {
      setTasks((prev) => {
        const colTasks = prev.filter((t) => t.status === finalStatus);
        const oldIdx = colTasks.findIndex((t) => t.id === activeId);
        const newIdx = colTasks.findIndex((t) => t.id === overId);
        if (oldIdx === newIdx) return prev;
        const reordered = arrayMove(colTasks, oldIdx, newIdx);
        const others = prev.filter((t) => t.status !== finalStatus);
        return [...others, ...reordered];
      });
    }

    startTransition(async () => {
      await updateTaskStatusAction(projectId, activeId, finalStatus);
    });
  }

  function handleCardClick(task: Task) {
    const current = tasks.find((t) => t.id === task.id) ?? task;
    setSelectedTask(current);
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  return (
    <>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 p-4 h-full items-start">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={getTasksByStatus(status)}
                onCardClick={handleCardClick}
                onAddTask={(s) => setNewTaskStatus(s)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} onClick={() => {}} />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        task={selectedTask}
        allTasks={tasks}
        projectId={projectId}
        onClose={() => setSelectedTask(null)}
        onDeleted={handleTaskDeleted}
        onUpdated={handleTaskUpdated}
        onSelectTask={handleCardClick}
      />

      <NewTaskModal
        initialStatus={newTaskStatus}
        projectId={projectId}
        onClose={() => setNewTaskStatus(null)}
        onCreated={handleTaskCreated}
      />
    </>
  );
}
