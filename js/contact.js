/*
  contact.js
  Handles the feedback form, including live validation and a friendly success state.
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const successPanel = document.getElementById("feedback-success");
  const resetBtn = document.getElementById("feedback-reset-btn");

  const fields = [
    ["fullname", "fullname"],
    ["email", "email"],
    ["message", "message"]
  ];

  fields.forEach(([fieldId, ruleKey]) => attachLiveValidation(fieldId, ruleKey));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const allValid = validateAll(fields);

    if (!allValid) {
      const firstInvalid = document.querySelector(".field-group.is-invalid input, .field-group.is-invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Everything validated, so we swap the form for a thank-you message.
    form.hidden = true;
    successPanel.hidden = false;
  });

  // This lets someone send another message without a full page reload.
  resetBtn.addEventListener("click", () => {
    form.reset();
    // Clear any old validation styling before the form is shown again.
    document.querySelectorAll(".field-group").forEach((group) => {
      group.classList.remove("is-valid", "is-invalid");
    });
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
    });

    successPanel.hidden = true;
    form.hidden = false;
  });
});
