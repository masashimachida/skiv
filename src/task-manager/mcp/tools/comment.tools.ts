import { z } from "zod";
import * as repo from "../../lib/comment.repository";

export const AddCommentInput = z.object({
  taskId: z.string().min(1),
  author: z.string().min(1).max(64),
  body: z.string().min(1).max(10000),
});

export const ListCommentsInput = z.object({
  taskId: z.string().min(1),
});

export function createCommentHandlers(projectId: string) {
  return {
    handleAddComment(raw: unknown) {
      const input = AddCommentInput.parse(raw);
      const comment = repo.createComment(projectId, input);
      return { comment };
    },

    handleListComments(raw: unknown) {
      const input = ListCommentsInput.parse(raw);
      const comments = repo.listCommentsByTaskId(projectId, input.taskId);
      return { comments, total: comments.length };
    },
  };
}
