# TaskFlow

TaskFlow is a full-stack workspace and task management app with a Django backend and a Vite + React frontend. It supports department-scoped workspaces, tasks, projects, meetings, members, and demo/auth flows.

## Tech Stack

- Backend: Django, Django REST Framework, django-cors-headers
- Frontend: React, TypeScript, Vite, Tailwind CSS, Radix UI
- Database: SQLite (default for local development)

## Project Structure

```text
.
|-- backend/        # Django project
|   |-- accounts/   # Core app models, serializers, views, URLs
|   |-- config/     # Django settings and project config
|   `-- manage.py
|-- frontend/       # Vite + React app
|   |-- src/
|   `-- package.json
|-- requirements.txt
`-- README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Backend Setup

1. Create and activate a virtual environment:

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate
```

2. Install Python dependencies:

```powershell
pip install -r ..\requirements.txt
```

3. Create a `backend/.env` file if needed:

```env
GOOGLE_CLIENT_ID=your-google-client-id
```

4. Apply migrations:

```powershell
python manage.py migrate
```

5. Start the backend server:

```powershell
python manage.py runserver 8080
```

The backend runs at `http://localhost:8080`.

## Frontend Setup

1. Open a new terminal:

```powershell
cd frontend
```

2. Install dependencies:

```powershell
npm install
```

3. Start the frontend dev server:

```powershell
npm run dev
```

The frontend usually runs at `http://localhost:5173`.

## Running the App

For local development, run both:

- Django backend on `http://localhost:8080`
- Vite frontend on `http://localhost:5173`

The Django settings already allow CORS and CSRF for these local origins.

## Useful Commands

### Backend

```powershell
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py test
```

### Frontend

```powershell
npm run dev
npm run build
npm run lint
npm run test
```

## Notes

- `db.sqlite3` is used for local development.
- Virtual environments are ignored through `.gitignore`.
- The frontend keeps its JavaScript dependencies in `frontend/package.json`, while Python dependencies are listed in `requirements.txt`.
