// Student Task Manager
// Handles task storage, rendering, filters, sorting, validation, and theme toggling.

const STORAGE_KEY = 'student-task-manager.tasks';
const THEME_KEY = 'student-task-manager.theme';

const state = {
  tasks: [],
  editingId: null,
  filters: {
    search: '',
    status: 'All',
    priority: 'All',
    category: 'All',
  },
  sort: 'dueDate-nearest',
};

const form = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const formMessage = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const priorityFilter = document.getElementById('priority-filter');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const themeToggle = document.getElementById('theme-toggle');
const logoutBtn = document.getElementById('logout-btn');

const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const pendingCount = document.getElementById('pending-count');
const overdueCount = document.getElementById('overdue-count');

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  const isLoggedIn = localStorage.getItem('student-task-manager.loggedIn') === 'true';

  if (!isLoggedIn) {
    window.location.href = 'login.html';
    return;
  }

  bindEvents();
  loadTheme();
  loadTasks();
  renderAll();
}

function bindEvents() {
  form.addEventListener('submit', handleFormSubmit);
  cancelEditBtn.addEventListener('click', clearForm);

  searchInput.addEventListener('input', (event) => {
    state.filters.search = event.target.value.trim();
    renderTasks();
  });

  statusFilter.addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderTasks();
  });

  priorityFilter.addEventListener('change', (event) => {
    state.filters.priority = event.target.value;
    renderTasks();
  });

  categoryFilter.addEventListener('change', (event) => {
    state.filters.category = event.target.value;
    renderTasks();
  });

  sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderTasks();
  });

  themeToggle.addEventListener('click', toggleDarkMode);
  logoutBtn.addEventListener('click', logoutStudent);

  taskList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const taskId = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === 'toggle-status') {
      toggleTaskStatus(taskId);
    }

    if (action === 'edit') {
      editTask(taskId);
    }

    if (action === 'delete') {
      deleteTask(taskId);
    }
  });
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    state.tasks = Array.isArray(saved) ? saved : [];
  } catch (error) {
    state.tasks = [];
    console.error('Unable to load tasks:', error);
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function renderAll() {
  updateStatistics();
  renderTasks();
}

function updateStatistics() {
  totalCount.textContent = state.tasks.length;
  completedCount.textContent = state.tasks.filter((task) => task.completed).length;
  pendingCount.textContent = state.tasks.filter((task) => !task.completed && !isOverdue(task)).length;
  overdueCount.textContent = state.tasks.filter((task) => !task.completed && isOverdue(task)).length;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  if (!visibleTasks.length) {
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  taskList.innerHTML = visibleTasks
    .map(
      (task) => `
        <article class="task-card ${task.completed ? 'completed' : ''} ${!task.completed && isOverdue(task) ? 'overdue' : ''}" data-id="${task.id}">
          <div class="task-card-top">
            <div class="task-main">
              <div class="task-header-row">
                <span class="completion-mark" aria-hidden="true">✓</span>
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
              </div>
              <p class="task-description">${escapeHtml(task.description || 'No description provided.')}</p>
            </div>

            <div class="task-actions">
              <button type="button" class="task-action" data-id="${task.id}" data-action="toggle-status">
                ${task.completed ? 'Mark as Pending' : 'Complete'}
              </button>
              <button type="button" class="task-action" data-id="${task.id}" data-action="edit">Edit</button>
              <button type="button" class="task-delete-btn" data-id="${task.id}" data-action="delete">Delete</button>
            </div>
          </div>

          <div class="task-details">
            <span class="detail-pill"><strong>Subject:</strong> ${escapeHtml(task.subject)}</span>
            <span class="detail-pill"><strong>Due:</strong> ${escapeHtml(formatDate(task.dueDate))}</span>
            <span class="priority-badge ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
            <span class="category-badge">${escapeHtml(task.category)}</span>
            <span class="status-badge ${getTaskStatus(task).toLowerCase()}">${getTaskStatus(task)}</span>
          </div>
        </article>
      `,
    )
    .join('');
}

function getVisibleTasks() {
  let tasks = [...state.tasks];
  const searchValue = state.filters.search.toLowerCase();

  if (searchValue) {
    tasks = tasks.filter((task) => {
      const targetText = [task.title, task.subject, task.description].join(' ').toLowerCase();
      return targetText.includes(searchValue);
    });
  }

  if (state.filters.status !== 'All') {
    tasks = tasks.filter((task) => getTaskStatus(task) === state.filters.status);
  }

  if (state.filters.priority !== 'All') {
    tasks = tasks.filter((task) => task.priority === state.filters.priority);
  }

  if (state.filters.category !== 'All') {
    tasks = tasks.filter((task) => task.category === state.filters.category);
  }

  tasks.sort((a, b) => sortTasks(a, b, state.sort));

  return tasks;
}

function sortTasks(a, b, sortKey) {
  switch (sortKey) {
    case 'dueDate-latest':
      return new Date(b.dueDate) - new Date(a.dueDate);
    case 'priority-high':
      return getPriorityRank(b.priority) - getPriorityRank(a.priority);
    case 'priority-low':
      return getPriorityRank(a.priority) - getPriorityRank(b.priority);
    case 'recent':
      return new Date(b.createdAt) - new Date(a.createdAt);
    case 'dueDate-nearest':
    default:
      return new Date(a.dueDate) - new Date(b.dueDate);
  }
}

function getPriorityRank(priority) {
  const rank = { Low: 1, Medium: 2, High: 3 };
  return rank[priority] || 0;
}

function getTaskStatus(task) {
  if (task.completed) {
    return 'Completed';
  }

  if (isOverdue(task)) {
    return 'Overdue';
  }

  return 'Pending';
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  return dueDate < today;
}

function handleFormSubmit(event) {
  event.preventDefault();

  const taskData = collectFormData();

  if (!validateTask(taskData)) {
    return;
  }

  if (state.editingId !== null) {
    updateTask(taskData, state.editingId);
  } else {
    addTask(taskData);
  }
}

function collectFormData() {
  return {
    title: document.getElementById('task-title').value.trim(),
    description: document.getElementById('task-description').value.trim(),
    subject: document.getElementById('task-subject').value.trim(),
    dueDate: document.getElementById('task-date').value,
    priority: document.getElementById('task-priority').value,
    category: document.getElementById('task-category').value,
  };
}

function validateTask(task) {
  if (!task.title || !task.subject || !task.dueDate) {
    showFormMessage('Please fill in the task title, subject, and due date.', true);
    return false;
  }

  return true;
}

function addTask(taskData) {
  const newTask = {
    id: Date.now() + Math.random(),
    title: taskData.title,
    description: taskData.description,
    subject: taskData.subject,
    dueDate: taskData.dueDate,
    priority: taskData.priority,
    category: taskData.category,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  state.tasks.unshift(newTask);
  saveTasks();
  renderAll();
  clearForm();
  showFormMessage('Task added successfully!', false);
}

function updateTask(taskData, taskId) {
  const taskToUpdate = state.tasks.find((task) => task.id === taskId);

  if (!taskToUpdate) {
    return;
  }

  taskToUpdate.title = taskData.title;
  taskToUpdate.description = taskData.description;
  taskToUpdate.subject = taskData.subject;
  taskToUpdate.dueDate = taskData.dueDate;
  taskToUpdate.priority = taskData.priority;
  taskToUpdate.category = taskData.category;

  saveTasks();
  renderAll();
  clearForm();
  showFormMessage('Task updated successfully!', false);
}

function editTask(taskId) {
  const taskToEdit = state.tasks.find((task) => task.id === taskId);

  if (!taskToEdit) {
    return;
  }

  state.editingId = taskId;
  formTitle.textContent = 'Edit Task';
  submitBtn.textContent = 'Update Task';
  cancelEditBtn.classList.remove('hidden');

  document.getElementById('task-title').value = taskToEdit.title;
  document.getElementById('task-description').value = taskToEdit.description || '';
  document.getElementById('task-subject').value = taskToEdit.subject;
  document.getElementById('task-date').value = taskToEdit.dueDate;
  document.getElementById('task-priority').value = taskToEdit.priority;
  document.getElementById('task-category').value = taskToEdit.category;

  showFormMessage('Editing task. Update the information and save changes.', false);
  document.getElementById('task-title').focus();
}

function clearForm() {
  form.reset();
  state.editingId = null;
  formTitle.textContent = 'Add New Task';
  submitBtn.textContent = 'Add Task';
  cancelEditBtn.classList.add('hidden');
  document.getElementById('task-priority').value = 'Medium';
  document.getElementById('task-category').value = 'Assignment';
  formMessage.textContent = '';
  formMessage.className = 'form-message';
}

function deleteTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const confirmed = window.confirm(`Delete "${task.title}"? This action cannot be undone.`);
  if (!confirmed) {
    return;
  }

  state.tasks = state.tasks.filter((item) => item.id !== taskId);

  if (state.editingId === taskId) {
    clearForm();
  }

  saveTasks();
  renderAll();
}

function toggleTaskStatus(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  task.completed = !task.completed;
  saveTasks();
  renderAll();
}

function showFormMessage(message, isError) {
  formMessage.textContent = message;
  formMessage.className = isError ? 'form-message error' : 'form-message success';
}

function toggleDarkMode() {
  const currentTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = currentTheme;
  localStorage.setItem(THEME_KEY, currentTheme);
  updateThemeButton(currentTheme);
}

function logoutStudent() {
  localStorage.removeItem('student-task-manager.loggedIn');
  localStorage.removeItem('student-task-manager.studentName');
  window.location.href = 'login.html';
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  document.body.dataset.theme = savedTheme;
  updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
  const isDark = theme === 'dark';
  themeToggle.innerHTML = `${isDark ? '<span aria-hidden="true">☀️</span>' : '<span aria-hidden="true">🌙</span>'}<span>${isDark ? 'Light Mode' : 'Dark Mode'}</span>`;
}

function formatDate(dateString) {
  if (!dateString) return 'No date';

  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
