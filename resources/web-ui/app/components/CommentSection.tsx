"use client";

import { useState, useTransition } from "react";
import { Comment } from "../../types/index";
import { createCommentAction } from "../../actions/comment.actions";
import ReactMarkdown from "react-markdown";

interface Props {
  taskId: string;
  projectId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export default function CommentSection({ taskId, projectId, comments, onCommentAdded }: Props) {
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !body.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await createCommentAction(projectId, { taskId, author: author.trim(), body: body.trim() });
      if (result.error || !result.data) {
        setError(result.error ?? "エラーが発生しました");
      } else {
        onCommentAdded(result.data);
        setBody("");
      }
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 shrink-0">コメント</h3>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">まだコメントはありません</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.author}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(c.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="prose prose-xs dark:prose-invert max-w-none text-xs text-gray-600 dark:text-gray-400">
              <ReactMarkdown>{c.body}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 shrink-0 border-t border-gray-100 dark:border-gray-700 pt-3">
        <input
          type="text"
          placeholder="投稿者名"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={64}
          className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400"
        />
        <textarea
          placeholder="コメントを入力..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={10000}
          rows={2}
          className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 resize-none"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !author.trim() || !body.trim()}
          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "送信中..." : "投稿"}
        </button>
      </form>
    </div>
  );
}
