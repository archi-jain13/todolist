let tasks = [];
let filter = "All";
let editingId = null;

const STORAGE_KEY = "quickdo_tasks";

const listEl = document.getElementById("task-list");
const formEl = document.getElementById("task-form");
const inputEl = document.getElementById("task-input");
const countPill = document.getElementById("count-pill");
const listFooter = document.getElementById("list-footer");
const doneSummary = document.getElementById("done-summary");
const clearBtn = document.getElementById("clear-completed");

function getLocalTasks() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function saveLocalTasks(tasksToSave) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (e) {
        console.error("Failed to save tasks to local storage", e);
    }
}

async function api(path, options = {}) {
    try {
        const response = await fetch(path, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "The server request failed");
        }
        return await response.json();
    } catch (e) {
        console.warn("API request failed:", path, e);
        return null;
    }
}

async function loadTasks() {
    const cached = getLocalTasks();
    if (cached) {
        tasks = cached;
        render();
    }

    try {
        const remoteTasks = await api("/api/tasks");
        if (Array.isArray(remoteTasks) && remoteTasks.length > 0) {
            tasks = remoteTasks;
            saveLocalTasks(tasks);
            render();
        } else if (!cached) {
            tasks = [];
            render();
        }
    } catch (error) {
        console.warn("API load failed, falling back to local storage", error);
        if (!cached) {
            tasks = [];
            render();
        }
    }
}

async function addTask() {
    const text = inputEl.value.trim();
    if (!text) return;

    const newTask = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        text,
        done: false,
    };

    tasks.unshift(newTask);
    inputEl.value = "";
    saveLocalTasks(tasks);
    render();
    inputEl.focus();

    try {
        await api("/api/tasks", {
            method: "POST",
            body: JSON.stringify({ id: newTask.id, text }),
        });
    } catch (error) {
        console.warn("API addTask failed, task saved locally", error);
    }
}

async function toggleTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    task.done = !task.done;
    saveLocalTasks(tasks);
    render();

    try {
        await api(`/api/tasks/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ done: task.done }),
        });
    } catch (error) {
        console.warn("API toggleTask failed, changes saved locally", error);
    }
}

async function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveLocalTasks(tasks);
    render();

    try {
        await api(`/api/tasks/${id}`, { method: "DELETE" });
    } catch (error) {
        console.warn("API deleteTask failed, deleted locally", error);
    }
}

function startEdit(id) {
    editingId = id;
    render();
}

async function commitEdit(id, value) {
    const text = value.trim();
    if (!text) {
        await deleteTask(id);
        editingId = null;
        return;
    }

    const task = tasks.find(item => item.id === id);
    if (task) {
        task.text = text;
        saveLocalTasks(tasks);
    }
    editingId = null;
    render();

    try {
        await api(`/api/tasks/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ text }),
        });
    } catch (error) {
        console.warn("API commitEdit failed, saved locally", error);
    }
}

function render() {
    const visible = tasks.filter(task => {
        if (filter === "Active") return !task.done;
        if (filter === "Done") return task.done;
        return true;
    });
    const activeCount = tasks.filter(task => !task.done).length;
    const doneCount = tasks.length - activeCount;

    countPill.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"}`;
    listEl.innerHTML = "";

    if (visible.length === 0) {
        const emptyMessage = tasks.length === 0 ? "Your list is clear. Add one small thing to get moving." : filter === "Done" ? "Nothing finished yet." : "Nothing left to do. Nice work.";
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = emptyMessage;
        listEl.appendChild(empty);
    }

    visible.forEach(task => {
        const row = document.createElement("div");
        row.className = `task-row${task.done ? " done" : ""}`;

        const checkBtn = document.createElement("button");
        checkBtn.className = "check-btn";
        checkBtn.type = "button";
        checkBtn.setAttribute("aria-label", task.done ? "Mark as not done" : "Mark as done");
        checkBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#17171A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        checkBtn.onclick = () => toggleTask(task.id);
        row.appendChild(checkBtn);

        if (editingId === task.id) {
            const editInput = document.createElement("input");
            editInput.className = "task-edit-input";
            editInput.value = task.text;
            editInput.onblur = () => commitEdit(task.id, editInput.value);
            editInput.onkeydown = event => {
                if (event.key === "Enter") commitEdit(task.id, editInput.value);
                if (event.key === "Escape") { editingId = null; render(); }
            };
            row.appendChild(editInput);
            setTimeout(() => { editInput.focus(); editInput.select(); }, 0);
        } else {
            const text = document.createElement("span");
            text.className = "task-text";
            text.textContent = task.text;
            text.ondblclick = () => startEdit(task.id);
            row.appendChild(text);

            const editBtn = document.createElement("button");
            editBtn.className = "icon-btn edit-btn";
            editBtn.type = "button";
            editBtn.setAttribute("aria-label", "Edit task");
            editBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>';
            editBtn.onclick = () => startEdit(task.id);
            row.appendChild(editBtn);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "icon-btn delete-btn";
        deleteBtn.type = "button";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
        deleteBtn.onclick = () => deleteTask(task.id);
        row.appendChild(deleteBtn);
        listEl.appendChild(row);
    });

    listFooter.hidden = tasks.length === 0;
    doneSummary.textContent = `${doneCount} of ${tasks.length} done`;
    clearBtn.hidden = doneCount === 0;
}

formEl.addEventListener("submit", event => {
    event.preventDefault();
    addTask();
});

clearBtn.onclick = async () => {
    tasks = tasks.filter(task => !task.done);
    saveLocalTasks(tasks);
    render();

    try {
        await api("/api/tasks?completed=true", { method: "DELETE" });
    } catch (error) {
        console.warn("API clearCompleted failed, cleared locally", error);
    }
};

document.querySelectorAll(".filter-btn").forEach(button => {
    button.onclick = () => {
        filter = button.dataset.filter;
        document.querySelectorAll(".filter-btn").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        render();
    };
});

loadTasks();