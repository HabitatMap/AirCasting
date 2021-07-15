export const getParams = () =>
  window.location.hash
    .slice(2)
    .split("&")
    .filter((x) => x.length !== 0)
    .map((x) => x.split("="))
    .map(([k, v]) => [k, decodeURIComponent(v)])
    .map(([k, v]) => [k, parseIfJSON(v)])
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

export const getParams2 = () =>
  window.location.hash
    .slice(2)
    .split("&")
    .filter((x) => x.length !== 0)
    .map((x) => x.split("="))
    .map(([k, v]) => [k, decodeURIComponent(v)])
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

export const updateParams = (obj) => {
  const hash =
    "?" +
    Object.keys(obj)
      .reduce((acc, k) => {
        return [
          ...acc,
          encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]),
        ];
      }, [])
      .join("&")
      .replace(/%3A/gi, ":")
      .replace(/%2C/gi, ",");

  window.location.hash = hash;
};

const parseIfJSON = (value) => {
  if (isJSON(value)) {
    return JSON.parse(value);
  } else {
    return value;
  }
};

export const isJSON = (text) => {
  if (
    /^[\],:{}\s]*$/.test(
      text
        .replace(/\\["\\\/bfnrtu]/g, "@")
        .replace(
          /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
          "]"
        )
        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
    )
  ) {
    return true;
  } else {
    return false;
  }
};

export const updateParam = (param) =>
  (window.location.hash =
    window.location.hash + "&" + param.key + "=" + param.value);
