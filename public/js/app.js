// PASSWORD TOGGLE FOR LOGIN & REGISTER
document.addEventListener('DOMContentLoaded', function() {
  function togglePassword(id, toggleId) {
    const input = document.getElementById(id);
    const toggle = document.getElementById(toggleId);
    const icon = toggle.querySelector('i');
    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  }

  const toggleElements = document.querySelectorAll('[id^="togglePassword"]');
  toggleElements.forEach(toggleEl => {
    const inputId = toggleEl.dataset.input;
    toggleEl.addEventListener('click', () => togglePassword(inputId, toggleEl.id));
  });
});