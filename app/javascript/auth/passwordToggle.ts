// Figma frames 07 and 08 put a reveal control inside each password field.
//
// The button is created here rather than rendered in the template on purpose:
// with scripting off it never appears, instead of appearing and doing nothing.
// Everything it needs comes from the field itself, so a new password field
// anywhere under .auth-page gets a toggle with no further wiring.

const EYE = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_OFF = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;

const icon = (paths: string): string =>
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     aria-hidden="true" focusable="false">${paths}</svg>`;

const buildToggle = (field: HTMLInputElement): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "auth-input-toggle";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-controls", field.id);
  button.setAttribute("aria-label", "Show password");
  button.innerHTML = icon(EYE);

  button.addEventListener("click", () => {
    const revealing = field.type === "password";
    field.type = revealing ? "text" : "password";
    button.setAttribute("aria-pressed", String(revealing));
    button.setAttribute(
      "aria-label",
      revealing ? "Hide password" : "Show password"
    );
    button.innerHTML = icon(revealing ? EYE_OFF : EYE);
    // The click moved focus to the button; put the caret back where it was so
    // revealing mid-entry does not cost the user their place.
    const caret = field.value.length;
    field.focus();
    field.setSelectionRange(caret, caret);
  });

  return button;
};

export const mountPasswordToggles = (): void => {
  const fields = document.querySelectorAll<HTMLInputElement>(
    ".auth-page .auth-input[type='password']"
  );

  fields.forEach((field) => {
    // Guard against a second mount — the toggle is built from the field, so a
    // repeat would nest a second wrapper and leave two buttons on one input.
    if (field.parentElement?.classList.contains("auth-input-wrap")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "auth-input-wrap";
    field.parentNode?.insertBefore(wrapper, field);
    wrapper.appendChild(field);
    wrapper.appendChild(buildToggle(field));
  });
};
