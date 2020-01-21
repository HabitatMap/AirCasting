let counter = 0;

const update = by => {
  counter += by;
  window.__elmApp.ports.updateIsHttping.send(counter !== 0);
};

export const get = (url, params) => {
  const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  return fetch(url + "?" + query).then(x => {
    return x.json();
  });
};

export const getQ = (url, params) => {
  update(+1);

  return fetch(url + "?" + "q=" + encodeURIComponent(JSON.stringify(params)))
    .then(x => {
      update(-1);
      return x.json();
    })
    .catch(() => {
      update(-1);
      throw new Error("failed");
    });
};
