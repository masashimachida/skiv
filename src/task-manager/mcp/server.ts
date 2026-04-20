import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AppError } from "../lib/errors";
import { createTaskHandlers } from "./tools/task.tools";
import { createCommentHandlers } from "./tools/comment.tools";

const TOOLS = [
  {
    name: "create_task",
    description: "Create a new task",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title (required)" },
        status: {
          type: "string",
          enum: ["inbox", "in_progress", "review_requested", "in_review", "done", "cancel", "pending"],
          description: "Initial status (default: inbox)",
        },
        description: { type: "string", description: "Task description" },
        dependencies: {
          type: "array",
          items: { type: "string" },
          description: "List of task IDs this task depends on",
        },
        assignee: { type: "string", description: "Assignee name" },
      },
      required: ["title"],
    },
  },
  {
    name: "get_task",
    description: "Get a task by ID (includes comments)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "list_tasks",
    description: "List tasks with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          oneOf: [
            { type: "string", enum: ["inbox", "in_progress", "review_requested", "in_review", "done", "cancel", "pending"] },
            {
              type: "array",
              items: { type: "string", enum: ["inbox", "in_progress", "review_requested", "in_review", "done", "cancel", "pending"] },
            },
          ],
          description: "Filter by status (single value or array)",
        },
        assignee: { type: "string", description: "Filter by assignee" },
      },
    },
  },
  {
    name: "update_task",
    description: "Update an existing task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
        title: { type: "string", description: "New title" },
        status: {
          type: "string",
          enum: ["inbox", "in_progress", "review_requested", "in_review", "done", "cancel", "pending"],
        },
        description: { type: ["string", "null"], description: "New description (null to clear)" },
        dependencies: {
          oneOf: [
            { type: "array", items: { type: "string" } },
            { type: "null" },
          ],
          description: "Replace all dependencies (null to clear)",
        },
        assignee: { type: ["string", "null"], description: "New assignee (null to clear)" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "add_comment",
    description: "Add a comment to a task",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "Task ID" },
        author: { type: "string", description: "Author name" },
        body: { type: "string", description: "Comment body" },
      },
      required: ["taskId", "author", "body"],
    },
  },
  {
    name: "list_comments",
    description: "List comments for a task",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "Task ID" },
      },
      required: ["taskId"],
    },
  },
] as const;

export async function startServer(projectId: string) {
  const { handleCreateTask, handleGetTask, handleListTasks, handleUpdateTask, handleDeleteTask } = createTaskHandlers(projectId);
  const { handleAddComment, handleListComments } = createCommentHandlers(projectId);

  const handlers: Record<string, (input: unknown) => unknown> = {
    create_task: handleCreateTask,
    get_task: handleGetTask,
    list_tasks: handleListTasks,
    update_task: handleUpdateTask,
    delete_task: handleDeleteTask,
    add_comment: handleAddComment,
    list_comments: handleListComments,
  };

  const server = new Server(
    { name: "task-manager", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = handlers[name];

    if (!handler) {
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: { code: "UNKNOWN_TOOL", message: `Unknown tool: ${name}` } }) }],
      };
    }

    try {
      const result = handler(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    } catch (err) {
      if (err instanceof AppError) {
        return {
          isError: true,
          content: [{ type: "text", text: JSON.stringify({ error: { code: err.code, message: err.message } }) }],
        };
      }
      throw err;
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
