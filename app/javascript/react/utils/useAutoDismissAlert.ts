import { useEffect } from "react";

export const useAutoDismissAlert = (
  showAlert: boolean,
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showAlert, setShowAlert]);
};
