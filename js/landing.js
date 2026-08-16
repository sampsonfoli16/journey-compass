/* 
   landing.js
   Handles the student details form on the Landing page:
    attaches live validation to each field
    blocks submission until everything passes
    saves the student's details so the Results page can greet them by
     name later, then sends them into the quiz
    */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("student-form");

  if (!form) return;

  // Fields on this page, paired with the rule that applies to each one
  const fields = [
    ["fullname", "fullname"],
    ["studentid", "studentid"],
    ["email", "email"],
    ["phone", "phone"]
  ];

  // The phone field gets the "+230 " prefix pre-filled and auto-formats
  // as the student types, so they only ever have to enter the 8 digits.
  // This is attached BEFORE live validation below, so on every keystroke
  // the value gets reformatted first, then validated against the
  // now-correctly-formatted result.
  attachPhoneMask("phone");

  // Turn on live (type-as-you-go) validation for each field
  fields.forEach(([fieldId, ruleKey]) => attachLiveValidation(fieldId, ruleKey));

  form.addEventListener("submit", (event) => {
    // We're handling submission ourselves, so stop the page from
    // trying to actually navigate/reload via the default form action
    event.preventDefault();

    const allValid = validateAll(fields);

    if (!allValid) {
      // Move focus to the first invalid field so the student immediately
      // sees what needs fixing, instead of guessing
      const firstInvalid = document.querySelector(".field-group.is-invalid input");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Everything passed — save the student's info in sessionStorage so
    // the Results page can personalise the greeting later. sessionStorage
    // (not localStorage) is deliberate: this data should only last for
    // this one visit, not linger on a shared lab computer.
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
