const token = localStorage.getItem('token');

if (!token && !window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('/signup.html')) {
    window.location.href = 'login.html';
}

let currentSection = 'dashboard';
let draggedTaskId = null;
let editingProjectId = null;
let editingClientId = null;
let activeProjectForTask = null;
let activeColumnForTask = null;

const session = getSession();
const isAdmin = session.role === 'admin' || !session.role;

const dashboardSection = document.getElementById('dashboard-section');
const projectsSection = document.getElementById('projects-section');
const archiveSection = document.getElementById('archive-section');
const clientsSection = document.getElementById('clients-section');
const usersSection = document.getElementById('users-section');
const projectModal = document.getElementById('project-modal');
const taskModal = document.getElementById('task-modal');
const clientModal = document.getElementById('client-modal');
const userModal = document.getElementById('user-modal');
const searchInput = document.getElementById('search-input');

function getSession() {
    try {
        return JSON.parse(localStorage.getItem('user_session') || '{}');
    } catch {
        return {};
    }
}

function escapeHTML(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    window.location.href = 'login.html';
}

async function api(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        clearSession();
        throw new Error('Your session has expired.');
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) throw new Error(data?.message || 'Something went wrong.');
    return data;
}

function closeModal(modal) {
    modal?.classList.remove('open');
}

function closeAllModals() {
    closeModal(projectModal);
    closeModal(taskModal);
    closeModal(clientModal);
    closeModal(userModal);
}

function initUserProfile() {
    const username = document.querySelector('.header .username');
    if (username) username.textContent = session.name || 'Username';

    document.querySelectorAll('.admin-only').forEach(element => {
        if (!isAdmin) element.style.display = 'none';
    });
}

function switchSection(name) {
    const sections = {
        dashboard: dashboardSection,
        projects: projectsSection,
        archive: archiveSection,
        clients: clientsSection,
        users: usersSection
    };

    if (!isAdmin && (name === 'clients' || name === 'users')) {
        name = 'dashboard';
    }

    currentSection = name;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.page-section').forEach(section => section.style.display = 'none');

    const nav = document.getElementById(`nav-${name}`);
    nav?.classList.add('active');
    sections[name]?.style && (sections[name].style.display = 'block');
    closeAllModals();
}

async function showSection(name) {
    switchSection(name);
    if (name === 'dashboard') await renderDashboard();
    if (name === 'projects') await renderProjects(searchInput?.value.trim().toLowerCase() || '');
    if (name === 'archive') await renderArchive();
    if (name === 'clients' && isAdmin) await renderClients();
    if (name === 'users' && isAdmin) await renderUsers();
}

['dashboard', 'projects', 'archive', 'clients', 'users'].forEach(name => {
    document.getElementById(`nav-${name}`)?.addEventListener('click', async event => {
        event.preventDefault();
        await showSection(name);
    });
});

document.querySelector('.nav-item.logout')?.addEventListener('click', event => {
    event.preventDefault();
    if (confirm('Are you sure you want to log out?')) clearSession();
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal(modal);
    });
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAllModals();
});

async function loadEmployees(selectId, selectedIds = []) {
    if (!isAdmin) return;
    const select = document.getElementById(selectId);
    if (!select) return;

    const users = await api('/api/users');
    const employees = users.filter(user => user.role === 'employee');
    select.innerHTML = employees.length
        ? employees.map(user => `<option value="${user._id}" ${selectedIds.includes(user._id) ? 'selected' : ''}>${escapeHTML(user.name)} (${escapeHTML(user.email)})</option>`).join('')
        : '<option disabled>No employees available</option>';
}

function selectedValues(select) {
    return [...select.selectedOptions].map(option => option.value);
}

document.getElementById('open-project-modal')?.addEventListener('click', async () => {
    editingProjectId = null;
    document.getElementById('project-modal-title').textContent = 'Create New Project';
    document.getElementById('save-project-btn').textContent = 'Create Project';
    document.getElementById('project-title-input').value = '';
    document.getElementById('project-desc-input').value = '';
    await loadEmployees('project-members-input');
    projectModal?.classList.add('open');
});

document.getElementById('close-project-modal')?.addEventListener('click', () => closeModal(projectModal));
document.getElementById('close-task-modal')?.addEventListener('click', () => closeModal(taskModal));
document.getElementById('close-client-modal')?.addEventListener('click', () => closeModal(clientModal));
document.getElementById('close-user-modal')?.addEventListener('click', () => closeModal(userModal));

document.getElementById('save-project-btn')?.addEventListener('click', async () => {
    const title = document.getElementById('project-title-input').value.trim();
    const description = document.getElementById('project-desc-input').value.trim();
    const members = selectedValues(document.getElementById('project-members-input'));

    if (!title) return alert('Please enter a project title.');

    try {
        const options = {
            method: editingProjectId ? 'PUT' : 'POST',
            body: JSON.stringify({ title, description, members })
        };
        await api(editingProjectId ? `/api/projects/${editingProjectId}` : '/api/projects', options);
        closeModal(projectModal);
        await renderProjects();
    } catch (error) {
        alert(error.message);
    }
});

async function openProjectEdit(projectId) {
    const projects = await api('/api/projects');
    const project = projects.find(item => item._id === projectId);
    if (!project) return;
    editingProjectId = project._id;
    document.getElementById('project-modal-title').textContent = 'Edit Project';
    document.getElementById('save-project-btn').textContent = 'Save Changes';
    document.getElementById('project-title-input').value = project.title || '';
    document.getElementById('project-desc-input').value = project.description || '';
    await loadEmployees('project-members-input', (project.members || []).map(member => member._id));
    projectModal?.classList.add('open');
}

window.openProjectEdit = openProjectEdit;

window.openTaskModal = async function(projectId, status) {
    activeProjectForTask = projectId;
    activeColumnForTask = status;
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-desc-input').value = '';
    const projects = await api('/api/projects');
    const project = projects.find(item => item._id === projectId);
    const select = document.getElementById('task-assignee-input');
    select.innerHTML = '<option value="">Unassigned</option>' + (project?.members || []).map(member =>
        `<option value="${member._id}">${escapeHTML(member.name)} (${escapeHTML(member.email)})</option>`
    ).join('');
    taskModal?.classList.add('open');
};

document.getElementById('save-task-btn')?.addEventListener('click', async () => {
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const assignedTo = document.getElementById('task-assignee-input').value || null;

    if (!title || !activeProjectForTask || !activeColumnForTask) return alert('Please enter a task title.');

    try {
        await api('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({ title, description, status: activeColumnForTask, projectId: activeProjectForTask, assignedTo })
        });
        closeModal(taskModal);
        await renderProjects(searchInput?.value.trim().toLowerCase() || '');
    } catch (error) {
        alert(error.message);
    }
});

function getMemberInitials(member) {
    return (member?.name || member?.email || 'User').slice(0, 2).toUpperCase();
}

function taskMatchesSearch(task, term) {
    if (!term) return true;
    return `${task.title || ''} ${task.description || ''} ${task.label || ''}`.toLowerCase().includes(term);
}

function projectMatchesSearch(project, term) {
    if (!term) return true;
    return `${project.title || ''} ${project.description || ''}`.toLowerCase().includes(term) ||
        (project.tasks || []).some(task => taskMatchesSearch(task, term));
}

function renderTaskCard(task) {
    const assigned = task.assignedTo;
    const assignedHTML = assigned
        ? `<div class="task-footer"><div class="task-avatar" title="${escapeHTML(assigned.email || assigned.name)}">${escapeHTML(getMemberInitials(assigned))}</div></div>`
        : '';

    const actions = isAdmin ? `
        <button class="task-archive" title="Archive task" onclick="archiveTask('${task._id}')">□</button>
        <button class="task-delete" title="Delete task" onclick="deleteTask('${task._id}')">×</button>
    ` : '';

    return `<div class="task-card" draggable="${!isAdmin}" ondragstart="handleDragStart(event, '${task._id}')" ondragend="handleDragEnd(event)">
        <div class="task-card-top">
            <h4>${escapeHTML(task.title)}</h4>
            <div class="task-actions">${actions}</div>
        </div>
        ${task.description ? `<p>${escapeHTML(task.description)}</p>` : ''}
        ${task.label && task.label !== 'General' ? `<span style="display:inline-block;background:#eeeafd;color:#6c4df6;padding:5px 9px;border-radius:7px;font-size:11px;font-weight:600;margin-bottom:8px;">${escapeHTML(task.label)}</span>` : ''}
        ${assignedHTML}
    </div>`;
}

function renderColumn(project, status, filterTerm) {
    const labels = { todo: 'TODO', 'in-progress': 'IN PROGRESS', done: 'DONE' };
    const tasks = (project.tasks || []).filter(task => !task.archived && !task.deleted && task.status === status && taskMatchesSearch(task, filterTerm));
    const addTaskButton = isAdmin ? `<button class="add-task-btn" onclick="openTaskModal('${project._id}', '${status}')">+ Add a task</button>` : '';

    return `<div class="board-column" data-status="${status}" data-project-id="${project._id}"
        ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${project._id}', '${status}')">
        <div class="column-header"><div class="column-title"><span class="status-dot ${status}-dot"></span><h3>${labels[status]}</h3><span class="task-count">${tasks.length}</span></div></div>
        <div class="task-list">${tasks.map(renderTaskCard).join('')}</div>
        ${addTaskButton}
    </div>`;
}

window.handleDragStart = function(event, taskId) {
    if (isAdmin) return;
    draggedTaskId = taskId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    event.target.classList.add('dragging');
};

window.handleDragEnd = function(event) {
    event.target.classList.remove('dragging');
    document.querySelectorAll('.board-column').forEach(col => col.classList.remove('drag-over'));
};
window.handleDragOver = function(event) { if (!isAdmin) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } };
window.handleDragEnter = function(event) { if (!isAdmin) { event.preventDefault(); event.currentTarget.classList.add('drag-over'); } };
window.handleDragLeave = function(event) { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('drag-over'); };
window.handleDrop = function(event, projectId, newStatus) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    if (!isAdmin && draggedTaskId) updateTaskStatus(draggedTaskId, newStatus);
    draggedTaskId = null;
};

async function updateTaskStatus(taskId, status) {
    try {
        await api(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status }) });
        await renderProjects(searchInput?.value.trim().toLowerCase() || '');
    } catch (error) { alert(error.message); }
}

async function renderProjects(filterTerm = '') {
    const container = document.getElementById('projects-container');
    if (!container || !token) return;

    try {
        const projects = await api('/api/projects');
        const filtered = projects.filter(project => projectMatchesSearch(project, filterTerm));
        container.innerHTML = '';

        if (!filtered.length) {
            container.innerHTML = `<div style="text-align:left;padding:20px 0;color:#858595;width:100%;"><p style="font-size:16px;margin-bottom:8px;">${filterTerm ? 'No matching projects or tasks.' : 'No projects yet.'}</p><p style="font-size:14px;">${filterTerm ? 'Try another search.' : (isAdmin ? 'Click <strong>+ New Project</strong> to create your first project board.' : 'You are not assigned to any active projects yet.')}</p></div>`;
            return;
        }

        filtered.forEach(project => {
            const membersHTML = (project.members || []).map(member => `<div class="member-avatar" title="${escapeHTML(member.name || member.email)}">${escapeHTML(getMemberInitials(member))}</div>`).join('');
            const adminActions = isAdmin ? `<div class="project-actions"><button class="archive-project" onclick="openProjectEdit('${project._id}')">Edit</button><button class="archive-project" onclick="archiveProject('${project._id}')">Archive</button><button class="delete-project" onclick="deleteProject('${project._id}')">Delete</button></div>` : '';

            const board = document.createElement('div');
            board.className = 'project-board';
            board.innerHTML = `<div class="project-header">
                <div class="project-title-section"><div><h2>${escapeHTML(project.title)}</h2>${project.description ? `<p style="font-size:13px;color:#858595;margin-bottom:8px;">${escapeHTML(project.description)}</p>` : ''}<div class="project-members" style="display:flex;gap:6px;align-items:center;margin-top:8px;">${membersHTML}</div></div></div>
                ${adminActions}
            </div>
            <div class="board">${renderColumn(project, 'todo', filterTerm)}${renderColumn(project, 'in-progress', filterTerm)}${renderColumn(project, 'done', filterTerm)}</div>`;
            container.appendChild(board);
        });
    } catch (error) {
        container.innerHTML = `<div style="padding:30px;color:#d85c5c;">${escapeHTML(error.message)}</div>`;
    }
}

async function renderArchive() {
    const projectContainer = document.getElementById('archived-projects-container');
    const taskContainer = document.getElementById('archived-tasks-container');
    if (!projectContainer || !taskContainer) return;

    try {
        const projects = await api('/api/projects/archive');
        const archivedTasks = projects.flatMap(project => (project.tasks || []).filter(task => task.archived && !task.deleted).map(task => ({ ...task, projectTitle: project.title })));

        projectContainer.innerHTML = projects.length ? projects.map(project => `<div class="project-board"><div class="project-header" style="margin-bottom:0;"><div><h3 style="font-size:16px;margin:0;font-weight:600;">${escapeHTML(project.title)}</h3>${project.description ? `<p style="font-size:13px;color:#858595;margin-top:5px;">${escapeHTML(project.description)}</p>` : ''}<p style="font-size:12px;color:#858595;margin-top:7px;">${project.tasks?.length || 0} task(s)</p></div>${isAdmin ? `<div class="project-actions"><button class="archive-project" onclick="restoreProject('${project._id}')">Restore</button></div>` : ''}</div></div>`).join('') : `<p style="color:#858595;padding:10px 0 20px;font-size:13px;">No archived projects.</p>`;

        taskContainer.innerHTML = archivedTasks.length ? archivedTasks.map(task => `<div class="project-board"><div class="project-header" style="margin-bottom:0;"><div><h3 style="font-size:16px;margin:0;font-weight:600;">${escapeHTML(task.title)}</h3><p style="font-size:12px;color:#858595;margin-top:7px;">Project: ${escapeHTML(task.projectTitle)}</p>${task.description ? `<p style="font-size:13px;color:#858595;margin-top:5px;">${escapeHTML(task.description)}</p>` : ''}</div>${isAdmin ? `<div class="project-actions"><button class="archive-project" onclick="restoreTask('${task._id}')">Restore</button></div>` : ''}</div></div>`).join('') : `<p style="color:#858595;padding:10px 0;font-size:13px;">No archived tasks.</p>`;
    } catch (error) {
        projectContainer.innerHTML = `<p style="color:#d85c5c;">${escapeHTML(error.message)}</p>`;
        taskContainer.innerHTML = '';
    }
}

async function renderDashboard() {
    const container = document.getElementById('dashboard-cards');
    if (!container) return;

    try {
        const data = await api('/api/dashboard');
        if (isAdmin) {
            container.innerHTML = [
                ['Total Projects', data.totalProjects], ['Total Tasks', data.totalTasks], ['Total Clients', data.totalClients],
                ['Total Users', data.totalUsers], ['Archived Projects', data.archivedProjects], ['Archived Tasks', data.archivedTasks]
            ].map(item => `<div class="dashboard-card"><h3>${item[0]}</h3><strong>${item[1]}</strong></div>`).join('');
        } else {
            container.innerHTML = [
                ['My Projects', data.myProjects], ['My Tasks', data.myTasks], ['My Pending Tasks', data.myPendingTasks], ['My Completed Tasks', data.myCompletedTasks]
            ].map(item => `<div class="dashboard-card"><h3>${item[0]}</h3><strong>${item[1]}</strong></div>`).join('');
        }
    } catch (error) {
        container.innerHTML = `<p style="color:#d85c5c;">${escapeHTML(error.message)}</p>`;
    }
}

async function renderClients() {
    const container = document.getElementById('clients-list-container');
    if (!container || !isAdmin) return;

    try {
        const clients = await api('/api/clients');
        container.innerHTML = clients.length ? clients.map(client => `<div class="admin-card"><div><h3>${escapeHTML(client.name)}</h3><p>${escapeHTML(client.company || '')}</p><p>${escapeHTML(client.email || '')} ${client.phone ? `· ${escapeHTML(client.phone)}` : ''}</p>${client.address ? `<p>${escapeHTML(client.address)}</p>` : ''}${client.notes ? `<p>${escapeHTML(client.notes)}</p>` : ''}</div><div class="project-actions"><button class="archive-project" onclick="openClientEdit('${client._id}')">Edit</button><button class="delete-project" onclick="deleteClient('${client._id}')">Delete</button></div></div>`).join('') : '<p style="color:#858595;">No clients yet.</p>';
    } catch (error) { container.innerHTML = `<p style="color:#d85c5c;">${escapeHTML(error.message)}</p>`; }
}

async function openClientModal(client = null) {
    if (typeof client === 'string') {
        const clients = await api('/api/clients');
        client = clients.find(item => item._id === client);
    }
    editingClientId = client?._id || null;
    document.getElementById('client-modal-title').textContent = client ? 'Edit Client' : 'Add Client';
    document.getElementById('client-name-input').value = client?.name || '';
    document.getElementById('client-company-input').value = client?.company || '';
    document.getElementById('client-email-input').value = client?.email || '';
    document.getElementById('client-phone-input').value = client?.phone || '';
    document.getElementById('client-address-input').value = client?.address || '';
    document.getElementById('client-notes-input').value = client?.notes || '';
    clientModal?.classList.add('open');
}
window.openClientEdit = openClientModal;

document.getElementById('open-client-modal')?.addEventListener('click', () => openClientModal());
document.getElementById('save-client-btn')?.addEventListener('click', async () => {
    const data = {
        name: document.getElementById('client-name-input').value.trim(),
        company: document.getElementById('client-company-input').value.trim(),
        email: document.getElementById('client-email-input').value.trim(),
        phone: document.getElementById('client-phone-input').value.trim(),
        address: document.getElementById('client-address-input').value.trim(),
        notes: document.getElementById('client-notes-input').value.trim()
    };
    if (!data.name) return alert('Client name is required.');
    try {
        await api(editingClientId ? `/api/clients/${editingClientId}` : '/api/clients', { method: editingClientId ? 'PUT' : 'POST', body: JSON.stringify(data) });
        closeModal(clientModal);
        await renderClients();
    } catch (error) { alert(error.message); }
});

window.deleteClient = async function(id) {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try { await api(`/api/clients/${id}`, { method: 'DELETE' }); await renderClients(); } catch (error) { alert(error.message); }
};

async function renderUsers() {
    const container = document.getElementById('users-list-container');
    if (!container || !isAdmin) return;
    try {
        const users = await api('/api/users');
        container.innerHTML = users.length ? users.map(user => `<div class="admin-card"><div><h3>${escapeHTML(user.name)}</h3><p>${escapeHTML(user.email)}</p></div><div class="user-actions"><select onchange="changeUserRole('${user._id}', this.value)" ${user._id === session.id ? 'disabled' : ''}><option value="employee" ${user.role === 'employee' ? 'selected' : ''}>Employee</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option></select>${user._id !== session.id ? `<button class="delete-project" onclick="deleteUser('${user._id}')">Delete</button>` : ''}</div></div>`).join('') : '<p style="color:#858595;">No users yet.</p>';
    } catch (error) { container.innerHTML = `<p style="color:#d85c5c;">${escapeHTML(error.message)}</p>`; }
}

document.getElementById('open-user-modal')?.addEventListener('click', () => {
    document.getElementById('user-name-input').value = '';
    document.getElementById('user-email-input').value = '';
    document.getElementById('user-password-input').value = '';
    document.getElementById('user-role-input').value = 'employee';
    userModal?.classList.add('open');
});

document.getElementById('save-user-btn')?.addEventListener('click', async () => {
    const name = document.getElementById('user-name-input').value.trim();
    const email = document.getElementById('user-email-input').value.trim().toLowerCase();
    const password = document.getElementById('user-password-input').value;
    const role = document.getElementById('user-role-input').value;
    if (!name || !email || !password) return alert('Please fill in all user fields.');
    try {
        await api('/api/users', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
        closeModal(userModal);
        await renderUsers();
    } catch (error) { alert(error.message); }
});

window.changeUserRole = async function(id, role) {
    try { await api(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }); await renderUsers(); } catch (error) { alert(error.message); await renderUsers(); }
};

window.deleteUser = async function(id) {
    if (!confirm('Are you sure you want to delete this user? They will be removed from projects and task assignments.')) return;
    try { await api(`/api/users/${id}`, { method: 'DELETE' }); await renderUsers(); } catch (error) { alert(error.message); }
};

window.archiveProject = async function(id) {
    try { await api(`/api/projects/${id}/archive`, { method: 'PUT' }); await renderProjects(searchInput?.value.trim().toLowerCase() || ''); } catch (error) { alert(error.message); }
};
window.restoreProject = async function(id) {
    try { await api(`/api/projects/${id}/restore`, { method: 'PUT' }); await renderArchive(); } catch (error) { alert(error.message); }
};
window.deleteProject = async function(id) {
    if (!confirm('Are you sure you want to delete this project? ')) return;
    try { await api(`/api/projects/${id}`, { method: 'DELETE' }); await renderProjects(searchInput?.value.trim().toLowerCase() || ''); } catch (error) { alert(error.message); }
};
window.archiveTask = async function(id) {
    try { await api(`/api/tasks/${id}/archive`, { method: 'PUT' }); await renderProjects(searchInput?.value.trim().toLowerCase() || ''); } catch (error) { alert(error.message); }
};
window.restoreTask = async function(id) {
    try { await api(`/api/tasks/${id}/restore`, { method: 'PUT' }); await renderArchive(); } catch (error) { alert(error.message); }
};
window.deleteTask = async function(id) {
    if (!confirm('Are you sure you want to delete this task? ')) return;
    try { await api(`/api/tasks/${id}`, { method: 'DELETE' }); await renderProjects(searchInput?.value.trim().toLowerCase() || ''); } catch (error) { alert(error.message); }
};

searchInput?.addEventListener('input', event => {
    if (currentSection === 'projects') renderProjects(event.target.value.trim().toLowerCase());
});

if (token) {
    initUserProfile();
    showSection('dashboard');
}
