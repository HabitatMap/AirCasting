import deepEqual from 'fast-deep-equal';

export const mock = name => {
  let calls1 = [];
  let calls2 = [];
  let calls3 = [];

  return {
    [name]: (arg1, arg2, arg3) => { calls1.push(arg1); calls2.push(arg2); calls3.push(arg3); },
    wasCalled: () => calls1.length === 1,
    wasCalledWith: arg => deepEqual(arg, calls1[calls1.length - 1]),
    wasCalledWith2: arg => deepEqual(arg, calls2[calls2.length - 1]),
    wasCalledWith3: arg => deepEqual(arg, calls3[calls3.length - 1]),
    wasCalledWithParameter: obj => {
      const reducer = (acc, key) => ({ ...acc, [key]: calls1[calls1.length - 1][key]})
      const actual = Object.keys(obj).reduce(reducer, {} )
      return deepEqual(obj, actual)
    }
  };
};
