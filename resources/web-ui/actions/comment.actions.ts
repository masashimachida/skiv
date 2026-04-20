"use server";

import { revalidatePath } from "next/cache";
import * as repo from "../lib/comment.repository";
import { Comment } from "../types/index";

type Ok<T> = { data: T; error: null };
type Err = { data: null; error: string };

function ok<T>(data: T): Ok<T> { return { data, error: null }; }
function err(e: unknown): Err {
  const msg = e instanceof Error ? e.message : String(e);
  return { data: null, error: msg };
}

export async function createCommentAction(projectId: string, input: {
  taskId: string;
  author: string;
  body: string;
}): Promise<Ok<Comment> | Err> {
  try {
    const comment = repo.createComment(projectId, input);
    revalidatePath("/");
    return ok(comment);
  } catch (e) { return err(e); }
}
