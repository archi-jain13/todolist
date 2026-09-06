const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

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

  if (request.method === "GET" && url.pathname === "/api/tasks") {
    return sendJson(response, 200, await readTasks());
  }

  if (url.pathname === "/api/tasks") {
    const tasks = await readTasks();

    if (request.method === "POST") {
      try {
        const body = await readBody(request);
        const text = typeof body.text === "string" ? body.text.trim() : "";

        if (!text) {
          return sendJson(response, 400, { error: "Task text is required" });
        }

        const task = { id: crypto.randomUUID(), text, done: false };
        tasks.unshift(task);
        await writeTasks(tasks);
        return sendJson(response, 201, task);
      } catch (error) {
        return sendJson(response, 400, { error: error.message || "Invalid request body" });
      }
    }

    if (request.method === "DELETE" && url.searchParams.get("completed") === "true") {
      const remaining = tasks.filter((task) => !task.done);
      await writeTasks(remaining);
      return sendJson(response, 200, remaining);
    }
  }

  return sendJson(response, 404, { error: "Not found" });
};
