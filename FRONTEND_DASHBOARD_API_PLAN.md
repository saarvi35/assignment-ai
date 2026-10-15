# Frontend Dashboard API Plan

This file maps the frontend requirements to the available backend APIs.
It is based on the custom dashboard description shared in chat and the backend API documentation.

## App Flow

### Public Pages

#### 1. Home Page
- Purpose: Landing page with `Login` and `Sign Up (Register)` buttons.
- APIs:
  - No API required for basic UI.
  - `POST /api/login/` for login submit.
  - `POST /api/register/` for signup/register submit.

#### 2. Auth Resolution After Login
- Purpose: After login, detect user permissions and route to the correct dashboard.
- APIs:
  - `POST /api/login/`
  - `GET /api/current-user/`
- Routing rules:
  - If `permissions.can_manage_company === true`, open `Owner Dashboard`.
  - Else if `permissions.can_manage_users === true`, open `Manager Dashboard`.
  - Else if `permissions.can_manage_hr === true`, open `HR Dashboard`.
  - Else if `permissions.can_view_assigned_tasks === true`, open `Employee Dashboard`.
  - Else if `permissions.can_view_project_progress === true`, open `Client Dashboard`.

## Shared UI Rules

- All list pages should show only basic attributes in the listing view.
- Clicking an item should open a detail page or side panel.
- Detail page should show richer information and action buttons according to permission.
- Edit buttons should open forms prefilled with current data.
- Delete actions should have a confirmation modal.
- Charts should be visually rich and non-basic, but still data-driven from available APIs.

## Owner Dashboard

### Permission Gate
- Required permission: `can_manage_company`

### Owner Navigation
- Analytics
- Roles
- Users
- Projects
- Tasks
- Company Settings

### 1. Analytics Page
- Required UI:
  - Company analytics cards
  - Employee, project, task, client counts
  - Graphs/charts
  - Recent activity tabs
- APIs:
  - `GET /api/overview/`
  - `GET /api/task-analytics/`
  - `GET /api/all-projects/`
  - `GET /api/all-tasks/`
  - `GET /api/users/`
- Data mapping:
  - Employee count: `GET /api/overview/` or length of `GET /api/users/`
  - Project count: `GET /api/overview/` or length of `GET /api/all-projects/`
  - Task count: `GET /api/overview/`
  - Client count: `GET /api/overview/`
  - Charts:
    - Task completion chart from `GET /api/overview/` and `GET /api/task-analytics/`
    - Project progress chart from `GET /api/all-projects/`
    - Task status distribution from `GET /api/all-tasks/`
- Backend gap:
  - No dedicated `recent activity` API is documented.
  - Recent activity will need to be inferred from latest projects/tasks using `created_at` where available.

### 2. Roles Page
- Required UI:
  - Create role form
  - Roles list with basic fields
  - Role detail page
  - Edit role form
  - Delete role action
- APIs:
  - `GET /api/roles/`
  - `POST /api/roles/`
  - `GET /api/roles/{id}/`
  - `PUT /api/roles/{id}/`
  - `PATCH /api/roles/{id}/`
  - `DELETE /api/roles/{id}/`
- Suggested basic list fields:
  - `name`
  - `slug`
  - `level`

### 3. Users Page
- Required UI:
  - Create user form
  - User list with basic fields
  - User detail page
  - Edit user form
  - Delete user action
- APIs:
  - `GET /api/users/`
  - `POST /api/create-user/`
  - `PATCH /api/update-user/{user_id}/`
  - `DELETE /api/delete-user/{user_id}/`
  - `GET /api/roles/` for role dropdown
  - `GET /api/current-user/` if needed for company/user context
- Suggested basic list fields:
  - `name`
  - `email`
  - `role`
  - `status`

### 4. Projects Page
- Required UI:
  - Create project form
  - Company projects list with basic fields
  - Project detail page
  - Edit project form
  - Delete project action
- APIs:
  - `GET /api/projects/`
  - `POST /api/projects/`
  - `GET /api/projects/{id}/`
  - `PUT /api/projects/{id}/`
  - `PATCH /api/projects/{id}/`
  - `DELETE /api/projects/{id}/`
  - `GET /api/users/` for manager/client selections if these users are exposed there
- Suggested basic list fields:
  - `name`
  - `status`
  - `priority`
  - `progress`
  - `end_date`

### 5. Tasks Page
- Required UI:
  - Create task form
  - Task list sectioned by project
  - Task detail page
  - Edit task form
  - Delete task action
- APIs:
  - `GET /api/tasks/`
  - `POST /api/tasks/`
  - `GET /api/tasks/{id}/`
  - `PUT /api/tasks/{id}/`
  - `PATCH /api/tasks/{id}/`
  - `DELETE /api/tasks/{id}/`
  - `GET /api/projects/` for project grouping/filtering
  - `GET /api/users/` for assignee dropdown
- Suggested basic list fields:
  - `title`
  - `assigned_to_name`
  - `status`
  - `priority`
  - `due_date`

### 6. Company Settings Page
- Required UI:
  - Display company details
  - Edit company details
- APIs:
  - `GET /api/companies/`
  - `GET /api/companies/{id}/`
  - `PUT /api/companies/{id}/`
  - `PATCH /api/companies/{id}/`
- Backend gap:
  - The current user response does not include `company_id`.
  - Frontend may need company context from login payload, app state, or a convention such as selecting the first company from `GET /api/companies/`.

## Manager Dashboard

### Permission Gate
- Required permission: `can_manage_users`

### Manager Navigation
- Analytics
- Users
- Projects
- Tasks
- Attendance & Leave

### 1. Analytics Page
- Required UI:
  - Count of employees, projects, tasks, clients
  - Graphs/charts
  - Recent activity tabs
  - Tasks assigned under manager's name
- APIs:
  - `GET /api/manager-overview/`
  - `GET /api/manager-projects/`
  - `GET /api/all-tasks/`
  - `GET /api/users/`
  - `GET /api/current-user/`
- Data mapping:
  - Projects: `GET /api/manager-overview/` and `GET /api/manager-projects/`
  - Tasks: `GET /api/manager-overview/` and `GET /api/all-tasks/`
  - Tasks under manager: filter `GET /api/all-tasks/` where manager-created or manager-owned logic fits frontend assumptions
- Backend gap:
  - No direct manager-clients count API.
  - No direct recent activity API.
  - Exact rule for "tasks assigned under his name" may need backend clarification if it means `assigned_to`, `created_by`, or tasks inside his managed projects.

### 2. Users Page
- Required UI:
  - User list
  - User detail page
  - Edit user form
- APIs:
  - `GET /api/users/`
  - `PATCH /api/update-user/{user_id}/`
  - `GET /api/roles/` for role selection
- Suggested basic list fields:
  - `name`
  - `email`
  - `role`
  - `status`

### 3. Projects Page
- Required UI:
  - Create project form
  - List of projects where manager is assigned
  - Project detail page
  - Edit project form
  - Delete project action
- APIs:
  - `GET /api/manager-projects/`
  - `GET /api/projects/`
  - `POST /api/projects/`
  - `GET /api/projects/{id}/`
  - `PUT /api/projects/{id}/`
  - `PATCH /api/projects/{id}/`
  - `DELETE /api/projects/{id}/`
- Notes:
  - `GET /api/manager-projects/` is best for listing.
  - Full edit/detail should use `/api/projects/{id}/`.

### 4. Tasks Page
- Required UI:
  - Create task form
  - Task list sectioned by project
  - Task detail page
  - Edit task form
  - Delete task action
- APIs:
  - `GET /api/tasks/`
  - `GET /api/all-tasks/`
  - `POST /api/tasks/`
  - `GET /api/tasks/{id}/`
  - `PUT /api/tasks/{id}/`
  - `PATCH /api/tasks/{id}/`
  - `DELETE /api/tasks/{id}/`
  - `GET /api/manager-projects/`

### 5. Attendance & Leave Page
- Required UI:
  - Check-in button
  - Check-out button
  - Weekly attendance list for self
  - Attendance chart
  - Apply leave form
  - Leave list
- APIs:
  - `POST /api/attendance/checkin/`
  - `POST /api/attendance/checkout/`
  - `GET /api/attendance/`
  - `POST /api/leave/apply/`
  - `GET /api/my-leaves/`
- Notes:
  - Weekly view can be created by frontend filtering `GET /api/attendance/`.

## HR Dashboard

### Permission Gate
- Required permission: `can_manage_hr`

### HR Navigation
- Analytics
- Roles
- Users
- Attendance
- Leaves

### 1. Analytics Page
- Required UI:
  - HR analytics
  - Rich charts of attendance and leave data
- APIs:
  - `GET /api/hr-dashboard/`
  - `GET /api/users/`
  - `GET /api/team-leaves/`
- Data mapping:
  - Main source: `GET /api/hr-dashboard/`
  - Supplementary details: `GET /api/users/`, `GET /api/team-leaves/`

### 2. Roles Page
- Required UI:
  - Create role form
  - Roles list
  - Role detail page
  - Edit role form
  - Delete role action
- APIs:
  - `GET /api/roles/`
  - `POST /api/roles/`
  - `GET /api/roles/{id}/`
  - `PUT /api/roles/{id}/`
  - `PATCH /api/roles/{id}/`
  - `DELETE /api/roles/{id}/`

### 3. Users Page
- Required UI:
  - Create user form
  - User list
  - User detail page
  - Edit user form
  - Delete user action
- APIs:
  - `GET /api/users/`
  - `POST /api/create-user/`
  - `PATCH /api/update-user/{user_id}/`
  - `DELETE /api/delete-user/{user_id}/`
  - `GET /api/roles/`
  - `GET /api/departments/`

### 4. Attendance Page
- Required UI:
  - All employees attendance lists
  - Attendance analysis with graphs/charts
  - Performance review form/actions
- APIs:
  - `GET /api/hr-dashboard/`
  - `GET /api/attendance/`
  - `GET /api/users/`
  - `POST /api/review/{employee_id}/`
- Backend gap:
  - `GET /api/attendance/` is documented as `MyAttendanceAPI`.
  - If backend truly returns only self attendance, HR all-employee attendance will need a new dedicated HR attendance API.
  - This is an important clarification point before implementation.

### 5. Leaves Page
- Required UI:
  - Leave list
  - Approve button
  - Reject button
- APIs:
  - `GET /api/team-leaves/`
  - `PATCH /api/leave/{leave_id}/status/`

## Employee Dashboard

### Permission Gate
- Required permission: `can_view_assigned_tasks`

### Employee Navigation
- Projects & Tasks
- Attendance & Leave

### 1. Projects & Tasks Page
- Required UI:
  - Projects in which tasks are assigned to employee
  - Basic project descriptions
  - Tasks list sectioned by project
  - Task detail page
  - Edit task form
- APIs:
  - `GET /api/my-projects/`
  - `GET /api/my-tasks/`
  - `GET /api/tasks/{id}/`
  - `PATCH /api/tasks/{id}/`
- Suggested task list fields:
  - `title`
  - `status`
  - `priority`
  - `due_date`
  - `progress`

### 2. Attendance & Leave Page
- Required UI:
  - Check-in button
  - Check-out button
  - Weekly attendance list
  - Attendance chart
  - Apply leave form
  - Leave list
- APIs:
  - `POST /api/attendance/checkin/`
  - `POST /api/attendance/checkout/`
  - `GET /api/attendance/`
  - `POST /api/leave/apply/`
  - `GET /api/my-leaves/`

## Client Dashboard

### Permission Gate
- Required permission: `can_view_project_progress`

### Client Navigation
- Project Progress

### 1. Project Progress Page
- Required UI:
  - Show only client's projects
  - Progress visuals with charts/graphs
  - Project timeline/status summaries
- APIs:
  - `GET /api/client-projects/`
- Data mapping:
  - Project progress cards
  - Budget vs actual cost chart
  - Timeline chart using `start_date` and `end_date`
  - Status-wise grouping chart

## Cross-Cutting API Helpers

These APIs will likely be reused across multiple dashboards:

- `GET /api/current-user/`
- `GET /api/users/`
- `GET /api/roles/`
- `GET /api/projects/`
- `GET /api/tasks/`
- `GET /api/attendance/`
- `GET /api/my-leaves/`
- `GET /api/team-leaves/`

## Important Gaps To Confirm Before Full Frontend Build

### 1. Recent Activity
- No dedicated recent activity API is documented.
- We can build a simulated recent activity feed from latest tasks/projects if acceptable.

### 2. HR All Employees Attendance
- `GET /api/attendance/` is documented as self attendance.
- HR requirement needs all employees attendance.
- This may require a new backend endpoint or confirmation that current API behaves differently for HR users.

### 3. Company Context
- Company settings page needs a reliable current company id.
- The backend docs do not clearly expose current user's company id in `GET /api/current-user/`.

### 4. Manager Analytics Interpretation
- The meaning of "tasks assigned under his name" needs confirmation.
- It could mean:
  - tasks assigned to the manager,
  - tasks created by the manager,
  - tasks inside the manager's projects.

### 5. Client Count For Manager Analytics
- No dedicated manager client count API is documented.
- This may need to be inferred from projects data or added later.

## Recommended Frontend Build Order

1. Landing page with login/register
2. Auth flow and permission-based routing
3. Shared app shell: sidebar, topbar, cards, chart system
4. Owner dashboard
5. Manager dashboard
6. HR dashboard
7. Employee dashboard
8. Client dashboard

## Design Direction Notes

- UI should not be basic.
- Design should be unique and exact to the described workflows.
- Heavy use of charts, progress visuals, analytics cards, grouped task sections, and rich detail pages is expected.
- The final UI should stay aligned with the shared description rather than generic admin templates.
