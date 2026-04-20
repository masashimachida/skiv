import { listAllTasksAction, listProjectsAction } from "../actions/task.actions";
import KanbanBoard from "./components/KanbanBoard";
import ProjectSelector from "./components/ProjectSelector";

interface Props {
  searchParams: Promise<{ project?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const { project } = await searchParams;

  const projectsResult = await listProjectsAction();
  const projects = projectsResult.data ?? [];

  const currentProject = project ?? projects[0] ?? null;
  const tasks = currentProject
    ? (await listAllTasksAction(currentProject)).data ?? []
    : [];

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <header className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shrink-0">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Task Manager</h1>
        <ProjectSelector projects={projects} currentProject={currentProject} />
      </header>
      {currentProject ? (
        <KanbanBoard key={currentProject} initialTasks={tasks} projectId={currentProject} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          プロジェクトがありません。MCPサーバーからタスクを作成してください。
        </div>
      )}
    </main>
  );
}
