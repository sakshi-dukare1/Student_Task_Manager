const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('student-task-manager.loggedIn') === 'true') {
    window.location.href = 'index.html';
    return;
  }

  loginForm.addEventListener('submit', handleLogin);
});

function handleLogin(event) {
  event.preventDefault();

  const name = document.getElementById('student-name').value.trim();
  const email = document.getElementById('student-email').value.trim();
  const password = document.getElementById('student-password').value.trim();

  if (!name || !email || !password) {
    setLoginMessage('Please enter your name, email, and password.', true);
    return;
  }

  if (!email.includes('@')) {
    setLoginMessage('Please enter a valid email address.', true);
    return;
  }

  localStorage.setItem('student-task-manager.loggedIn', 'true');
  localStorage.setItem('student-task-manager.studentName', name);
  localStorage.setItem('student-task-manager.studentEmail', email);

  setLoginMessage('Login successful! Redirecting to your dashboard...', false);

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

function setLoginMessage(message, isError) {
  loginMessage.textContent = message;
  loginMessage.className = isError ? 'login-message error' : 'login-message success';
}
