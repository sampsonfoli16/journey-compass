# Journey Compass

A soft-skills reflection quiz built for ALU BSE students, a short, validated intake form, a timed quiz mixing multiple-choice and interactive media questions, and a results page that maps a student's answers to a personalised Learning Journey Plan.

Built by **Sampson Foli** for the Frontend Web Development module.

## Live pages

| Page | File | What it does |
|---|---|---|
| Landing | `index.html` | Hero intro + a validated student-details form (name, student ID, email, phone) |
| Quiz | `quiz.html` | An 8-question, 240-second timed quiz with MCQ, audio, and image-hotspot questions |
| Results | `results.html` | Score breakdown by category, top-strength compass, and a Learning Journey Plan |
| Contact & Feedback | `contact.html` | Author details, GitHub link, and a validated feedback form |

## Features

- **Inline form validation**: every form field (name, student ID, ALU email, Mauritian phone number, feedback message) is checked live as you type and again on blur, with plain-language error messages rendered in the page. No `alert()` popups, no native browser validation UI.
- **Timed quiz**: an 8-question quiz with a 240-second countdown. The timer visibly warns under 30 seconds remaining, and the quiz locks with a "time's up" overlay if the countdown reaches zero before the student finishes.
- **Two interactive media question types**
  - **Audio scenario**: a recorded voice clip with custom play/pause/replay controls (no native `<audio>` UI).
  - **Image hotspot**: the student clicks a zone directly on an illustration rather than picking from a text list.
- **Scoring engine**: every answer awards points across four soft-skill categories (Communication, Critical Thinking, Time Management, Leadership). Answering quickly and consistently (a "streak" of confident answers) applies a small score multiplier, so two students who pick identical answers can still land slightly differently depending on pace.
- **Results page**: percentages are normalised so the four categories always sum to 100% (a share-of-total model, not an independent 0-100 score per category). The page renders an animated bar per category, highlights the top strength with a rotating compass needle, and shows a tailored "next step" recommendation for that strength.
- **Session-only storage**: student details and quiz results are kept in `sessionStorage`, not `localStorage`, so nothing lingers after the tab closes (important on shared lab machines).

## Project structure

```
journey-compass/
├── index.html            # Landing page + student details form
├── quiz.html              # Quiz shell (questions render dynamically from JSON)
├── results.html            # Results + Learning Journey Plan
├── contact.html            # Author info + feedback form
├── css/
│   ├── style.css          # Shared design tokens, header/footer, buttons, form fields
│   ├── landing.css         # Landing page hero + form section
│   ├── quiz.css            # Timer, progress bar, question card, hotspot/audio styling
│   ├── results.css         # Score bars, compass, plan card
│   └── contact.css         # Author card + feedback form layout
├── js/
│   ├── validation.js        # Shared regex-based validation engine (used by landing + contact forms)
│   ├── landing.js          # Landing form submit handler, saves student info to sessionStorage
│   ├── quiz.js             # Renders questions, handles answer selection, drives the quiz flow
│   ├── scoring.js          # Point tallying, speed/streak multiplier, percentage normalisation
│   ├── timer.js            # Generic reusable countdown timer
│   ├── media.js            # Audio controls + image-hotspot click detection
│   ├── menu.js             # Mobile nav toggle + accessible hamburger behavior
│   ├── results.js          # Reads sessionStorage results, renders the Results page
│   └── contact.js          # Feedback form submit handler + success state
├── data/
│   └── questions.json      # All 8 questions, their options/zones, and score weightings
└── assets/
    ├── images/            # Hotspot illustration(s)
    └── audio/             # Recorded scenario audio clip
```

## How the scoring works

Each answer option in `data/questions.json` carries a `scores` object, e.g.:

```json
{ "label": "Step up and reorganize the plan for everyone", "scores": { "leadership": 3 } }
```

As the student answers each question, `scoring.js` adds those points into a running total per category, applying a small multiplier for quick, confident answers. At the end, `normalizeScores()` converts the four raw totals into percentages **as a share of the combined total**, meaning the four percentages always add up to 100%. A student can score highest in multiple areas relative to each other, but the four numbers together will always sum to 100 (e.g. Communication 40% / Critical Thinking 25% / Time Management 20% / Leadership 15%).

## Running it locally

No build step, no dependencies, it's plain HTML/CSS/JS.

1. Clone the repo:
   ```
   git clone https://github.com/sampsonfoli16/journey-compass.git
   ```
2. Open `index.html` directly in a browser, **or** serve the folder locally (recommended, since `fetch()` for `data/questions.json` can be blocked by some browsers on the `file://` protocol):
   ```
   npx serve .
   ```
   or, with Python:
   ```
   python3 -m http.server 8000
   ```
3. Visit the local address it gives you, and start from the landing page.

## Contact

- GitHub: [github.com/sampsonfoli16](https://github.com/sampsonfoli16)
- Email: s.foli@alustudent.com
- Phone: +230 5844 1629
