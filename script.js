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

function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        tasks = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load from localStorage", e);
        tasks = [];
    }
    render();
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error("Failed to save to localStorage", e);
    }
}

function addTask() {
    const text = inputEl.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        text,
        done: false,
    };

    tasks.unshift(newTask);
    inputEl.value = "";
    saveTasks();
    render();
    inputEl.focus();
}

function toggleTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    task.done = !task.done;
    saveTasks();
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
}

function startEdit(id) {
    editingId = id;
    render();
}

function commitEdit(id, value) {
    const text = value.trim();
    if (!text) {
        deleteTask(id);
        editingId = null;
        return;
    }

    const task = tasks.find(item => item.id === id);
    if (task) {
        task.text = text;
        saveTasks();
    }
    editingId = null;
    render();
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
        const emptyMessage = tasks.length === 0 
            ? "Your list is clear. Add one small thing to get moving." 
            : filter === "Done" 
                ? "Nothing finished yet." 
                : "Nothing left to do. Nice work.";
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

clearBtn.onclick = () => {
    tasks = tasks.filter(task => !task.done);
    saveTasks();
    render();
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