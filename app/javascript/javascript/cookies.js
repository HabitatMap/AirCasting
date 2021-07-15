export const set = (name, value) =>
  (document.cookie =
    encodeURIComponent(name) + "=" + encodeURIComponent(value));

export const get = (name) => {
  try {
    return JSON.parse(
      decodeURIComponent(document.cookie)
        .split(";")
        .map((x) => x.trim())
        .map((x) => x.split("="))
        .map((xs) => xs.map((x) => decodeURIComponent(x)))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})[name]
    );
  } catch (e) {
    return null;
  }
};
