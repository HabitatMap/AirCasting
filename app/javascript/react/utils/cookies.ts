// Set a cookie with optional parameters
export const set = (
  name: string,
  value: string,
  options: { [key: string]: any } = {}
) => {
  options = {
    path: "/",
    ...options,
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie =
    encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
};

// Get a cookie by name
export const get = (name: string): string | null => {
  const matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : null;
};

// Parse JSON cookie
export const getJSON = (name: string): any | null => {
  const value = get(name);
  return value ? JSON.parse(value) : null;
};

// Delete a cookie
export const remove = (name: string) => {
  set(name, "", {
    "max-age": -1,
  });
};
