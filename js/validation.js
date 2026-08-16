/*
   validation.js
   Shared validation logic used by the landing and contact forms.

   This keeps the rules in one place so the same checks are used everywhere,
   and the page can show a clear inline error without relying on browser
   pop-ups or alerts.
*/

// The regex rules are kept here so they are easy to review and adjust.
const VALIDATION_RULES = {

  // Full name: letters, spaces, and hyphens only. This covers names like "Anne-Marie" without allowing digits or symbols.
  fullname: {
    pattern: /^[A-Za-z]+(?:[\s-][A-Za-z]+)+$/,
    message: "Enter your full name using letters only (first and last name)."
  },

  // Student ID must follow the set ALU format: 2028-BSE-045.
  studentid: {
    pattern: /^2028-BSE-\d{3}$/,
    message: "Student ID must look like 2028-BSE-000."
  },

  // Student email follows the ALU pattern: a single initial, a dot, surname, then the fixed student domain.
  // This is intentional rather than a generic email check, because the brief expects the institutional format.
  email: {
    pattern: /^[a-z]\.[a-z]+@alustudent\.com$/i,
    message: "Use your student email format, e.g. s.foli@alustudent.com"
  },

  // Mauritian phone numbers must use the +230 international format with the usual space split, such as +230 5712 3456.
  phone: {
    pattern: /^\+230 \d{4} \d{4}$/,
    message: "Enter your number in the standard format, e.g. +230 5712 3456."
  },

  // The message field should not be empty and should be long enough to be meaningful.
  message: {
    pattern: /^.{10,}$/,
    message: "Please write at least 10 characters so we know what you mean."
  }
};

/**
 * Checks a single field's current value against its rule and updates
 * the UI (border colour + error text) to match.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} input - the field being checked
 * @param {string} ruleKey - which entry in VALIDATION_RULES to use
 * @returns {boolean} true if the field is currently valid
 */
function validateField(input, ruleKey) {
  const rule = VALIDATION_RULES[ruleKey];
  const group = document.getElementById(`group-${ruleKey}`);
  const errorEl = document.getElementById(`error-${ruleKey}`);
  const value = input.value.trim();

  // Empty fields should feel gentler than format errors, since the user may just not have typed anything yet.
  if (value === "") {
    group.classList.remove("is-valid");
    group.classList.add("is-invalid");
    errorEl.textContent = "This field is required.";
    return false;
  }

  const passes = rule.pattern.test(value);

  if (passes) {
    group.classList.remove("is-invalid");
    group.classList.add("is-valid");
    errorEl.textContent = "";
  } else {
    group.classList.remove("is-valid");
    group.classList.add("is-invalid");
    errorEl.textContent = rule.message;
  }

  return passes;
}

/**
 * Wires up live validation (on input + on blur) for a given field.
 * Called once per field when the page loads.
 */
function attachLiveValidation(fieldId, ruleKey) {
  const input = document.getElementById(fieldId);
  if (!input) return; // field might not exist on this particular page

  // Check the field while the student types so feedback appears immediately.
  input.addEventListener("input", () => validateField(input, ruleKey));

  // Also validate on blur in case the student tabs through without typing, or autofill fills the value in.
  input.addEventListener("blur", () => validateField(input, ruleKey));
}

/**
 * Pre-fills a phone field with the fixed "+230 " prefix and formats what
 * the student types into "+230 XXXX XXXX" as they go, so they only ever
 * have to type the 8 digits, never the country code or the space between
 * groups.
 *
 * @param {string} fieldId - id of the phone <input>
 */
function attachPhoneMask(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return; // field might not exist on this particular page

  const PREFIX = "+230 ";

  // Strip out the country code and any non-numeric characters, keeping only the 8 digits the student actually types.
  function extractDigits(value) {
    const afterPrefix = value.startsWith("+230") ? value.slice(4) : value;
    return afterPrefix.replace(/\D/g, "").slice(0, 8);
  }

  // Rebuild the full +230 XXXX XXXX format from those digits.
  function formatValue(digits) {
    if (digits.length <= 4) return PREFIX + digits;
    return PREFIX + digits.slice(0, 4) + " " + digits.slice(4);
  }

  // Prefill the +230 prefix right away so the field already looks like the intended format.
  if (!input.value) {
    input.value = PREFIX;
  }

  input.addEventListener("focus", () => {
    if (!input.value) input.value = PREFIX;
    // Place the caret after the prefix so the student starts typing in the right spot.
    const pos = input.value.length;
    requestAnimationFrame(() => input.setSelectionRange(pos, pos));
  });

  input.addEventListener("input", () => {
    const digits = extractDigits(input.value);
    input.value = formatValue(digits);
    const pos = input.value.length;
    input.setSelectionRange(pos, pos);
  });

  // Prevent backspace and delete from disturbing the fixed prefix.
  input.addEventListener("keydown", (event) => {
    const cursorAtOrBeforePrefix = input.selectionStart <= PREFIX.length;
    if (event.key === "Backspace" && cursorAtOrBeforePrefix) {
      event.preventDefault();
    }
  });
}

/**
 * Runs validation on every field passed in, and returns whether ALL of
 * them passed. Used on form submit, since a submit shouldn't proceed
 * with any invalid field, even ones the user never touched.
 */
function validateAll(fieldRulePairs) {
  let allValid = true;
  fieldRulePairs.forEach(([fieldId, ruleKey]) => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const passed = validateField(input, ruleKey);
    if (!passed) allValid = false;
  });
  return allValid;
}
