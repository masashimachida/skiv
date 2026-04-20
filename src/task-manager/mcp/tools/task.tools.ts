import { z } from "zod";
import { StatusEnum } from "../../types/index";
import * as repo from "../../lib/task.repository";

export const CreateTaskInput = z.object({
  title: z.string().min(1).max(255),
  status: StatusEnum.optional(),
  description: z.string().max(10000).optional(),
  dependencies: z.array(z.string()).optional(),
  assignee: z.string().max(64).optional(),
});

export const GetTaskInput = z.object({
  id: z.string().min(1),
});

export const ListTasksInput = z.object({
  status: z.union([StatusEnum, z.array(StatusEnum)]).optional(),
  assignee: z.string().max(64).optional(),
});

export const UpdateTaskInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  status: StatusEnum.optional(),
  description: z.string().max(10000).nullable().optional(),
  dependencies: z.array(z.string()).nullable().optional(),
  assignee: z.string().max(64).nullable().optional(),
});

export const DeleteTaskInput = z.object({
  id: z.string().min(1),
});

export function createTaskHandlers(projectId: string) {
  return {
    handleCreateTask(raw: unknown) {
      const input = CreateTaskInput.parse(raw);
      const task = repo.createTask(projectId, input);
      return { task };
    },

    handleGetTask(raw: unknown) {
      const input = GetTaskInput.parse(raw);
      const task = repo.getTaskById(projectId, input.id);
      return { task };
    },

    handleListTasks(raw: unknown) {
      const input = ListTasksInput.parse(raw);
      const tasks = repo.listTasks(projectId, input);
      return { tasks, total: tasks.length };
    },

    handleUpdateTask(raw: unknown) {
      const input = UpdateTaskInput.parse(raw);
      const { id, ...rest } = input;
      const task = repo.updateTask(projectId, id, rest);
      return { task };
    },

    handleDeleteTask(raw: unknown) {
      const input = DeleteTaskInput.parse(raw);
      repo.deleteTask(projectId, input.id);
      return { success: true, id: input.id };
    },
  };
}
