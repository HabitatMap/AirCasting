let counter = 0;
const cache = {};

const update = (by) => {
  counter += by;
  window.__elmApp.ports.updateIsHttping.send(counter !== 0);
};

export const get = (url, params) => {
  const query = Object.keys(params)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  return fetch(url + "?" + query).then((x) => {
    return x.json();
  });
};

export const getQ = (url, params) => {
  const encodedParams = encodeURIComponent(JSON.stringify(params));
  const cacheKey = url + encodedParams;
  const cached = cache[cacheKey];
  if (cached) return Promise.resolve(cached);

  update(+1);
  return fetch(url + "?" + "q=" + encodedParams)
    .then((x) => {
      return x.json();
    })
    .then((x) => {
      cache[cacheKey] = x;
      update(-1);
      return x;
    })
    .catch(() => {
      update(-1);
      throw new Error("failed");
    });
};
