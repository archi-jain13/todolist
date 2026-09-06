const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, "tasks.json");

async function readTasks() {
    try {
        return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }
}

async function writeTasks(tasks) {
    await fs.writeFile(DATA_FILE, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
}

function sendJson(response, status, data) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(data));
}

function sendFile(response, filePath, contentType) {
    fs.readFile(filePath).then(content => {
        response.writeHead(200, { "Content-Type": contentType });
        response.end(content);
    }).catch(() => sendJson(response, 404, { error: "Not found" }));
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", chunk => { body += chunk; });
        request.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error("Request body must be valid JSON"));
            }
        });
        request.on("error", reject);
    });
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/tasks") {
        return sendJson(response, 200, await readTasks());
    }

    if (url.pathname === "/api/tasks") {
        const tasks = await readTasks();

        if (request.method === "POST") {
            const body = await readBody(request);
            const text = typeof body.text === "string" ? body.text.trim() : "";
            if (!text) return sendJson(response, 400, { error: "Task text is required" });

            const task = { id: crypto.randomUUID(), text, done: false };
            tasks.unshift(task);
            await writeTasks(tasks);
            return sendJson(response, 201, task);
        }

        if (request.method === "DELETE" && url.searchParams.get("completed") === "true") {
            const remaining = tasks.filter(task => !task.done);
            await writeTasks(remaining);
            return sendJson(response, 200, remaining);
        }
    }

    const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch) {
        const taskId = taskMatch[1];
        const tasks = await readTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) return sendJson(response, 404, { error: "Task not found" });

        if (request.method === "PATCH") {
            const body = await readBody(request);
            if (typeof body.text === "string") {
                const text = body.text.trim();
                if (!text) return sendJson(response, 400, { error: "Task text is required" });
                tasks[taskIndex].text = text;
            }
            if (typeof body.done === "boolean") tasks[taskIndex].done = body.done;
            await writeTasks(tasks);
            return sendJson(response, 200, tasks[taskIndex]);
        }

        if (request.method === "DELETE") {
            tasks.splice(taskIndex, 1);
            await writeTasks(tasks);
            return sendJson(response, 200, { ok: true });
        }
    }

    if (request.method === "GET") {
        const files = {
            "/": ["todolist.html", "text/html; charset=utf-8"],
            "/todolist.html": ["todolist.html", "text/html; charset=utf-8"],
            "/script.js": ["script.js", "text/javascript; charset=utf-8"],
            "/style.css": ["style.css", "text/css; charset=utf-8"],
        };
        const file = files[url.pathname];
        if (file) return sendFile(response, path.join(__dirname, file[0]), file[1]);
    }

    sendJson(response, 404, { error: "Not found" });
});

server.listen(PORT, () => {
    console.log(`QuickDo backend running at http://localhost:${PORT}`);
});