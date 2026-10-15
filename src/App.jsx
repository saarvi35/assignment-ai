import { useMemo, useState } from "react";
import { apiRegistry, initialData } from "./mockData";

const roleHome = {
  owner: "analytics",
  manager: "analytics",
  hr: "analytics",
  employee: "projects-tasks",
  client: "progress",
};

const roleMenu = {
  owner: [
    { id: "analytics", label: "Analytics" },
    { id: "roles", label: "Roles" },
    { id: "users", label: "Users" },
    { id: "projects", label: "Projects" },
    { id: "tasks", label: "Tasks" },
    { id: "settings", label: "Company Settings" },
  ],
  manager: [
    { id: "analytics", label: "Analytics" },
    { id: "users", label: "Users" },
    { id: "projects", label: "Projects" },
    { id: "tasks", label: "Tasks" },
    { id: "attendance-leave", label: "Attendance & Leave" },
  ],
  hr: [
    { id: "analytics", label: "Analytics" },
    { id: "roles", label: "Roles" },
    { id: "users", label: "Users" },
    { id: "attendance", label: "Attendance" },
    { id: "leaves", label: "Leaves" },
  ],
  employee: [
    { id: "projects-tasks", label: "Projects & Tasks" },
    { id: "attendance-leave", label: "Attendance & Leave" },
  ],
  client: [{ id: "progress", label: "Project Progress" }],
};

const demoAccounts = [
  { email: "owner@acmepulse.com", role: "Owner" },
  { email: "manager@acmepulse.com", role: "Manager" },
  { email: "hr@acmepulse.com", role: "HR" },
  { email: "employee@acmepulse.com", role: "Employee" },
  { email: "client@nexa.com", role: "Client" },
];

function App() {
  const [store, setStore] = useState(initialData);
  const [sessionUserId, setSessionUserId] = useState(1);
  const [authMode, setAuthMode] = useState("login");
  const [route, setRoute] = useState({ type: "home" });
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");

  const currentUser = store.users.find((user) => user.id === sessionUserId) ?? null;
  const currentRole = store.roles.find((role) => role.id === currentUser?.roleId) ?? null;
  const currentCompany = store.companies.find((company) => company.id === currentUser?.companyId) ?? null;

  const currentDashboard = useMemo(() => {
    if (!currentRole) return null;
    if (currentRole.can_manage_company) return "owner";
    if (currentRole.can_manage_users && !currentRole.can_manage_company && !currentRole.can_manage_hr) return "manager";
    if (currentRole.can_manage_hr) return "hr";
    if (currentRole.can_view_assigned_tasks) return "employee";
    if (currentRole.can_view_project_progress) return "client";
    return "employee";
  }, [currentRole]);

  const openDashboard = (dashboardKey) => {
    setRoute({ type: "dashboard", dashboard: dashboardKey, page: roleHome[dashboardKey] });
    setSelectedId(null);
    setEditing(null);
  };

  const updateEntity = (collection, item) => {
    setStore((prev) => ({
      ...prev,
      [collection]: prev[collection].map((entry) => (entry.id === item.id ? { ...entry, ...item } : entry)),
    }));
    setToast(`${collection.slice(0, -1)} updated`);
  };

  const createEntity = (collection, item) => {
    setStore((prev) => ({
      ...prev,
      [collection]: [...prev[collection], item],
    }));
    setToast(`${collection.slice(0, -1)} created`);
  };

  const deleteEntity = (collection, id) => {
    setStore((prev) => ({
      ...prev,
      [collection]: prev[collection].filter((entry) => entry.id !== id),
    }));
    setSelectedId(null);
    setEditing(null);
    setToast(`${collection.slice(0, -1)} deleted`);
  };

  const handleLogin = (email) => {
    const user = store.users.find((entry) => entry.email === email);
    if (!user) {
      setToast("Demo account not found");
      return;
    }
    setSessionUserId(user.id);
    const role = store.roles.find((entry) => entry.id === user.roleId);
    setToast(`Logged in as ${user.name}`);
    if (role?.can_manage_company) openDashboard("owner");
    else if (role?.can_manage_users && !role?.can_manage_hr) openDashboard("manager");
    else if (role?.can_manage_hr) openDashboard("hr");
    else if (role?.can_view_assigned_tasks) openDashboard("employee");
    else openDashboard("client");
  };

  const handleRegister = (payload) => {
    const role = store.roles.find((entry) => entry.name === "OWNER");
    const nextUserId = Math.max(...store.users.map((user) => user.id)) + 1;
    const nextCompanyId = Math.max(...store.companies.map((company) => company.id)) + 1;
    const company = {
      id: nextCompanyId,
      name: payload.companyName,
      email: payload.companyEmail,
      phone: payload.phone,
      size: payload.size,
      address: payload.address,
      logo: null,
      owner: nextUserId,
      last_user_number: 1,
    };
    const user = {
      id: nextUserId,
      name: payload.ownerName,
      email: payload.ownerEmail,
      role: "OWNER",
      roleId: role.id,
      level: role.level,
      status: "ACTIVE",
      companyId: company.id,
    };
    setStore((prev) => ({
      ...prev,
      companies: [...prev.companies, company],
      users: [...prev.users, user],
    }));
    setSessionUserId(user.id);
    setToast("Registered and redirected to owner dashboard");
    openDashboard("owner");
  };

  return (
    <div className="app-shell">
      {route.type === "home" ? (
        <HomePage authMode={authMode} setAuthMode={setAuthMode} onLogin={handleLogin} onRegister={handleRegister} />
      ) : (
        <DashboardApp
          route={route}
          setRoute={setRoute}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          editing={editing}
          setEditing={setEditing}
          currentUser={currentUser}
          currentRole={currentRole}
          currentCompany={currentCompany}
          currentDashboard={currentDashboard}
          store={store}
          updateEntity={updateEntity}
          createEntity={createEntity}
          deleteEntity={deleteEntity}
          onLogout={() => setRoute({ type: "home" })}
          onOpenRoleDashboard={() => currentDashboard && openDashboard(currentDashboard)}
        />
      )}
      {toast ? (
        <button className="toast" onClick={() => setToast("")}>
          {toast}
        </button>
      ) : null}
    </div>
  );
}

function HomePage({ authMode, setAuthMode, onLogin, onRegister }) {
  const [loginEmail, setLoginEmail] = useState(demoAccounts[0].email);
  const [registerForm, setRegisterForm] = useState({
    companyName: "Prism Orbit Studio",
    companyEmail: "team@prismorbit.com",
    phone: "9876500011",
    size: "10-50",
    address: "Jaipur",
    ownerName: "Aashi Founder",
    ownerEmail: "aashi@prismorbit.com",
  });

  return (
    <main className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Unique multi-role dashboard frontend</span>
          <h1>Permission-first dashboards with a non-basic visual system.</h1>
          <p>
            Landing page, auth, owner, manager, HR, employee, and client flows are aligned to your description.
            Wherever the backend is missing something, the frontend derives it.
          </p>
          <div className="hero-actions">
            <button className={authMode === "login" ? "primary-button" : "secondary-button"} onClick={() => setAuthMode("login")}>
              Login
            </button>
            <button className={authMode === "register" ? "primary-button" : "secondary-button"} onClick={() => setAuthMode("register")}>
              Sign Up
            </button>
          </div>
          <div className="demo-list">
            {demoAccounts.map((account) => (
              <button key={account.email} className="demo-chip" onClick={() => { setAuthMode("login"); setLoginEmail(account.email); }}>
                {account.role}: {account.email}
              </button>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="constellation-card">
            <div className="orb orb-a" />
            <div className="orb orb-b" />
            <div className="orb orb-c" />
            <div className="mini-panel">
              <span>Owner analytics</span>
              <strong>120 tasks</strong>
            </div>
            <div className="mini-panel accent">
              <span>HR pulse</span>
              <strong>80% present</strong>
            </div>
            <div className="mini-panel wide">
              <span>Client progress</span>
              <strong>3 live projects</strong>
            </div>
          </div>
        </div>
      </section>
      <section className="auth-section">
        {authMode === "login" ? (
          <div className="auth-card">
            <div>
              <span className="eyebrow">Login</span>
              <h2>Pick a demo account and enter its dashboard.</h2>
            </div>
            <label>
              Email
              <select value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)}>
                {demoAccounts.map((account) => (
                  <option key={account.email} value={account.email}>
                    {account.role} - {account.email}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" onClick={() => onLogin(loginEmail)}>
              Enter dashboard
            </button>
            <p className="subtle-text">Mapped APIs: {apiRegistry.home.join(" • ")}</p>
          </div>
        ) : (
          <div className="auth-card">
            <div>
              <span className="eyebrow">Register</span>
              <h2>Create a company and land on the owner dashboard.</h2>
            </div>
            <div className="form-grid">
              {[
                ["Company name", "companyName"],
                ["Company email", "companyEmail"],
                ["Phone", "phone"],
                ["Company size", "size"],
                ["Address", "address"],
                ["Owner name", "ownerName"],
                ["Owner email", "ownerEmail"],
              ].map(([label, key]) => (
                <label key={key}>
                  {label}
                  <input
                    value={registerForm[key]}
                    onChange={(event) => setRegisterForm((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
            <button className="primary-button" onClick={() => onRegister(registerForm)}>
              Create company
            </button>
            <p className="subtle-text">Mapped APIs: {apiRegistry.home.join(" • ")}</p>
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardApp(props) {
  const {
    route,
    setRoute,
    selectedId,
    setSelectedId,
    editing,
    setEditing,
    currentUser,
    currentRole,
    currentCompany,
    currentDashboard,
    store,
    updateEntity,
    createEntity,
    deleteEntity,
    onLogout,
    onOpenRoleDashboard,
  } = props;

  const metrics = buildMetrics(store);
  const context = {
    route,
    setRoute,
    selectedId,
    setSelectedId,
    editing,
    setEditing,
    currentUser,
    currentRole,
    currentCompany,
    currentDashboard,
    store,
    metrics,
    updateEntity,
    createEntity,
    deleteEntity,
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <div className="brand-block">
            <span className="eyebrow">Permission dashboard</span>
            <h2>Orbit Control</h2>
          </div>
          <div className="profile-strip">
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
          <nav className="nav-stack">
            {(roleMenu[route.dashboard] ?? []).map((item) => (
              <button
                key={item.id}
                className={route.page === item.id ? "nav-link active" : "nav-link"}
                onClick={() => {
                  setRoute({ ...route, page: item.id });
                  setSelectedId(null);
                  setEditing(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-actions">
          <button className="secondary-button" onClick={onOpenRoleDashboard}>
            Refresh Role Home
          </button>
          <button className="secondary-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Current company</span>
            <h1>{currentCompany?.name ?? "Workspace"}</h1>
          </div>
          <div className="topbar-meta">
            <div className="meta-chip">
              <span>Dashboard</span>
              <strong>{capitalize(route.dashboard)}</strong>
            </div>
            <div className="meta-chip">
              <span>Permission</span>
              <strong>{permissionBadge(currentRole)}</strong>
            </div>
          </div>
        </header>
        <div className="page-body">{renderDashboardPage(route.dashboard, route.page, context)}</div>
      </section>
    </div>
  );
}

function renderDashboardPage(dashboard, page, context) {
  if (dashboard === "owner") return renderOwnerPage(page, context);
  if (dashboard === "manager") return renderManagerPage(page, context);
  if (dashboard === "hr") return renderHrPage(page, context);
  if (dashboard === "employee") return renderEmployeePage(page, context);
  if (dashboard === "client") return renderClientPage(page, context);
  return <EmptyState title="No dashboard found" copy="The permission map did not resolve to a dashboard." />;
}

function renderOwnerPage(page, context) {
  const { metrics, store, currentCompany, selectedId, setSelectedId, editing, setEditing, updateEntity, createEntity, deleteEntity } = context;
  if (page === "analytics") {
    return (
      <>
        <PageIntro title="Company analytics" copy="Counts, project momentum, task distribution, and a frontend-derived recent activity feed." endpoints={apiRegistry.owner.analytics} />
        <StatsGrid items={[
          { label: "Employees", value: metrics.totalEmployees },
          { label: "Projects", value: metrics.totalProjects },
          { label: "Tasks", value: metrics.totalTasks },
          { label: "Clients", value: metrics.totalClients },
        ]} />
        <div className="feature-grid two">
          <Panel title="Task completion pulse"><DonutChart value={metrics.completionRate} label="completion" /><MiniLegend rows={[["Completed", metrics.completedTasks], ["Pending", metrics.pendingTasks], ["Overdue", metrics.overdueTasks]]} /></Panel>
          <Panel title="Project momentum"><BarChart values={store.projects.map((project) => ({ label: project.name, value: project.progress }))} /></Panel>
          <Panel title="Task status spread"><SegmentChart values={groupTasksByStatus(store.tasks)} /></Panel>
          <Panel title="Recent activity"><ActivityFeed items={deriveRecentActivity(store)} /></Panel>
        </div>
      </>
    );
  }
  if (page === "roles") {
    return (
      <EntityWorkspace
        title="Role management"
        copy="Create roles, browse only basic list fields, and open a detailed panel for edit or delete."
        endpoints={apiRegistry.owner.roles}
        collection={store.roles}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "slug", "level"]}
        detailFields={["name", "slug", "level", "can_manage_company", "can_manage_users", "can_manage_hr", "can_view_assigned_tasks", "can_view_project_progress"]}
        onCreate={(payload) => createEntity("roles", { id: Date.now(), company: 1, ...payload })}
        onUpdate={(payload) => updateEntity("roles", payload)}
        onDelete={(id) => deleteEntity("roles", id)}
      />
    );
  }
  if (page === "users") {
    return (
      <EntityWorkspace
        title="Users"
        copy="Create users, open detailed user cards, edit profile basics, and delete when needed."
        endpoints={apiRegistry.owner.users}
        collection={store.users}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "email", "role", "status"]}
        detailFields={["name", "email", "role", "status", "level"]}
        onCreate={(payload) => createEntity("users", { id: Date.now(), companyId: 1, roleId: 4, level: 20, ...payload })}
        onUpdate={(payload) => updateEntity("users", payload)}
        onDelete={(id) => deleteEntity("users", id)}
      />
    );
  }
  if (page === "projects") {
    return (
      <EntityWorkspace
        title="Projects"
        copy="Create company projects, review progress and dates in the list, and manage details from the side panel."
        endpoints={apiRegistry.owner.projects}
        collection={store.projects}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "status", "priority", "progress"]}
        detailFields={["name", "description", "status", "priority", "start_date", "end_date", "budget", "actual_cost", "progress"]}
        onCreate={(payload) => createEntity("projects", { id: Date.now(), company: 1, client: 5, manager: 2, is_active: true, created_at: new Date().toISOString(), ...payload })}
        onUpdate={(payload) => updateEntity("projects", payload)}
        onDelete={(id) => deleteEntity("projects", id)}
      />
    );
  }
  if (page === "tasks") {
    const selectedTask = store.tasks.find((task) => task.id === selectedId) ?? store.tasks[0];
    return (
      <>
        <PageIntro title="Tasks by project" copy="Tasks are sectioned project-wise, with detail and inline edit workflows." endpoints={apiRegistry.owner.tasks} />
        <div className="feature-grid two">
          <Panel title="Create task">
            <EntityForm
              fields={["title", "assigned_to_name", "status", "priority", "due_date", "progress", "project"]}
              defaultValue={{ title: "", assigned_to_name: "", status: "PENDING", priority: "MEDIUM", due_date: "2026-04-20", progress: 0, project: 1 }}
              submitLabel="Create task"
              onSubmit={(payload) => createEntity("tasks", { id: Date.now(), company: 1, assigned_to: 4, created_by: 1, created_by_name: "Saanvi Owner", attachment: null, image: null, reference_link: "", created_at: new Date().toISOString(), description: payload.title, ...payload })}
            />
          </Panel>
          <Panel title="Task stream">
            <TaskProjectSections projects={store.projects} tasks={store.tasks} selectedId={selectedId} onSelect={setSelectedId} />
          </Panel>
          <Panel title="Task detail">
            <TaskDetail task={selectedTask} onStartEdit={() => setEditing(selectedTask)} onDelete={(id) => deleteEntity("tasks", id)} />
          </Panel>
          <Panel title="Edit task">
            <EntityForm fields={["title", "status", "priority", "due_date", "progress"]} defaultValue={editing ?? selectedTask} submitLabel="Save task" onSubmit={(payload) => updateEntity("tasks", payload)} />
          </Panel>
        </div>
      </>
    );
  }
  if (page === "settings") {
    return (
      <>
        <PageIntro title="Company settings" copy="Display the company profile and edit core details from the same screen." endpoints={apiRegistry.owner.settings} />
        <div className="feature-grid two">
          <Panel title="Company profile">
            <div className="company-banner">
              <div>
                <span className="eyebrow">Company</span>
                <h2>{currentCompany.name}</h2>
              </div>
              <p>{currentCompany.address}</p>
              <ul className="details-list">
                <li><span>Email</span><strong>{currentCompany.email}</strong></li>
                <li><span>Phone</span><strong>{currentCompany.phone}</strong></li>
                <li><span>Size</span><strong>{currentCompany.size}</strong></li>
              </ul>
            </div>
          </Panel>
          <Panel title="Edit company">
            <EntityForm fields={["name", "email", "phone", "size", "address"]} defaultValue={currentCompany} submitLabel="Update company" onSubmit={(payload) => updateEntity("companies", payload)} />
          </Panel>
        </div>
      </>
    );
  }
  return <EmptyState title="Owner page missing" copy="This owner page is not yet mapped." />;
}

function renderManagerPage(page, context) {
  const { metrics, store, currentUser, selectedId, setSelectedId, editing, setEditing, updateEntity, createEntity, deleteEntity } = context;
  const myProjects = store.projects.filter((project) => project.manager === currentUser.id);
  const myLeaves = store.leaves.filter((leave) => leave.company_user_id === currentUser.id);
  const myAttendance = store.attendance.filter((entry) => entry.company_user_id === currentUser.id);
  const tasksUnderManager = store.tasks.filter((task) => task.created_by === currentUser.id || myProjects.some((project) => project.id === task.project));
  if (page === "analytics") {
    return (
      <>
        <PageIntro title="Manager analytics" copy="Counts, charts, recent activity, and tasks that sit under the manager's ownership space." endpoints={apiRegistry.manager.analytics} />
        <StatsGrid items={[
          { label: "Employees", value: metrics.totalEmployees },
          { label: "Projects", value: myProjects.length },
          { label: "Tasks", value: tasksUnderManager.length },
          { label: "Clients", value: uniqueCount(myProjects.map((project) => project.client)) },
        ]} />
        <div className="feature-grid two">
          <Panel title="Managed project progress"><BarChart values={myProjects.map((project) => ({ label: project.name, value: project.progress }))} /></Panel>
          <Panel title="Task ownership"><SegmentChart values={groupTasksByStatus(tasksUnderManager)} /></Panel>
          <Panel title="Recent activity"><ActivityFeed items={deriveRecentActivity({ ...store, tasks: tasksUnderManager, projects: myProjects })} /></Panel>
          <Panel title="Tasks under your name"><TaskList tasks={tasksUnderManager} compact /></Panel>
        </div>
      </>
    );
  }
  if (page === "users") {
    return (
      <EntityWorkspace
        title="Team users"
        copy="Managers can review and edit basic user information from the detail panel."
        endpoints={apiRegistry.manager.users}
        collection={store.users}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "email", "role", "status"]}
        detailFields={["name", "email", "role", "status", "level"]}
        createDisabled
        onUpdate={(payload) => updateEntity("users", payload)}
      />
    );
  }
  if (page === "projects") {
    return (
      <EntityWorkspace
        title="Managed projects"
        copy="Only projects where this manager is assigned are shown."
        endpoints={apiRegistry.manager.projects}
        collection={myProjects}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "status", "priority", "progress"]}
        detailFields={["name", "description", "status", "priority", "start_date", "end_date", "progress"]}
        onCreate={(payload) => createEntity("projects", { id: Date.now(), company: 1, client: 5, manager: currentUser.id, budget: "0.00", actual_cost: "0.00", is_active: true, created_at: new Date().toISOString(), ...payload })}
        onUpdate={(payload) => updateEntity("projects", payload)}
        onDelete={(id) => deleteEntity("projects", id)}
      />
    );
  }
  if (page === "tasks") {
    const managerTasks = store.tasks.filter((task) => myProjects.some((project) => project.id === task.project));
    const activeTask = store.tasks.find((task) => task.id === selectedId) ?? managerTasks[0];
    return (
      <>
        <PageIntro title="Project-based tasks" copy="Create, browse, edit, and delete tasks grouped project-wise for the manager view." endpoints={apiRegistry.manager.tasks} />
        <div className="feature-grid two">
          <Panel title="Create task">
            <EntityForm fields={["title", "assigned_to_name", "status", "priority", "due_date", "progress", "project"]} defaultValue={{ title: "", assigned_to_name: "", status: "PENDING", priority: "MEDIUM", due_date: "2026-04-20", progress: 0, project: myProjects[0]?.id ?? 1 }} submitLabel="Create task" onSubmit={(payload) => createEntity("tasks", { id: Date.now(), company: 1, assigned_to: 4, created_by: currentUser.id, created_by_name: currentUser.name, attachment: null, image: null, reference_link: "", created_at: new Date().toISOString(), description: payload.title, ...payload })} />
          </Panel>
          <Panel title="Task sections">
            <TaskProjectSections projects={myProjects} tasks={managerTasks} selectedId={selectedId} onSelect={setSelectedId} />
          </Panel>
          <Panel title="Task detail">
            <TaskDetail task={activeTask} onStartEdit={() => setEditing(activeTask)} onDelete={(id) => deleteEntity("tasks", id)} />
          </Panel>
          <Panel title="Edit task">
            <EntityForm fields={["title", "status", "priority", "due_date", "progress"]} defaultValue={editing ?? activeTask} submitLabel="Save task" onSubmit={(payload) => updateEntity("tasks", payload)} />
          </Panel>
        </div>
      </>
    );
  }
  if (page === "attendance-leave") {
    return (
      <>
        <PageIntro title="Attendance and leave" copy="Self attendance for the week, charts, check in/out actions, apply leave, and leave history." endpoints={apiRegistry.manager.attendanceLeave} />
        <div className="feature-grid two">
          <Panel title="Attendance actions">
            <ActionRow actions={[{ label: "Check in", onClick: () => createEntity("attendance", buildAttendanceEntry(currentUser, "PRESENT")) }, { label: "Check out", onClick: () => createEntity("attendance", buildAttendanceEntry(currentUser, "PRESENT", true)) }]} />
            <LineChart values={myAttendance.map((entry) => ({ label: shortDate(entry.date), value: entry.check_out ? 9 : 4 }))} />
          </Panel>
          <Panel title="Weekly attendance list"><AttendanceTable entries={myAttendance} /></Panel>
          <Panel title="Apply leave">
            <EntityForm fields={["start_date", "end_date", "reason"]} defaultValue={{ start_date: "2026-04-15", end_date: "2026-04-15", reason: "" }} submitLabel="Apply leave" onSubmit={(payload) => createEntity("leaves", { id: Date.now(), company_user_id: currentUser.id, employee_name: currentUser.name, employee_role: currentUser.role, status: "PENDING", applied_on: new Date().toISOString(), ...payload })} />
          </Panel>
          <Panel title="Leave history"><LeaveList leaves={myLeaves} showActions={false} /></Panel>
        </div>
      </>
    );
  }
  return <EmptyState title="Manager page missing" copy="This manager page is not yet mapped." />;
}

function renderHrPage(page, context) {
  const { store, selectedId, setSelectedId, editing, setEditing, updateEntity, createEntity, deleteEntity } = context;
  if (page === "analytics") {
    const hrStats = buildHrMetrics(store);
    return (
      <>
        <PageIntro title="HR analytics" copy="Attendance, leave mix, and employee coverage shown in richer charts." endpoints={apiRegistry.hr.analytics} />
        <StatsGrid items={[
          { label: "Employees", value: hrStats.totalEmployees },
          { label: "Present", value: hrStats.present },
          { label: "Pending Leaves", value: hrStats.pendingLeaves },
          { label: "Attendance %", value: `${hrStats.attendancePercentage}%` },
        ]} />
        <div className="feature-grid two">
          <Panel title="Attendance mix"><SegmentChart values={[{ label: "Present", value: hrStats.present }, { label: "Half Day", value: hrStats.halfDay }, { label: "Absent", value: hrStats.absent }, { label: "On Leave", value: hrStats.onLeave }]} /></Panel>
          <Panel title="Leave summary"><BarChart values={[{ label: "Approved", value: hrStats.approvedLeaves }, { label: "Pending", value: hrStats.pendingLeaves }, { label: "Rejected", value: hrStats.rejectedLeaves }]} /></Panel>
          <Panel title="Department spread"><BarChart values={buildDepartmentSpread(store)} /></Panel>
          <Panel title="Recent HR activity"><ActivityFeed items={deriveHrActivity(store)} /></Panel>
        </div>
      </>
    );
  }
  if (page === "roles") {
    return (
      <EntityWorkspace
        title="Role access"
        copy="HR can create, inspect, edit, and delete role definitions."
        endpoints={apiRegistry.hr.roles}
        collection={store.roles}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "slug", "level"]}
        detailFields={["name", "slug", "level", "can_manage_company", "can_manage_users", "can_manage_hr", "can_view_assigned_tasks", "can_view_project_progress"]}
        onCreate={(payload) => createEntity("roles", { id: Date.now(), company: 1, ...payload })}
        onUpdate={(payload) => updateEntity("roles", payload)}
        onDelete={(id) => deleteEntity("roles", id)}
      />
    );
  }
  if (page === "users") {
    return (
      <EntityWorkspace
        title="People directory"
        copy="Create users, inspect basic details in the list, and manage records from the detail view."
        endpoints={apiRegistry.hr.users}
        collection={store.users}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        editing={editing}
        setEditing={setEditing}
        fields={["name", "email", "role", "status"]}
        detailFields={["name", "email", "role", "status", "level"]}
        onCreate={(payload) => createEntity("users", { id: Date.now(), companyId: 1, roleId: 4, level: 20, ...payload })}
        onUpdate={(payload) => updateEntity("users", payload)}
        onDelete={(id) => deleteEntity("users", id)}
      />
    );
  }
  if (page === "attendance") {
    return (
      <>
        <PageIntro title="Attendance intelligence" copy="All attendance is aggregated on the frontend to cover the backend gap and enable HR-wide review." endpoints={apiRegistry.hr.attendance} />
        <div className="feature-grid two">
          <Panel title="Attendance list"><AttendanceTable entries={store.attendance} full /></Panel>
          <Panel title="Attendance analysis"><SegmentChart values={countAttendanceStates(store.attendance)} /></Panel>
          <Panel title="Performance reviews"><ReviewList reviews={store.reviews} users={store.users} /></Panel>
          <Panel title="Add performance review">
            <EntityForm fields={["employeeId", "rating", "feedback"]} defaultValue={{ employeeId: 4, rating: 4, feedback: "" }} submitLabel="Add review" onSubmit={(payload) => createEntity("reviews", { id: Date.now(), review_date: new Date().toISOString().slice(0, 10), ...payload, employeeId: Number(payload.employeeId), rating: Number(payload.rating) })} />
          </Panel>
        </div>
      </>
    );
  }
  if (page === "leaves") {
    return (
      <>
        <PageIntro title="Leave control" copy="Approve or reject leave requests directly from the HR lane." endpoints={apiRegistry.hr.leaves} />
        <div className="feature-grid two">
          <Panel title="Leave requests"><LeaveList leaves={store.leaves} showActions onUpdate={(leave) => updateEntity("leaves", leave)} /></Panel>
          <Panel title="Leave status split"><BarChart values={[{ label: "Approved", value: store.leaves.filter((leave) => leave.status === "APPROVED").length }, { label: "Pending", value: store.leaves.filter((leave) => leave.status === "PENDING").length }, { label: "Rejected", value: store.leaves.filter((leave) => leave.status === "REJECTED").length }]} /></Panel>
        </div>
      </>
    );
  }
  return <EmptyState title="HR page missing" copy="This HR page is not yet mapped." />;
}

function renderEmployeePage(page, context) {
  const { store, currentUser, selectedId, setSelectedId, editing, setEditing, updateEntity, createEntity } = context;
  const myProjects = store.projects.filter((project) => store.tasks.some((task) => task.project === project.id && task.assigned_to === currentUser.id));
  const myTasks = store.tasks.filter((task) => task.assigned_to === currentUser.id);
  const myAttendance = store.attendance.filter((entry) => entry.company_user_id === currentUser.id);
  const myLeaves = store.leaves.filter((leave) => leave.company_user_id === currentUser.id);
  if (page === "projects-tasks") {
    const activeTask = myTasks.find((task) => task.id === selectedId) ?? myTasks[0];
    return (
      <>
        <PageIntro title="My projects and tasks" copy="Projects are shown only if they contain tasks assigned to the logged-in employee." endpoints={apiRegistry.employee.projectsTasks} />
        <div className="feature-grid two">
          <Panel title="Assigned projects"><ProjectSummaryList projects={myProjects} /></Panel>
          <Panel title="Task sections"><TaskProjectSections projects={myProjects} tasks={myTasks} selectedId={selectedId} onSelect={setSelectedId} /></Panel>
          <Panel title="Task detail"><TaskDetail task={activeTask} onStartEdit={() => setEditing(activeTask)} /></Panel>
          <Panel title="Edit task"><EntityForm fields={["title", "status", "priority", "due_date", "progress"]} defaultValue={editing ?? activeTask} submitLabel="Update task" onSubmit={(payload) => updateEntity("tasks", payload)} /></Panel>
        </div>
      </>
    );
  }
  if (page === "attendance-leave") {
    return (
      <>
        <PageIntro title="Attendance and leave" copy="Personal attendance controls, weekly records, charts, and leave requests in one place." endpoints={apiRegistry.employee.attendanceLeave} />
        <div className="feature-grid two">
          <Panel title="Attendance actions">
            <ActionRow actions={[{ label: "Check in", onClick: () => createEntity("attendance", buildAttendanceEntry(currentUser, "PRESENT")) }, { label: "Check out", onClick: () => createEntity("attendance", buildAttendanceEntry(currentUser, "PRESENT", true)) }]} />
            <LineChart values={myAttendance.map((entry) => ({ label: shortDate(entry.date), value: entry.check_out ? 8.7 : 4 }))} />
          </Panel>
          <Panel title="Attendance list"><AttendanceTable entries={myAttendance} /></Panel>
          <Panel title="Apply leave"><EntityForm fields={["start_date", "end_date", "reason"]} defaultValue={{ start_date: "2026-04-12", end_date: "2026-04-13", reason: "" }} submitLabel="Apply leave" onSubmit={(payload) => createEntity("leaves", { id: Date.now(), company_user_id: currentUser.id, employee_name: currentUser.name, employee_role: currentUser.role, status: "PENDING", applied_on: new Date().toISOString(), ...payload })} /></Panel>
          <Panel title="Leave list"><LeaveList leaves={myLeaves} showActions={false} /></Panel>
        </div>
      </>
    );
  }
  return <EmptyState title="Employee page missing" copy="This employee page is not yet mapped." />;
}

function renderClientPage(page, context) {
  const { store, currentUser } = context;
  const myProjects = store.projects.filter((project) => project.client === currentUser.id);
  if (page === "progress") {
    return (
      <>
        <PageIntro title="Client project progress" copy="Only client-owned projects are visible here, with progress and budget charts." endpoints={apiRegistry.client.progress} />
        <StatsGrid items={[
          { label: "Projects", value: myProjects.length },
          { label: "Average Progress", value: `${Math.round(avg(myProjects.map((project) => project.progress)))}%` },
          { label: "Budget", value: currency(sum(myProjects.map((project) => Number(project.budget)))) },
          { label: "Actual Cost", value: currency(sum(myProjects.map((project) => Number(project.actual_cost)))) },
        ]} />
        <div className="feature-grid two">
          <Panel title="Progress by project"><BarChart values={myProjects.map((project) => ({ label: project.name, value: project.progress }))} /></Panel>
          <Panel title="Budget vs actual"><DualBarChart values={myProjects.map((project) => ({ label: project.name, primary: Number(project.budget), secondary: Number(project.actual_cost) }))} /></Panel>
          <Panel title="Timeline overview"><TimelineList projects={myProjects} /></Panel>
          <Panel title="Status overview"><SegmentChart values={groupProjectsByStatus(myProjects)} /></Panel>
        </div>
      </>
    );
  }
  return <EmptyState title="Client page missing" copy="This client page is not yet mapped." />;
}

function PageIntro({ title, copy, endpoints }) {
  return (
    <section className="page-intro">
      <div>
        <span className="eyebrow">Dashboard module</span>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="api-card">
        <span className="eyebrow">Mapped APIs</span>
        {endpoints.map((entry) => (
          <code key={entry}>{entry}</code>
        ))}
      </div>
    </section>
  );
}

function StatsGrid({ items }) {
  return (
    <section className="stats-grid">
      {items.map((item) => (
        <article key={item.label} className="stat-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

function Panel({ title, children }) {
  return (
    <article className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
      </div>
      {children}
    </article>
  );
}

function EntityWorkspace({ title, copy, endpoints, collection, selectedId, setSelectedId, editing, setEditing, fields, detailFields, onCreate, onUpdate, onDelete, createDisabled }) {
  const active = collection.find((entry) => entry.id === selectedId) ?? collection[0] ?? null;
  const defaultDraft = active ?? Object.fromEntries(fields.map((field) => [field, ""]));
  return (
    <>
      <PageIntro title={title} copy={copy} endpoints={endpoints} />
      <div className="feature-grid two">
        <Panel title={createDisabled ? "List" : "Create"}>
          {createDisabled ? <EntityList collection={collection} fields={fields} selectedId={selectedId} onSelect={setSelectedId} /> : <EntityForm fields={fields} defaultValue={defaultDraft} submitLabel="Create" onSubmit={onCreate} />}
        </Panel>
        <Panel title="List"><EntityList collection={collection} fields={fields} selectedId={selectedId} onSelect={setSelectedId} /></Panel>
        <Panel title="Detail"><DetailCard item={active} fields={detailFields} onEdit={() => setEditing(active)} onDelete={onDelete} /></Panel>
        <Panel title="Edit"><EntityForm fields={detailFields.filter((field) => field !== "level" || typeof active?.[field] !== "undefined")} defaultValue={editing ?? active} submitLabel="Save" onSubmit={onUpdate} /></Panel>
      </div>
    </>
  );
}

function EntityList({ collection, fields, selectedId, onSelect }) {
  return (
    <div className="list-stack">
      {collection.map((item) => (
        <button key={item.id} className={selectedId === item.id ? "list-row active" : "list-row"} onClick={() => onSelect(item.id)}>
          <strong>{item[fields[0]]}</strong>
          <div className="row-meta">
            {fields.slice(1).map((field) => (
              <span key={field}>{String(item[field])}</span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function DetailCard({ item, fields, onEdit, onDelete }) {
  if (!item) return <EmptyState title="Nothing selected" copy="Pick an item from the list to inspect it." />;
  return (
    <div className="detail-card">
      <div className="detail-header">
        <h4>{item.name ?? item.title ?? `#${item.id}`}</h4>
        <div className="action-inline">
          {onEdit ? <button className="secondary-button" onClick={onEdit}>Edit</button> : null}
          {onDelete ? <button className="danger-button" onClick={() => onDelete(item.id)}>Delete</button> : null}
        </div>
      </div>
      <ul className="details-list">
        {fields.map((field) => (
          <li key={field}>
            <span>{field}</span>
            <strong>{String(item[field])}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntityForm({ fields, defaultValue, submitLabel, onSubmit }) {
  const base = defaultValue ?? Object.fromEntries(fields.map((field) => [field, ""]));
  const [draft, setDraft] = useState(base);
  return (
    <form className="entity-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...base, ...draft, id: base.id }); }}>
      {fields.map((field) => (
        <label key={field}>
          {field.replaceAll("_", " ")}
          <input value={draft?.[field] ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, [field]: event.target.value }))} />
        </label>
      ))}
      <button className="primary-button" type="submit">{submitLabel}</button>
    </form>
  );
}

function TaskProjectSections({ projects, tasks, selectedId, onSelect }) {
  return (
    <div className="task-sections">
      {projects.map((project) => {
        const scoped = tasks.filter((task) => task.project === project.id);
        return (
          <section key={project.id} className="section-block">
            <div className="section-head">
              <strong>{project.name}</strong>
              <span>{scoped.length} tasks</span>
            </div>
            {scoped.length ? scoped.map((task) => (
              <button key={task.id} className={selectedId === task.id ? "task-chip active" : "task-chip"} onClick={() => onSelect(task.id)}>
                <span>{task.title}</span>
                <strong>{task.status}</strong>
              </button>
            )) : <p className="subtle-text">No tasks in this project yet.</p>}
          </section>
        );
      })}
    </div>
  );
}

function TaskDetail({ task, onStartEdit, onDelete }) {
  if (!task) return <EmptyState title="No task selected" copy="Choose a task from the grouped list." />;
  return (
    <div className="detail-card">
      <div className="detail-header">
        <h4>{task.title}</h4>
        <div className="action-inline">
          {onStartEdit ? <button className="secondary-button" onClick={onStartEdit}>Edit</button> : null}
          {onDelete ? <button className="danger-button" onClick={() => onDelete(task.id)}>Delete</button> : null}
        </div>
      </div>
      <p>{task.description}</p>
      <ul className="details-list">
        <li><span>Assigned to</span><strong>{task.assigned_to_name}</strong></li>
        <li><span>Status</span><strong>{task.status}</strong></li>
        <li><span>Priority</span><strong>{task.priority}</strong></li>
        <li><span>Due date</span><strong>{task.due_date}</strong></li>
        <li><span>Progress</span><strong>{task.progress}%</strong></li>
      </ul>
    </div>
  );
}

function TaskList({ tasks, compact }) {
  return (
    <div className="list-stack">
      {tasks.map((task) => (
        <div key={task.id} className={compact ? "compact-row" : "list-row active"}>
          <strong>{task.title}</strong>
          <div className="row-meta">
            <span>{task.assigned_to_name}</span>
            <span>{task.status}</span>
            <span>{task.progress}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceTable({ entries, full }) {
  return (
    <div className="table-shell">
      <div className="table-head">
        <span>{full ? "Employee" : "Date"}</span>
        <span>Status</span>
        <span>Hours</span>
      </div>
      {entries.map((entry) => (
        <div key={entry.id} className="table-row">
          <span>{full ? entry.employee_name : shortDate(entry.date)}</span>
          <span>{entry.status}</span>
          <span>{calcHours(entry.check_in, entry.check_out)}</span>
        </div>
      ))}
    </div>
  );
}

function LeaveList({ leaves, showActions, onUpdate }) {
  return (
    <div className="list-stack">
      {leaves.map((leave) => (
        <div key={leave.id} className="leave-card">
          <div>
            <strong>{leave.employee_name}</strong>
            <p>{leave.start_date} to {leave.end_date}</p>
          </div>
          <span className={`status-pill ${slugify(leave.status)}`}>{leave.status}</span>
          <p>{leave.reason}</p>
          {showActions ? <div className="action-inline"><button className="primary-button" onClick={() => onUpdate({ ...leave, status: "APPROVED" })}>Approve</button><button className="danger-button" onClick={() => onUpdate({ ...leave, status: "REJECTED" })}>Reject</button></div> : null}
        </div>
      ))}
    </div>
  );
}

function ReviewList({ reviews, users }) {
  return (
    <div className="list-stack">
      {reviews.map((review) => {
        const user = users.find((entry) => entry.id === review.employeeId);
        return <div key={review.id} className="leave-card"><strong>{user?.name ?? review.employeeId}</strong><span>Rating: {review.rating}/5</span><p>{review.feedback}</p></div>;
      })}
    </div>
  );
}

function ProjectSummaryList({ projects }) {
  return <div className="list-stack">{projects.map((project) => <div key={project.id} className="leave-card"><strong>{project.name}</strong><span>{project.status}</span><p>{project.description}</p></div>)}</div>;
}

function TimelineList({ projects }) {
  return <div className="timeline-list">{projects.map((project) => <div key={project.id} className="timeline-row"><div><strong>{project.name}</strong><p>{project.start_date} to {project.end_date}</p></div><span>{project.progress}%</span></div>)}</div>;
}

function ActivityFeed({ items }) {
  return <div className="activity-feed">{items.map((item, index) => <div key={`${item.title}-${index}`} className="activity-row"><strong>{item.title}</strong><p>{item.copy}</p></div>)}</div>;
}

function ActionRow({ actions }) {
  return <div className="action-inline">{actions.map((action) => <button key={action.label} className="primary-button" onClick={action.onClick}>{action.label}</button>)}</div>;
}

function DonutChart({ value, label }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" className="donut-chart">
        <circle cx="70" cy="70" r={radius} className="donut-base" />
        <circle cx="70" cy="70" r={radius} className="donut-value" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="donut-center"><strong>{value}%</strong><span>{label}</span></div>
    </div>
  );
}

function BarChart({ values }) {
  const max = Math.max(...values.map((item) => item.value), 1);
  return <div className="chart-bars">{values.map((item) => <div key={item.label} className="bar-row"><span>{item.label}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} /></div><strong>{item.value}</strong></div>)}</div>;
}

function DualBarChart({ values }) {
  const max = Math.max(...values.flatMap((item) => [item.primary, item.secondary]), 1);
  return <div className="chart-bars">{values.map((item) => <div key={item.label} className="dual-row"><span>{item.label}</span><div className="dual-track"><div className="dual-fill primary" style={{ width: `${(item.primary / max) * 100}%` }} /><div className="dual-fill secondary" style={{ width: `${(item.secondary / max) * 100}%` }} /></div><strong>{currency(item.secondary)}</strong></div>)}</div>;
}

function SegmentChart({ values }) {
  const total = sum(values.map((item) => item.value)) || 1;
  return <div className="segment-chart">{values.map((item) => <div key={item.label} className="segment-row"><div className="segment-label"><span>{item.label}</span><strong>{item.value}</strong></div><div className="segment-track"><div className="segment-fill" style={{ width: `${(item.value / total) * 100}%` }} /></div></div>)}</div>;
}

function LineChart({ values }) {
  const max = Math.max(...values.map((item) => item.value), 1);
  const points = values.map((item, index) => { const x = 20 + (index * 240) / Math.max(values.length - 1, 1); const y = 120 - (item.value / max) * 90; return `${x},${y}`; }).join(" ");
  return (
    <div className="line-chart">
      <svg viewBox="0 0 280 140"><path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div className="line-labels">{values.map((item) => <span key={item.label}>{item.label}</span>)}</div>
    </div>
  );
}

function MiniLegend({ rows }) {
  return <div className="mini-legend">{rows.map(([label, value]) => <div key={label} className="legend-row"><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function EmptyState({ title, copy }) {
  return <div className="empty-state"><strong>{title}</strong><p>{copy}</p></div>;
}

function buildMetrics(store) {
  const totalTasks = store.tasks.length;
  const completedTasks = store.tasks.filter((task) => task.status === "COMPLETED").length;
  const pendingTasks = store.tasks.filter((task) => task.status !== "COMPLETED").length;
  return { totalEmployees: store.users.filter((user) => user.role !== "CLIENT").length, totalProjects: store.projects.length, totalTasks, totalClients: uniqueCount(store.projects.map((project) => project.client)), completedTasks, pendingTasks, overdueTasks: store.tasks.filter((task) => task.status !== "COMPLETED" && task.due_date < "2026-04-01").length, completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0 };
}

function buildHrMetrics(store) {
  return { totalEmployees: store.users.filter((user) => user.role !== "CLIENT").length, present: store.attendance.filter((entry) => entry.status === "PRESENT").length, halfDay: store.attendance.filter((entry) => entry.status === "HALF_DAY").length, absent: store.attendance.filter((entry) => entry.status === "ABSENT").length, onLeave: store.leaves.filter((entry) => entry.status === "APPROVED").length, pendingLeaves: store.leaves.filter((entry) => entry.status === "PENDING").length, approvedLeaves: store.leaves.filter((entry) => entry.status === "APPROVED").length, rejectedLeaves: store.leaves.filter((entry) => entry.status === "REJECTED").length, attendancePercentage: Math.round((store.attendance.filter((entry) => entry.status === "PRESENT").length / Math.max(store.users.filter((user) => user.role !== "CLIENT").length, 1)) * 100) };
}

function buildDepartmentSpread(store) {
  return store.departments.map((department) => ({ label: department.name, value: store.profiles.filter((profile) => profile.department?.id === department.id).length }));
}

function countAttendanceStates(attendance) {
  return ["PRESENT", "HALF_DAY", "ABSENT"].map((key) => ({ label: key.replace("_", " "), value: attendance.filter((entry) => entry.status === key).length }));
}

function groupTasksByStatus(tasks) {
  return ["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED"].map((key) => ({ label: key.replace("_", " "), value: tasks.filter((task) => task.status === key).length }));
}

function groupProjectsByStatus(projects) {
  return ["ACTIVE", "ON_HOLD", "COMPLETED"].map((key) => ({ label: key.replace("_", " "), value: projects.filter((project) => project.status === key).length }));
}

function deriveRecentActivity(store) {
  const projectRows = store.projects.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map((project) => ({ title: `${project.name} touched ${project.progress}%`, copy: `${project.status} • budget ${currency(Number(project.budget))}` }));
  const taskRows = store.tasks.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map((task) => ({ title: `${task.title} moved to ${task.status}`, copy: `${task.assigned_to_name} • due ${task.due_date}` }));
  return [...taskRows, ...projectRows].slice(0, 6);
}

function deriveHrActivity(store) {
  return [...store.leaves.map((leave) => ({ title: `${leave.employee_name} leave ${leave.status.toLowerCase()}`, copy: `${leave.start_date} to ${leave.end_date}` })), ...store.reviews.map((review) => ({ title: "Performance review logged", copy: `${review.review_date} • rating ${review.rating}/5` }))].slice(0, 6);
}

function buildAttendanceEntry(user, status, isCheckout = false) {
  return { id: Date.now(), company_user_id: user.id, employee_name: user.name, employee_role: user.role, date: "2026-04-01", check_in: isCheckout ? "09:15:00" : "09:30:00", check_out: isCheckout ? "18:05:00" : "", status };
}

function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "In progress";
  return "~8.5h";
}

function shortDate(value) { return value.slice(5); }
function avg(values) { return values.length ? sum(values) / values.length : 0; }
function sum(values) { return values.reduce((total, value) => total + value, 0); }
function uniqueCount(values) { return new Set(values).size; }
function capitalize(text) { return text ? text[0].toUpperCase() + text.slice(1) : ""; }
function slugify(text) { return text.toLowerCase().replace(/\s+/g, "-"); }
function permissionBadge(role) { if (!role) return "None"; if (role.can_manage_company) return "can manage company"; if (role.can_manage_hr) return "can manage hr"; if (role.can_manage_users) return "can manage users"; if (role.can_view_assigned_tasks) return "can view assigned task"; if (role.can_view_project_progress) return "can view project progress"; return "standard"; }
function currency(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }

export default App;
