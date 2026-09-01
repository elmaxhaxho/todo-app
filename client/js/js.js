document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('signup.html')) {
        const signupForm = document.querySelector('.signup-form');
        signupForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Account created successfully!');
                    window.location.href = 'login.html';
                } else {
                    alert(data.message || 'Signup failed.');
                }
            } catch (error) {
                alert('Could not connect to the server.');
            }
        });
    }






    if (path.includes('login.html')) {
        const loginForm = document.querySelector('.login-form');
        loginForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    if (data.name) localStorage.setItem('username', data.name);
                    window.location.href = 'index.html';
                } else {
                    alert(data.message || 'Login failed.');
                }
            } catch (error) {
                alert('Could not connect to the server.');
            }
        });
    }




    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        let currentFilter = 'all'; 
        let searchQuery = '';
        let softDeletedIds = [];
        let allTasks = [];





        const usernameSpan = document.querySelector('.username');
        const savedUsername = localStorage.getItem('username');
        if (usernameSpan && savedUsername) usernameSpan.textContent = savedUsername;

        loadTasks();

        async function loadTasks() {
            try {
                const response = await fetch('/api/todos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    allTasks = await response.json();
                    renderTasks();
                } else if (response.status === 401) {
                    logout();
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        }






        function renderTasks() {
            const container = document.querySelector('.tasks');
            if (!container) return;

            const filtered = allTasks.filter(task => {
                if (softDeletedIds.includes(task._id)) return false;

                const matchesCategory = 
                    currentFilter === 'all' ||
                    (currentFilter === 'completed' && task.completed) ||
                    (currentFilter === 'pending' && !task.completed);

                const query = searchQuery.toLowerCase().trim();
                const matchesSearch = 
                    task.title.toLowerCase().includes(query) || 
                    (task.description && task.description.toLowerCase().includes(query));

                return matchesCategory && matchesSearch;
            });

            if (filtered.length === 0) {
                container.innerHTML = `<p style="grid-column: 1/-1;">No tasks found.</p>`;
                return;
            }

            container.innerHTML = filtered.map(task => `
                <div class="task-card" data-id="${task._id}">
                    <div class="task-info">
                        <h2>${task.title}</h2>
                        <p>${task.description || ''}</p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="task-status ${task.completed ? 'completed' : ''}" data-id="${task._id}" data-completed="${task.completed}">
                            ${task.completed ? 'Completed ✓' : 'Not completed'}
                        </button>
                        <button class="delete-btn" data-id="${task._id}" style="background-color: #ff4d4d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');





            document.querySelectorAll('.task-status').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const isCompleted = e.target.getAttribute('data-completed') === 'true';

                    try {
                        const response = await fetch(`/api/todos/${id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ completed: !isCompleted })
                        });
                        if (response.ok) loadTasks();
                    } catch (err) {
                        console.error('Error toggling task status:', err);
                    }
                });
            });




            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    softDeletedIds.push(id);
                    renderTasks();
                });
            });
        }




        const searchInput = document.getElementById('search-input');
        searchInput?.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });




        const addTaskForm = document.querySelector('.add-task-form');
        addTaskForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('task-title');
            const descInput = document.getElementById('task-desc');

            try {
                const response = await fetch('/api/todos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: titleInput.value,
                        description: descInput.value
                    })
                });

                if (response.ok) {
                    titleInput.value = '';
                    descInput.value = '';
                    loadTasks();
                } else {
                    const errData = await response.json();
                    alert(errData.message || 'Failed to create task.');
                }
            } catch (err) {
                console.error('Error adding task:', err);
                alert('Could not reach the server.');
            }
        });




        const navItems = document.querySelectorAll('.navigation .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const text = item.textContent.toLowerCase();
                if (text.includes('home')) currentFilter = 'all';
                else if (text.includes('completed')) currentFilter = 'completed';
                else if (text.includes('pending')) currentFilter = 'pending';

                const pageTitle = document.getElementById('page-title');
                if (pageTitle) {
                    pageTitle.textContent = currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1) + ' Tasks';
                }
                renderTasks();
            });
        });





        const logoutBtn = document.querySelector('.logout');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });


        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
        }
    }
});