import { useEffect, useState } from "react";
import { screenSizes } from "./media";

const useScreenSizeDetection = (maxWidth = screenSizes.desktop) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= maxWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < maxWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [maxWidth]);

  return isMobile;
};

export default useScreenSizeDetection;
