# Task Management API

A simple REST API for managing tasks, built with **FastAPI**, **SQLAlchemy** and **SQLite**.

## Features

- Create, list, view, update and delete tasks
- Input validation with clear error messages
- Task status limited to `pending`, `in_progress` or `completed`
- Automatic interactive docs (Swagger UI)
- Zero-setup database: a single SQLite file, created on first run

## Project structure

```
backend/
├── requirements.txt
└── app/
    ├── __init__.py   # marks app as a package
    ├── main.py       # entry point: creates the app and tables, includes the router
    ├── database.py   # SQLite engine, session factory, get_db() dependency
    ├── models.py     # Task table definition (SQLAlchemy)
    ├── schemas.py    # request/response validation (Pydantic)
    └── routes.py     # the /tasks endpoints
```

## Getting started

Requires Python 3.10+. Run these from the `backend/` folder (PowerShell on Windows):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On macOS/Linux, activate with `source .venv/bin/activate` instead.

The API runs at <http://127.0.0.1:8000>, and interactive docs are at <http://127.0.0.1:8000/docs>.
The database file `tasks.db` is created in `backend/` on first start.

## Task fields

| Field         | Type     | Notes                                                    |
|---------------|----------|----------------------------------------------------------|
| `id`          | integer  | Auto-generated                                           |
| `title`       | string   | Required, 1-200 characters (whitespace is trimmed)       |
| `description` | string   | Optional, up to 2000 characters                          |
| `status`      | string   | `pending` (default), `in_progress` or `completed`        |
| `created_at`  | datetime | Set automatically, UTC                                   |

## Endpoints

| Method | Path               | Description        | Success         | Errors     |
|--------|--------------------|--------------------|-----------------|------------|
| POST   | `/tasks`           | Create a task      | `201` + task    | `422`      |
| GET    | `/tasks`           | List all tasks     | `200` + list    | -          |
| GET    | `/tasks/{task_id}` | Get one task       | `200` + task    | `404`      |
| PUT    | `/tasks/{task_id}` | Update a task      | `200` + task    | `404`, `422` |
| DELETE | `/tasks/{task_id}` | Delete a task      | `204` no body   | `404`      |

`PUT` is a partial update: send only the fields you want to change.

## Example requests

Create a task:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/tasks `
  -ContentType "application/json" `
  -Body '{"title":"Write docs","description":"Finish the README"}'
```

Mark it completed:

```powershell
Invoke-RestMethod -Method Put -Uri http://127.0.0.1:8000/tasks/1 `
  -ContentType "application/json" `
  -Body '{"status":"completed"}'
```

Or with curl:

```bash
curl -X POST http://127.0.0.1:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write docs"}'
```

## Error responses

Missing tasks return `404`:

```json
{"detail": "Task 999 not found"}
```

Invalid input returns `422`, naming the field and the problem:

```json
{
  "detail": [
    {
      "loc": ["body", "status"],
      "msg": "Input should be 'pending', 'in_progress' or 'completed'"
    }
  ]
}
```
