/*  contact.js*/

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

    // Everything passed. Swap the form out for a confirmation message
    form.hidden = true;
    successPanel.hidden = false;
  });

  // Lets someone submit a second message without reloading the page
  resetBtn.addEventListener("click", () => {
    form.reset();
    // Clear validation state left over from the previous submission
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
