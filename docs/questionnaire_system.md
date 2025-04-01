**InnerFlame Questionnaire System Documentation**

**Version:** 1.1
**Date:** 2023-10-27

**Table of Contents:**

1.  [Overview](#overview)
2.  [Core Concepts](#core-concepts)
3.  [Database Schema](#database-schema)
    *   [Table: `questionnaires`](#table-questionnaires)
    *   [Table: `questionnaire_responses`](#table-questionnaire_responses)
4.  [Questionnaire Structure JSON (`questionnaires.structure`)](#questionnaire-structure-json-questionnairesstructure)
    *   [Overall Structure](#overall-structure)
    *   [Common Fields for All Items](#common-fields-for-all-items)
    *   [Item Types](#item-types)
        *   [1. `single_choice`](#1-single_choice)
        *   [2. `multiple_choice`](#2-multiple_choice)
        *   [3. `text_input`](#3-text_input)
        *   [4. `text_area`](#4-text_area)
        *   [5. `scale`](#5-scale)
        *   [6. `boolean`](#6-boolean)
        *   [7. `info_step`](#7-info_step)
5.  [User Response JSON (`questionnaire_responses.responses`)](#user-response-json-questionnaire_responsesresponses)
6.  [Workflow](#workflow)
    *   [Initiating a Questionnaire](#initiating-a-questionnaire)
    *   [Rendering Steps](#rendering-steps)
    *   [Handling Conditional Steps (`info_step`)](#handling-conditional-steps-info_step)
    *   [Saving Responses](#saving-responses)
    *   [Completion](#completion)
7.  [Versioning and Activation](#versioning-and-activation)
8.  [Use Cases](#use-cases)
9.  [Best Practices & Considerations](#best-practices--considerations)
10. [Complete Example (`questionnaires.structure`)](#complete-example-questionnairesstructure)

---

## 1. Overview

The InnerFlame Questionnaire System provides a flexible and maintainable way to define, manage, and deploy various questionnaires within the application (e.g., user onboarding, feedback surveys). It leverages a database-driven approach where the structure of a questionnaire (questions, informational steps, options, conditions) is defined in JSON, allowing for modifications without code changes. User responses are stored separately, linked to the specific version of the questionnaire they answered.

**Key Benefits:**

*   **Flexibility:** Easily add, remove, or modify questions, options, and informational content.
*   **Maintainability:** Questionnaire changes don't require code deployments.
*   **Versioning:** Track changes to questionnaires over time and ensure user responses are tied to the version they saw.
*   **Scalability:** Supports various question types and can be extended for future needs.
*   **Conditional Logic:** Display informational steps dynamically based on user answers.

## 2. Core Concepts

*   **Questionnaire:** A defined set of questions and informational steps presented to a user for a specific purpose (e.g., onboarding).
*   **Questionnaire Version:** A specific snapshot of a questionnaire's structure at a point in time. Identified by `type` and `version` number.
*   **Active Version:** The specific version of a questionnaire currently presented to new users (marked by `is_active = true`).
*   **Structure (`structure` JSON):** An ordered array defining the sequence of questions and informational steps within a questionnaire version.
*   **Item:** An individual element within the `structure` array (can be a question or an informational step).
*   **Response (`responses` JSON):** A JSON object storing a user's answers for a specific instance of a questionnaire, mapping question IDs to answer values.
*   **Conditional Step:** An `info_step` that is only displayed if a specific condition based on a previous answer is met.

## 3. Database Schema

Two primary tables support this system:

### Table: `questionnaires`

Stores the definitions and metadata for different versions of questionnaires.

| Column      | Type      | Constraints/Index | Description                                                                      | Example                 |
| :---------- | :-------- | :---------------- | :------------------------------------------------------------------------------- | :---------------------- |
| `id`        | UUID      | Primary Key       | Unique identifier for this specific questionnaire version.                         | `uuid_generate_v4()`    |
| `name`      | TEXT      |                   | Human-readable name for internal reference (e.g., "Onboarding v1.1").            | `"Onboarding Q1 2024"`  |
| `type`      | TEXT      | Index             | Category of the questionnaire (e.g., 'onboarding', 'feedback').                  | `'onboarding'`          |
| `version`   | INTEGER   | Index             | Sequential version number *within* a specific `type`.                            | `1`                     |
| `structure` | JSONB     |                   | **The core definition:** An ordered array of question and info_step objects.      | `[{ "id": "q1", ...}]` |
| `is_active` | BOOLEAN   | Index             | If `true`, this is the current version presented for its `type`. (Ensure only 1 active per type). | `true`                  |
| `created_at`| TIMESTAMP | Default `now()`   | Timestamp of creation.                                                           | `timestamp`             |
| `updated_at`| TIMESTAMP | Default `now()`   | Timestamp of last update.                                                        | `timestamp`             |

*   **Indices:**
    *   `(type, version)`: Unique index recommended.
    *   `(type, is_active)`: For quickly finding the active questionnaire for a given type.

### Table: `questionnaire_responses`

Stores user progress and answers for a specific questionnaire instance they interacted with.

| Column                   | Type      | Constraints/Index | Description                                                                 | Example                |
| :----------------------- | :-------- | :---------------- | :-------------------------------------------------------------------------- | :--------------------- |
| `id`                     | UUID      | Primary Key       | Unique identifier for this user's attempt/response set.                     | `uuid_generate_v4()`   |
| `user_id`                | UUID      | FK to `users.id`, Index | The user who answered the questionnaire.                                    | `user's_uuid`          |
| `questionnaire_id`       | UUID      | FK to `questionnaires.id`, Index | **Links to the specific version** the user answered.                 | `questionnaire's_uuid` |
| `responses`              | JSONB     |                   | Stores user answers as { "questionId": answerValue, ... }.                  | `{"q1": "a1", ...}`  |
| `status`                 | TEXT      | Index             | Current status (e.g., 'not_started', 'in_progress', 'completed').          | `'completed'`          |
| `started_at`             | TIMESTAMP | Nullable          | When the user first saw/started this instance.                              | `timestamp`            |
| `completed_at`           | TIMESTAMP | Nullable          | When the user submitted the final answers.                                  | `timestamp`            |
| `created_at`             | TIMESTAMP | Default `now()`   | Timestamp of record creation.                                               | `timestamp`            |
| `updated_at`             | TIMESTAMP | Default `now()`   | Timestamp of last update (e.g., when saving progress).                      | `timestamp`            |

*   **Indices:**
    *   `(user_id, questionnaire_id)`: Potential unique constraint if users can only answer once per version.
    *   `(user_id, status)`: For finding incomplete questionnaires for a user.

## 4. Questionnaire Structure JSON (`questionnaires.structure`)

This JSONB field contains an ordered array defining the steps of the questionnaire.

### Overall Structure

The `structure` field holds a JSON array `[]`. Each element in the array is an *item* object representing either a question or an informational step. The order of items in the array dictates the sequence presented to the user.

```json
// questionnaires.structure
[
  { /* Item 1: Question or Info Step */ },
  { /* Item 2: Question or Info Step */ },
  // ... more items
]
```

### Common Fields for All Items

Every item object in the `structure` array shares these base fields:

*   `id`: (String) A unique identifier for this item *within this questionnaire version*. Used for mapping responses and conditions. **Recommendation:** Use descriptive IDs (e.g., `"q_experience_level"`, `"info_welcome"`).
*   `type`: (String) Specifies the kind of item, determining its rendering and behavior (e.g., `"single_choice"`, `"info_step"`).
*   `required`: (Boolean) Applies primarily to *question* types. If `true`, the user must provide an answer before proceeding (frontend validation). Ignored for `info_step`.

Most question types (except `info_step`) additionally use:
*   `text`: (String) The main question text displayed to the user. Markdown support can be added in the frontend rendering.
*   `description`: (String, Optional) Additional helper text displayed below the main `text` for clarification.

For `info_step`, see its specific fields documentation below.

### Item Types

Here are the defined item types and their specific fields:

#### 1. `single_choice`

*   **Purpose:** Select exactly one option. Rendered as radio buttons or dropdown.
*   **Specific Fields:**
    *   `options`: (Array of Objects) The choices.
        *   `value`: (String) The unique value stored when selected.
        *   `label`: (String) The text displayed to the user.
*   **Example:**
    ```json
    {
      "id": "q_experience",
      "type": "single_choice",
      "text": "Your experience level?",
      "required": true,
      "options": [
        { "value": "first_venture", "label": "First time" },
        { "value": "explored", "label": "Explored ideas" },
        { "value": "launched", "label": "Launched before" }
      ]
    }
    ```

#### 2. `multiple_choice`

*   **Purpose:** Select one or more options. Rendered as checkboxes.
*   **Specific Fields:**
    *   `options`: (Array of Objects) Same structure as `single_choice`.
    *   `maxSelections`: (Number, Optional) Max number of selectable options.
    *   `minSelections`: (Number, Optional) Min number of options required (if `required: true`).
*   **Example:**
    ```json
    {
      "id": "q_goals",
      "type": "multiple_choice",
      "text": "Primary goals? (Select all that apply)",
      "required": true,
      "minSelections": 1,
      "options": [
        { "value": "validate", "label": "Validate Idea" },
        { "value": "plan", "label": "Create Plan" },
        { "value": "funding", "label": "Get Funding" }
      ]
    }
    ```

#### 3. `text_input`

*   **Purpose:** Short text answer. Rendered as a single-line input field.
*   **Specific Fields:**
    *   `placeholder`: (String, Optional) Placeholder text.
    *   `maxLength`: (Number, Optional) Max character length.
    *   `inputType`: (String, Optional) HTML input type hint (e.g., `"text"`, `"email"`).
*   **Example:**
    ```json
    {
      "id": "q_company_name",
      "type": "text_input",
      "text": "Proposed company name?",
      "required": false,
      "placeholder": "e.g., Acme Inc."
    }
    ```

#### 4. `text_area`

*   **Purpose:** Longer text answer. Rendered as a multi-line text area.
*   **Specific Fields:**
    *   `placeholder`: (String, Optional) Placeholder text.
    *   `rows`: (Number, Optional) Suggested initial visible rows.
    *   `maxLength`: (Number, Optional) Max character length.
*   **Example:**
    ```json
    {
      "id": "q_idea_desc",
      "type": "text_area",
      "text": "Briefly describe your idea.",
      "required": true,
      "rows": 4,
      "maxLength": 500
    }
    ```

#### 5. `scale`

*   **Purpose:** Rate on a numerical scale. Rendered as radio buttons, slider, or number input.
*   **Specific Fields:**
    *   `min`: (Number) Minimum scale value.
    *   `max`: (Number) Maximum scale value.
    *   `minLabel`: (String, Optional) Label for the minimum value.
    *   `maxLabel`: (String, Optional) Label for the maximum value.
    *   `step`: (Number, Optional) Increment step (usually `1`).
*   **Example:**
    ```json
    {
      "id": "q_funding_priority",
      "type": "scale",
      "text": "Importance of funding (next 6 months)?",
      "required": true,
      "min": 1, "max": 5,
      "minLabel": "Low", "maxLabel": "High"
    }
    ```

#### 6. `boolean`

*   **Purpose:** Yes/No or True/False question. Rendered as toggle, switch, or two radios.
*   **Specific Fields:**
    *   `trueLabel`: (String, Optional) Custom label for 'true' (default "Yes").
    *   `falseLabel`: (String, Optional) Custom label for 'false' (default "No").
*   **Example:**
    ```json
    {
      "id": "q_has_cofounder",
      "type": "boolean",
      "text": "Do you have a co-founder?",
      "required": true
    }
    ```

#### 7. `info_step`

*   **Purpose:** Display informational text, optionally with an image and conditional logic. Does not collect data.
*   **Specific Fields:**
    *   `title`: (String) The title of the informational step.
    *   `body`: (String) The body text of the informational step.
    *   `imageUrl`: (String | Null) Optional URL for an image display.
    *   `buttonText`: (String) Text for the single "continue" button.
    *   `condition`: (Object | Null) Optional condition for displaying this step.
        *   `questionId`: (String) The `id` of a *previous* question to check.
        *   `operator`: (String) Comparison logic (`"equals"`, `"not_equals"`, `"includes"`).
        *   `value`: (Any) The value to compare against the answer of `questionId`.
*   **Usage Notes:**
    *   If `condition` is null or omitted, the step always shows when reached.
    *   If `condition` is present, the step only shows if the condition evaluates to true based on the current user responses.
    *   **Pattern for Multiple Choices:** To show a different message for *each* option of a preceding `single_choice` question, place multiple `info_step` items sequentially after the question, each with a condition checking for one of the possible answer `value`s. Only the `info_step` whose condition matches the user's answer will be displayed.
*   **Example (Conditional):**
    ```json
    // Assumes previous question was "q_experience"
    {
      "id": "info_solo_tip",
      "type": "info_step",
      "title": "Starting solo? We've got specific tips coming up!",
      "body": "",
      "imageUrl": null,
      "buttonText": "Got it!",
      "condition": {
        "questionId": "q_experience",
        "operator": "equals",
        "value": "first_venture" // Show only if they selected this option
      }
    }
    ```
*   **Example (Non-Conditional):**
    ```json
    {
      "id": "info_welcome",
      "type": "info_step",
      "title": "Welcome!",
      "body": "Let's personalize your InnerFlame experience.",
      "imageUrl": "/img/logo_simple.png",
      "buttonText": "Get Started",
      "condition": null // Or omit key
    }
    ```

## 5. User Response JSON (`questionnaire_responses.responses`)

This JSONB field stores the user's answers as a flat key-value object.

*   **Keys:** The `id` of the question item from the `structure` array.
*   **Values:** The user's answer, formatted according to the question type:
    *   `single_choice`: String (the selected option's `value`).
    *   `multiple_choice`: Array of Strings (the `value`s of selected options).
    *   `text_input`: String.
    *   `text_area`: String.
    *   `scale`: Number.
    *   `boolean`: Boolean (`true` or `false`).
    *   `info_step`: Not included in responses as it doesn't collect data.

**Example `responses` JSON:**

```json
{
  "q_experience": "first_venture",
  "q_goals": ["validate", "plan"],
  "q_company_name": "My Startup",
  "q_idea_desc": "Solving X problem with Y solution.",
  "q_funding_priority": 3,
  "q_has_cofounder": false
}
```

## 6. Workflow

1.  **Initiating a Questionnaire:**
    *   Application logic determines a user needs to take a questionnaire (e.g., new user `onboarding_status` is 'pending').
    *   Backend fetches the *active* questionnaire definition: `SELECT * FROM questionnaires WHERE type = 'onboarding' AND is_active = true LIMIT 1;`.
    *   Backend creates a new record in `questionnaire_responses`:
        *   Set `user_id`.
        *   Set `questionnaire_id` to the ID of the fetched active version.
        *   Set `status` to `'not_started'` or `'in_progress'`.
        *   Initialize `responses` to `{}`.
        *   Set `started_at`.
    *   Backend sends the `questionnaires.structure` JSON and the new `questionnaire_responses.id` to the frontend.

2.  **Rendering Steps:**
    *   Frontend stores the `structure` array and the current `responses` object (initially empty) in its state.
    *   Frontend maintains a `currentStepIndex` (starting at 0).
    *   Frontend renders the item at `structure[currentStepIndex]`.
    *   Based on the item `type`, the appropriate UI component is displayed (radio group, checkboxes, input field, info panel, etc.).
    *   If the item is a question, pre-fill the UI component with the value from `responses[item.id]` if it exists (allowing users to go back/forth).

3.  **Handling Conditional Steps (`info_step`):**
    *   When `currentStepIndex` points to an `info_step`:
        *   Check if `item.condition` exists and is not null.
        *   If NO condition: Render the info step UI.
        *   If YES condition:
            *   Retrieve the answer for `condition.questionId` from the frontend's `responses` state.
            *   Evaluate the condition using `operator` and `value`.
            *   If TRUE: Render the info step UI.
            *   If FALSE: **Skip rendering**. Immediately increment `currentStepIndex` and repeat step 2/3 for the *next* item in the array. *(This handles skipping non-applicable steps when multiple conditional info_steps follow a question)*.

4.  **Saving Responses:**
    *   When the user answers a question or clicks the button on an `info_step`:
        *   **For Questions:**
            *   Frontend validates the input if `required: true`.
            *   Update the frontend `responses` state: `responses[questionId] = answerValue;`.
            *   Optionally: Debounce/throttle updates to the backend to save progress (`UPDATE questionnaire_responses SET responses = $1, updated_at = now() WHERE id = $2;`).
        *   **For All Steps:** Increment `currentStepIndex`.
        *   Trigger rendering of the next step (repeating step 2/3).

5.  **Completion:**
    *   When the user completes the last item in the `structure` array:
    *   Frontend makes a final API call to update the backend.
    *   Backend updates the `questionnaire_responses` record:
        *   Set final `responses` JSON.
        *   Set `status` to `'completed'`.
        *   Set `completed_at`.
    *   Optionally, update a flag on the main `users` table (e.g., `users.onboarding_completed_at = now()`).

## 7. Versioning and Activation

*   To update a questionnaire (e.g., add a question):
    1.  Create a **new row** in the `questionnaires` table.
    2.  Copy the `structure` from the previous version and modify it.
    3.  Set the same `type` but increment the `version` number.
    4.  Set `is_active = true` for the new version.
    5.  **Crucially:** Update the *previous* version's row to set `is_active = false`.
*   This ensures new users get the latest version, while users who started an older version continue with the structure they began with (their `questionnaire_responses.questionnaire_id` points to the older version).

## 8. Use Cases

*   User Onboarding Flows
*   Feature Feedback Surveys
*   User Profile Enrichment
*   Customer Satisfaction / NPS Surveys
*   Pre-meeting Intake Forms

## 9. Best Practices & Considerations

*   **Unique IDs:** Ensure `id` fields within a single `structure` JSON are unique and descriptive. Consistency across versions for the *same conceptual question* is helpful but not strictly required (the response is tied to the version).
*   **JSON Validation:** Implement backend validation to ensure the `structure` JSON conforms to the expected format before saving it to the database.
*   **Required Fields:** Frontend validation is crucial for `required: true` questions.
*   **Conditional Logic Complexity:** Keep conditions relatively simple (checking one previous answer). Complex branching might require a different approach.
*   **Querying Responses:** Querying specific answers across many users within the `responses` JSONB field is possible using PostgreSQL's JSON operators (e.g., `->>`, `->`, `@>`) but can be less performant than querying dedicated columns. If frequent, complex reporting on specific answers is needed, consider denormalizing key answers into separate columns on `questionnaire_responses` or a dedicated analytics table upon completion.
*   **Frontend Rendering:** Build reusable React components for each `type` that accept the item's JSON definition as props.

## 10. Complete Example (`questionnaires.structure`)

This example demonstrates an onboarding questionnaire with an initial welcome step, a single-choice question followed by specific informational messages for each possible answer, and subsequent questions.

```json
[
  {
    "id": "info_welcome",
    "type": "info_step",
    "title": "Welcome!",
    "body": "Let's personalize your InnerFlame experience.",
    "imageUrl": "/img/logo_simple.png",
    "buttonText": "Get Started",
    "condition": null // Always shows first
  },
  {
    // The question determining the next info step
    "id": "q_experience",
    "type": "single_choice",
    "text": "How would you describe your entrepreneurial experience?",
    "required": true,
    "description": "Helps us tailor guidance.",
    "options": [
      { "value": "newbie", "label": "First time venture" },
      { "value": "some_exp", "label": "Some prior exposure/attempts" },
      { "value": "veteran", "label": "Launched successfully before" }
    ]
  },
  {
    // Info step ONLY for users who answered "newbie" to q_experience
    "id": "info_newbie_message",
    "type": "info_step",
    "title": "Awesome!",
    "body": "Starting fresh is exciting. We'll focus on foundational concepts and clear, step-by-step guidance.",
    "imageUrl": "/img/seedling.png",
    "buttonText": "Okay!",
    "condition": {
      "questionId": "q_experience", // Condition depends on this question ID
      "operator": "equals",
      "value": "newbie"           // Condition met if answer was "newbie"
    }
  },
  {
    // Info step ONLY for users who answered "some_exp" to q_experience
    "id": "info_some_exp_message",
    "type": "info_step",
    "title": "Great",
    "body": "Building on previous exposure gives you a head start! We'll help structure your approach and refine your strategy.",
    "imageUrl": null,
    "buttonText": "Sounds Good",
    "condition": {
      "questionId": "q_experience",
      "operator": "equals",
      "value": "some_exp"          // Condition met if answer was "some_exp"
    }
  },
  {
    // Info step ONLY for users who answered "veteran" to q_experience
    "id": "info_veteran_message",
    "type": "info_step",
    "title": "Excellent!",
    "body": "As a seasoned entrepreneur, you know the drill. InnerFlame will act as your strategic sounding board and help you accelerate planning.",
    "imageUrl": "/img/rocket.png",
    "buttonText": "Let's Go!",
    "condition": {
      "questionId": "q_experience",
      "operator": "equals",
      "value": "veteran"         // Condition met if answer was "veteran"
    }
  },
  {
    // The NEXT question in the flow, appears after the relevant info_step
    "id": "q_team_size",
    "type": "scale",
    "text": "How many people are on your core founding team currently?",
    "required": true,
    "min": 1, "max": 10,
    "minLabel": "Just Me", "maxLabel": "10+"
  },
  {
    "id": "q_goals",
    "type": "multiple_choice",
    "text": "What are your immediate goals? (Select up to 2)",
    "required": true,
    "minSelections": 1,
    "maxSelections": 2,
    "options": [
      { "value": "validate", "label": "Validate my core idea" },
      { "value": "mvp", "label": "Define/Build an MVP" },
      { "value": "strategy", "label": "Develop a business strategy" },
      { "value": "funding", "label": "Prepare for funding" }
    ]
  },
  {
    "id": "q_open_feedback",
    "type": "text_area",
    "text": "Anything specific you hope InnerFlame can help you with?",
    "required": false,
    "rows": 3,
    "placeholder": "(Optional) e.g., Market research, financial projections..."
  }
]
```