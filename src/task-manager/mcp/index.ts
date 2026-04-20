import "../lib/db";
import { startServer } from "./server";

const projectId = process.env.TASK_PROJECT_ID;
if (!projectId) {
  console.error("Error: TASK_PROJECT_ID environment variable is not set.");
  process.exit(1);
}

startServer(projectId).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
