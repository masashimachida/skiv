"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Status, STATUS_LABELS } from "../../types/index";
import { createTaskAction } from "../../actions/task.actions";
import { Task } from "../../types/index";

interface Props {
  initialStatus: Status | null;
  projectId: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export default function NewTaskModal({ initialStatus, projectId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (initialStatus !== null) {
      dialogRef.current?.showModal();
      setTitle("");
      setError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [initialStatus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await createTaskAction(projectId, {
        title: title.trim(),
        status: initialStatus ?? "inbox",
      });
      if (result.error || !result.data) {
        setError(result.error ?? "エラーが発生しました");
      } else {
        onCreated(result.data);
        onClose();
      }
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-sm m-auto rounded-xl shadow-2xl p-0 backdrop:bg-black/40 bg-white dark:bg-gray-800"
    >
      <form onSubmit={handleSubmit}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            新規タスク
            {initialStatus && (
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                — {STATUS_LABELS[initialStatus]}
              </span>
            )}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">✕</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスクのタイトル"
            maxLength={255}
            autoFocus
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="text-sm px-4 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "作成中..." : "作成"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
