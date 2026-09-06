# QuickDo

QuickDo is a lightweight task manager with a focused web interface and a small Node.js backend. Create, edit, complete, filter, and delete tasks while keeping them persisted in a local JSON file.

## Features

- Add tasks from the main input or by pressing Enter
- Mark tasks as complete and review completion progress
- Edit task text inline with keyboard support
- Delete individual tasks or clear completed tasks
- Filter the list by All, Active, or Done
- Persist tasks across browser refreshes and server restarts
- Responsive layout for desktop and mobile screens

## Built With

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js built-in `http`, `fs`, `path`, and `crypto` modules

No external npm dependencies are required.

## Getting Started

### Prerequisites

- Node.js installed locally

### Run locally

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Start the server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in a browser.

The server uses port `3000` by default. Set the `PORT` environment variable to use another port.

```powershell
$env:PORT=4000
npm start
```

Tasks are stored in `tasks.json`, which is created or updated by the server as changes are made.

## API Reference

All API responses use JSON.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | Return all tasks |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update task text or completion state |
| `DELETE` | `/api/tasks/:id` | Delete one task |
| `DELETE` | `/api/tasks?completed=true` | Delete all completed tasks |

### Request examples

Create a task:

```json
{
  "text": "Prepare the project update"
}
```

Update a task:

```json
{
  "done": true
}
```

Tasks returned by the API have this shape:

```json
{
  "id": "task-id",
  "text": "Prepare the project update",
  "done": false
}
```

## Project Structure

```text
.
├── todolist.html   # Application entry point
├── style.css       # Layout and visual styles
├── script.js       # Client-side task interactions
├── server.js       # Static file server and task API
├── tasks.json      # Local task data
├── package.json    # Project metadata and start script
└── README.md       # Project documentation
```

## Development Notes

- Run `npm start` whenever you work on the application so the frontend can reach the task API.
- The backend validates task text and returns JSON errors for invalid requests.
- Changes to `tasks.json` are persistent and may appear in version control. Decide whether local task data should be committed before opening a pull request.

## Contributing

Bug reports, improvements, and feature proposals are welcome. For a change:

1. Create a feature branch.
2. Make the change and verify it locally.
3. Open a pull request with a clear description of the behavior changed.

## License

QuickDo is intended for personal, non-commercial use. No formal license file is currently included in this repository; add one before redistributing the project or using it under explicit open-source terms.
