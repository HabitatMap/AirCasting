export const get = (url, params) => {
  const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  return fetch(url + "?" + query).then(x => x.json());
};
