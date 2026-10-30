// Only script on the account screens. Merged into the existing `auth` entry by
// config/webpack/base.js, which keys entry points on the filename without its
// extension, so auth.js and auth.scss become one entry with a js and a css
// output.
import { mountPasswordToggles } from "../auth/passwordToggle";

document.addEventListener("DOMContentLoaded", mountPasswordToggles);
