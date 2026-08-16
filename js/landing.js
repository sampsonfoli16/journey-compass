/*
  landing.js
  Handles the intake form: validates each field, keeps the phone input tidy,
  and saves the student details before sending them into the quiz.
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("student-form");

  if (!form) return;

  // Each field is paired with the rule that decides whether it is valid.
  const fields = [
    ["fullname", "fullname"],
    ["studentid", "studentid"],
    ["email", "email"],
    ["phone", "phone"]
  ];

  // The phone field starts with the +230 prefix and auto-formats as the
  // student types, so they only enter the 8-digit number and not the rest.
  // We attach the mask before live validation so the typed value is formatted
  // first and then checked against the corrected version.
  attachPhoneMask("phone");

  // Enable inline validation while the student types, so issues are caught early.
  fields.forEach(([fieldId, ruleKey]) => attachLiveValidation(fieldId, ruleKey));

  form.addEventListener("submit", (event) => {
    // We handle the submit ourselves, so the browser does not reload the page.
    event.preventDefault();

    const allValid = validateAll(fields);

    if (!allValid) {
      // Move focus to the first invalid field so the student knows what to fix next.
      const firstInvalid = document.querySelector(".field-group.is-invalid input");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Everything is valid, so we save the student's details for this visit only.
    // sessionStorage is intentional here so the data disappears after the session.
    const studentInfo = {
      fullname: document.getElementById("fullname").value.trim(),
      studentid: document.getElementById("studentid").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim()
    };
    sessionStorage.setItem("jc_student", JSON.stringify(studentInfo));

    // On to the quiz
    window.location.href = "quiz.html";
  });
});
