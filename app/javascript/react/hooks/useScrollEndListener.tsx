import { useEffect } from "react";

const useScrollEndListener = (
  elementRef: React.RefObject<HTMLElement>,
  onScrollEnd: () => void
) => {
  useEffect(() => {
    const listInnerElement = elementRef.current;

    if (listInnerElement) {
      const onScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = listInnerElement;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isNearBottom) {
          onScrollEnd();
        }
      };

      listInnerElement.addEventListener("scroll", onScroll);

      return () => {
        listInnerElement.removeEventListener("scroll", onScroll);
      };
    }
  }, [elementRef, onScrollEnd]);
};

export { useScrollEndListener };
