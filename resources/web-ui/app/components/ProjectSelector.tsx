"use client";

import { useRouter } from "next/navigation";

interface Props {
  projects: string[];
  currentProject: string | null;
}

export default function ProjectSelector({ projects, currentProject }: Props) {
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <span className="text-sm text-gray-400 dark:text-gray-500">プロジェクトなし</span>
    );
  }

  return (
    <select
      value={currentProject ?? ""}
      onChange={(e) => router.push(`/?project=${encodeURIComponent(e.target.value)}`)}
      className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
    >
      {projects.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
}
