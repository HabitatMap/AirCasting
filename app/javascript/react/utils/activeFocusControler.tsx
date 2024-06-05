import { useEffect } from "react";
import { EventType } from "../types/eventType";
import { KeyboardKeys } from "../types/keyboardKeys";

const userIsTabbingKey = "user-is-tabbing";

const handleTabAction = (event: KeyboardEvent): void => {
  if (event.key === KeyboardKeys.Tab) {
    document.body.classList.add(userIsTabbingKey);
    window.removeEventListener(EventType.keyDown, handleTabAction);
    window.addEventListener(EventType.mouseDown, handleMouseAction);
  }
};

const handleMouseAction = () => {
  document.body.classList.remove(userIsTabbingKey);
  window.removeEventListener(EventType.mouseDown, handleMouseAction);
  window.addEventListener(EventType.keyDown, handleTabAction);
};

const RemoveActiveFocusWhenNotTab: React.FC = () => {
  useEffect(() => {
    window.addEventListener(EventType.keyDown, handleTabAction);
    return () => {
      window.removeEventListener(EventType.keyDown, handleTabAction);
      window.removeEventListener(EventType.mouseDown, handleMouseAction);
    };
  }, []);

  return null;
};

export { RemoveActiveFocusWhenNotTab }
