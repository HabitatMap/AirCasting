import { debounce } from "lodash";
import { useEffect } from "react";

const useScrollEndListener = (
  elementRef: React.RefObject<HTMLElement>,
  onScrollEnd: () => void
) => {
  useEffect(() => {
    const listInnerElement = elementRef.current;

    if (listInnerElement) {
      const saveScrollPosition = debounce((position: number) => {
        localStorage.setItem("sessionsListScrollPosition", position.toString());
      }, 150);

      const checkScrollEnd = debounce(() => {
        const { scrollTop, scrollHeight, clientHeight } = listInnerElement;
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isNearBottom) {
          onScrollEnd();
        }
      }, 200);

      const onScroll = () => {
        const { scrollTop } = listInnerElement;
        saveScrollPosition(scrollTop);
        checkScrollEnd();
      };

      const savedPosition = localStorage.getItem("sessionsListScrollPosition");
      if (savedPosition) {
        requestAnimationFrame(() => {
          listInnerElement.scrollTop = parseInt(savedPosition);
        });
      }

      listInnerElement.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        listInnerElement.removeEventListener("scroll", onScroll);
        saveScrollPosition.cancel();
        checkScrollEnd.cancel();
      };
    }
  }, [elementRef, onScrollEnd]);
};

export { useScrollEndListener };
