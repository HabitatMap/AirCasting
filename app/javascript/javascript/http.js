export const get = (url, params) => {
  const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  return fetch(url + "?" + query).then(x => x.json());
};

export const getQ = (url, params) =>
  fetch(url + "?" + "q=" + encodeURIComponent(JSON.stringify(params))).then(x =>
    x.json()
  );
