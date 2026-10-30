import { mountPasswordToggles } from "./passwordToggle";

// Markup as app/views/devise/passwords/edit.html.erb renders it: the field is
// a direct child of .auth-field, which is where the wrapper has to appear.
const render = (type = "password"): HTMLInputElement => {
  document.body.innerHTML = `
    <div class="auth-page">
      <form class="auth-form">
        <div class="auth-field">
          <label class="auth-field__label" for="user_password">Password</label>
          <input id="user_password" class="auth-input" type="${type}" />
          <span class="auth-field__error" id="password_error">too short</span>
        </div>
      </form>
    </div>
  `;
  return document.querySelector<HTMLInputElement>("#user_password")!;
};

const toggle = (): HTMLButtonElement =>
  document.querySelector<HTMLButtonElement>(".auth-input-toggle")!;

describe("mountPasswordToggles", () => {
  it("wraps a password field and adds a button after it", () => {
    const field = render();
    mountPasswordToggles();

    expect(field.parentElement!.className).toBe("auth-input-wrap");
    expect(field.nextElementSibling).toBe(toggle());
    // The error span stays a sibling of the wrapper, so aria-describedby and
    // the field layout are untouched.
    expect(document.querySelector(".auth-field__error")!.parentElement!.className).toBe(
      "auth-field"
    );
  });

  it("leaves other input types alone", () => {
    render("email");
    mountPasswordToggles();

    expect(toggle()).toBeNull();
  });

  it("leaves password fields outside .auth-page alone", () => {
    render();
    document.querySelector(".auth-page")!.className = "map";
    mountPasswordToggles();

    expect(toggle()).toBeNull();
  });

  it("builds a real button, so it never submits the form", () => {
    render();
    mountPasswordToggles();

    expect(toggle().type).toBe("button");
  });

  it("reveals the value and says so, then hides it again", () => {
    const field = render();
    mountPasswordToggles();

    toggle().click();
    expect(field.type).toBe("text");
    expect(toggle().getAttribute("aria-pressed")).toBe("true");
    expect(toggle().getAttribute("aria-label")).toBe("Hide password");

    toggle().click();
    expect(field.type).toBe("password");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    expect(toggle().getAttribute("aria-label")).toBe("Show password");
  });

  it("starts hidden, which is the state the server rendered", () => {
    const field = render();
    mountPasswordToggles();

    expect(field.type).toBe("password");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
  });

  it("points the button at the field it controls", () => {
    render();
    mountPasswordToggles();

    expect(toggle().getAttribute("aria-controls")).toBe("user_password");
  });

  it("hands focus back to the field, caret at the end", () => {
    const field = render();
    field.value = "secret";
    mountPasswordToggles();

    toggle().click();

    expect(document.activeElement).toBe(field);
    expect(field.selectionStart).toBe(6);
    expect(field.selectionEnd).toBe(6);
  });

  it("hides the icon from screen readers, which read the label instead", () => {
    render();
    mountPasswordToggles();

    const svg = toggle().querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
  });

  it("is idempotent", () => {
    render();
    mountPasswordToggles();
    mountPasswordToggles();

    expect(document.querySelectorAll(".auth-input-toggle")).toHaveLength(1);
    expect(document.querySelectorAll(".auth-input-wrap")).toHaveLength(1);
  });

  it("gives every password field on the screen its own toggle", () => {
    render();
    const field = document.querySelector(".auth-field")!;
    field.parentElement!.appendChild(field.cloneNode(true));
    document.querySelectorAll(".auth-input")[1].id = "user_password_confirmation";

    mountPasswordToggles();

    expect(document.querySelectorAll(".auth-input-toggle")).toHaveLength(2);
  });
});
