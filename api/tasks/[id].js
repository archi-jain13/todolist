const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_FILE = process.env.VERCEL
  ? path.join("/tmp", "quickdo-tasks.json")
  : path.join(process.cwd(), "tasks.json");

async function readTasks() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeTasks(tasks) {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
}

function sendJson(response, status, data) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}

module.exports = async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || "localhost"}`);
  const taskId = url.pathname.split("/").filter(Boolean).pop();

  if (!taskId) {
    return sendJson(response, 404, { error: "Task not found" });
  }

  const tasks = await readTasks();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return sendJson(response, 404, { error: "Task not found" });
  }

  if (request.method === "PATCH") {
    try {
      const body = await readBody(request);

      if (typeof body.text === "string") {
        const text = body.text.trim();
        if (!text) {
          return sendJson(response, 400, { error: "Task text is required" });
        }
        tasks[taskIndex].text = text;
      }

      if (typeof body.done === "boolean") {
        tasks[taskIndex].done = body.done;
      }

      await writeTasks(tasks);
      return sendJson(response, 200, tasks[taskIndex]);
    } catch (error) {
      return sendJson(response, 400, { error: error.message || "Invalid request body" });
    }
  }

  if (request.method === "DELETE") {
    tasks.splice(taskIndex, 1);
    await writeTasks(tasks);
    return sendJson(response, 200, { ok: true });
  }

  return sendJson(response, 404, { error: "Not found" });
};
