"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Task, TaskWithComments, Status, STATUSES, STATUS_LABELS, Comment } from "../../types/index";
import { getTaskDetailAction, updateTaskAction, deleteTaskAction } from "../../actions/task.actions";
import CommentSection from "./CommentSection";
import ReactMarkdown from "react-markdown";

interface Props {
  task: Task | null;
  allTasks: Task[];
  projectId: string;
  onClose: () => void;
  onDeleted: (taskId: string) => void;
  onUpdated: (task: Task) => void;
  onSelectTask: (task: Task) => void;
}

export default function TaskModal({ task, allTasks, projectId, onClose, onDeleted, onUpdated, onSelectTask }: Props) {
  const [detail, setDetail] = useState<TaskWithComments | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState<Status>("inbox");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [depSearch, setDepSearch] = useState("");
  const [showDepDropdown, setShowDepDropdown] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({ top: 0, left: 0, width: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const depInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      dialogRef.current?.showModal();
      setTitle(task.title);
      setDescription(task.description ?? "");
      setAssignee(task.assignee ?? "");
      setStatus(task.status);
      setDependencies(task.dependencies);
      setDepSearch("");
      setShowDepDropdown(false);
      setError(null);
      setIsEditing(false);
      setShowDeleteConfirm(false);

      getTaskDetailAction(projectId, task.id).then((r) => {
        if (r.data) setDetail(r.data);
      });
    } else {
      dialogRef.current?.close();
      setDetail(null);
    }
  }, [task]);

  function handleClose() {
    setShowDeleteConfirm(false);
    onClose();
  }

  function handleCancelEdit() {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setAssignee(task.assignee ?? "");
    setStatus(task.status);
    setDependencies(task.dependencies);
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    if (!task) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTaskAction(projectId, task.id, {
        title: title.trim() || undefined,
        description: description.trim() || null,
        assignee: assignee.trim() || null,
        dependencies,
      });
      if (result.error || !result.data) {
        setError(result.error ?? "エラーが発生しました");
      } else {
        onUpdated(result.data);
        setIsEditing(false);
      }
    });
  }

  function handleDelete() {
    if (!task) return;
    startTransition(async () => {
      const result = await deleteTaskAction(projectId, task.id);
      if (result.error) {
        setError(result.error);
        setShowDeleteConfirm(false);
      } else {
        onDeleted(task.id);
        handleClose();
      }
    });
  }

  function handleCommentAdded(comment: Comment) {
    setDetail((prev) => prev ? { ...prev, comments: [...prev.comments, comment] } : prev);
  }

  const addDependency = useCallback((id: string) => {
    setDependencies((prev) => prev.includes(id) ? prev : [...prev, id]);
    setDepSearch("");
    setShowDepDropdown(false);
    depInputRef.current?.focus();
  }, []);

  const removeDependency = useCallback((id: string) => {
    setDependencies((prev) => prev.filter((d) => d !== id));
  }, []);

  const otherTasks = allTasks.filter((t) => t.id !== task?.id);
  const depTasks = otherTasks.filter((t) => dependencies.includes(t.id));
  const depCandidates = otherTasks.filter(
    (t) => !dependencies.includes(t.id) &&
      t.title.toLowerCase().includes(depSearch.toLowerCase())
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="w-[90vw] h-[85vh] m-auto rounded-xl shadow-2xl p-0 backdrop:bg-black/40 open:flex open:flex-col bg-white dark:bg-gray-800"
    >
      {task && (
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">タスク詳細</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">✕</button>
          </div>

          {/* 2カラムコンテンツ */}
          <div className="flex flex-1 min-h-0">
            {/* 左列: タスク詳細 */}
            <div className="flex flex-col flex-1 min-w-0 border-r border-gray-100 dark:border-gray-700">
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">タイトル</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={255}
                        autoFocus
                        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ステータス</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Status)}
                        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">担当者</label>
                      <input
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        maxLength={64}
                        placeholder="未設定"
                        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">説明</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={10000}
                        rows={4}
                        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>

                    {otherTasks.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">依存タスク</label>
                        {depTasks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {depTasks.map((t) => (
                              <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2 py-0.5">
                                <span className="truncate max-w-[140px]">{t.title}</span>
                                <button type="button" onClick={() => removeDependency(t.id)} className="shrink-0 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 leading-none">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <input
                          ref={depInputRef}
                          type="text"
                          value={depSearch}
                          onChange={(e) => {
                            setDepSearch(e.target.value);
                            if (depInputRef.current) {
                              const r = depInputRef.current.getBoundingClientRect();
                              setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                            }
                            setShowDepDropdown(true);
                          }}
                          onFocus={() => {
                            if (depInputRef.current) {
                              const r = depInputRef.current.getBoundingClientRect();
                              setDropdownRect({ top: r.bottom + 4, left: r.left, width: r.width });
                            }
                            setShowDepDropdown(true);
                          }}
                          onBlur={() => setTimeout(() => setShowDepDropdown(false), 150)}
                          placeholder="タスク名で検索して追加..."
                          className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">タイトル</p>
                      <p className="text-sm text-gray-800 dark:text-gray-100">{task.title}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ステータス</p>
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">担当者</p>
                      <p className="text-sm text-gray-800 dark:text-gray-100">
                        {task.assignee ?? <span className="text-gray-400 dark:text-gray-500">未設定</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">説明</p>
                      {task.description ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-100">
                          <ReactMarkdown>{task.description}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500">なし</p>
                      )}
                    </div>

                    {depTasks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">依存タスク</p>
                        <div className="space-y-1">
                          {depTasks.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onSelectTask(t)}
                              className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                            >
                              <span className="text-xs text-blue-600 dark:text-blue-400 group-hover:underline truncate">{t.title}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{STATUS_LABELS[t.status]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* フッター */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 shrink-0">
                {error && <p className="text-xs text-red-500 flex-1">{error}</p>}
                {!error && <div className="flex-1" />}

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">削除しますか？</span>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40"
                    >
                      削除する
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : isEditing ? (
                  <>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 px-2 py-1 rounded transition-colors"
                    >
                      削除
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isPending || !title.trim()}
                      className="text-sm px-4 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPending ? "保存中..." : "保存"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 px-2 py-1 rounded transition-colors"
                    >
                      削除
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      閉じる
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm px-4 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      編集
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 右列: コメント */}
            <div className="w-[420px] shrink-0 flex flex-col min-h-0 px-4 py-4">
              <CommentSection
                taskId={task.id}
                projectId={projectId}
                comments={detail?.comments ?? []}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </div>
        </div>
      )}

      {/* 依存タスクドロップダウン（overflow clipping回避のためfixedで描画） */}
      {showDepDropdown && depCandidates.length > 0 && (
        <ul
          style={{ position: "fixed", top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
          className="z-50 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto"
        >
          {depCandidates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onMouseDown={() => addDependency(t.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{t.title}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{STATUS_LABELS[t.status]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  );
}
