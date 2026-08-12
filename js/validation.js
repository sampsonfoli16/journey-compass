/* ==========================================================================
   validation.js
   Shared inline validation engine for Journey Compass.

   Used by BOTH the Landing page (student details form) and the Contact page
   (feedback form), so the regex patterns and the "show error under the
   field" behaviour only need to be written once and stay consistent
   everywhere.

   How it works, in plain terms:
   1. Each field has a rule (a regex pattern + a human-readable error).
   2. On every keystroke (input) and on blur (leaving the field), we check
      the field's value against its rule.
   3. If it fails, we add .is-invalid to the wrapping .field-group and
      write the error message into the matching <small class="error-message">.
   4. If it passes, we add .is-valid instead and clear the error text.

   Nothing here uses alert() or the browser's built-in validation popups —
   everything is rendered directly in the page as the brief requires.
   ========================================================================== */

// --- Regex patterns, kept in one place so they're easy to find and tweak ---
const VALIDATION_RULES = {

  // Full name: letters, spaces and hyphens only (covers double-barrelled
  // names like "Anne-Marie"). No digits, no symbols.
  fullname: {
    pattern: /^[A-Za-z]+(?:[\s-][A-Za-z]+)+$/,
    message: "Enter your full name using letters only (first and last name)."
  },

  // Student ID: locked to the cohort format we agreed on — 2028-BSE-045
  studentid: {
    pattern: /^2028-BSE-\d{3}$/,
    message: "Student ID must look like 2028-BSE-000."
  },

  // Student email: accepts the ALU shorthand format (s.foli@alustudent.com)
  // — a single initial, a dot, a surname, then the fixed domain.
  // We keep this specific (rather than "any email") because the brief asks
  // for institutional email matching, not a generic email checker.
  email: {
    pattern: /^[a-z]\.[a-z]+@alustudent\.com$/i,
    message: "Use your student email format, e.g. s.foli@alustudent.com"
  },

  // Mauritian phone number: the standard international format is +230
  // followed by a space, then the 8-digit number split into two groups
  // of four (e.g. +230 5712 3456). This is the one format we accept —
  // no bare local numbers, no dashes, no missing spaces.
  phone: {
    pattern: /^\+230 \d{4} \d{4}$/,
    message: "Enter your number in the standard format, e.g. +230 5712 3456."
  },

  // Contact page message box: just make sure they didn't submit it empty
  // or with only a couple of characters.
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

  // Empty field: mark invalid but with a gentler "required" message
  // rather than the specific format message — it's less confusing for
  // someone who just hasn't typed anything yet.
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

  // Validate as they type — gives the fastest possible feedback
  input.addEventListener("input", () => validateField(input, ruleKey));

  // Also validate on blur, in case someone tabs through without typing
  // (e.g. autofill) — makes sure the state is never left unchecked
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

  // Pulls out just the digits the student has actually typed, ignoring
  // the prefix itself and anything that isn't a number, capped at 8
  function extractDigits(value) {
    const afterPrefix = value.startsWith("+230") ? value.slice(4) : value;
    return afterPrefix.replace(/\D/g, "").slice(0, 8);
  }

  // Rebuilds the full "+230 XXXX XXXX" string from those digits
  function formatValue(digits) {
    if (digits.length <= 4) return PREFIX + digits;
    return PREFIX + digits.slice(0, 4) + " " + digits.slice(4);
  }

  // Pre-fill the prefix immediately, before the student has touched
  // the field at all
  if (!input.value) {
    input.value = PREFIX;
  }

  input.addEventListener("focus", () => {
    if (!input.value) input.value = PREFIX;
    // Land the cursor after the prefix rather than at the very start
    const pos = input.value.length;
    requestAnimationFrame(() => input.setSelectionRange(pos, pos));
  });

  input.addEventListener("input", () => {
    const digits = extractDigits(input.value);
    input.value = formatValue(digits);
    const pos = input.value.length;
    input.setSelectionRange(pos, pos);
  });

  // Stops backspace/delete from eating into the fixed prefix
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
