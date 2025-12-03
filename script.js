const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

// Load tasks from localStorage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    taskList.innerHTML = "";
    tasks.forEach(({ text, completed }) => {
        addTaskToDOM(text, completed);
    });
}

// Save tasks to localStorage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        tasks.push({
            text: li.childNodes[0].nodeValue,
            completed: li.classList.contains("completed")
        });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add task to DOM
function addTaskToDOM(taskText, completed = false) {
    const li = document.createElement("li");
    li.textContent = taskText;
    if (completed) li.classList.add("completed");

    li.addEventListener("click", () => {
        li.classList.toggle("completed");
        saveTasks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        li.remove();
        saveTasks();
    });

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

// Add new task
addBtn.addEventListener("click", () => {
    const taskText = taskInput.value.trim();
    if (taskText !== "") {
        addTaskToDOM(taskText);
        saveTasks();
        taskInput.value = "";
    }
});

// Load tasks on page load
window.addEventListener("DOMContentLoaded", loadTasks);