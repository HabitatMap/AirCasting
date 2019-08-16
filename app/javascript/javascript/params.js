export const getParams = () =>
  window.location.hash
    .slice(2)
    .split("&")
    .filter(x => x.length !== 0)
    .map(x => x.split("="))
    .map(([k, v]) => [k, decodeURIComponent(v)])
    .map(([k, v]) => [k, JSON.parse(v)])
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
