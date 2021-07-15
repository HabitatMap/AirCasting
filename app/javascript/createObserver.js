/**
 * Initializes a DOM mutation observer that will run a hook when
 * a DOM node matching a selector is mounted or unmounted.
 *
 *   const myObs = createObserver({
 *     selector: "[data-ace-editor]",
 *     onMount: node => {},
 *     onUnmount: node => {}
 *   });
 */

const DEFAULT_ROOT_ELEMENT = document;
const DEFAULT_OBSERVER_CONFIG = { childList: true, subtree: true };

export const createObserver = (config) => {
  const {
    observerConfig = DEFAULT_OBSERVER_CONFIG,
    rootElement = DEFAULT_ROOT_ELEMENT,
    selector,
    onMount,
    onUnmount,
  } = config;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Handle added nodes
      if (onMount) {
        mutation.addedNodes.forEach((addedNode) => {
          const matchingElements = getMatchingElementsFromTree(
            addedNode,
            selector
          );
          if (matchingElements.length < 1) return;
          matchingElements.forEach((node) => onMount(node));
        });
      }
      // Handle removed nodes
      if (onUnmount) {
        mutation.removedNodes.forEach((removedNode) => {
          const matchingElements = getMatchingElementsFromTree(
            removedNode,
            selector
          );
          if (matchingElements.length < 1) return;
          matchingElements.forEach((node) => onUnmount(node));
        });
      }
    });
  });

  observer.observe(rootElement, observerConfig);

  return observer;
};

// Returns an iterator containing elements that were part of a DOM mutation & matches the selector
const getMatchingElementsFromTree = (rootElement, selector) => {
  return rootElement.querySelectorAll && rootElement.matches
    ? rootElement.matches(selector)
      ? [rootElement]
      : rootElement.querySelectorAll(selector)
    : [];
};
