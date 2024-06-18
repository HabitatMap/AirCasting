import { useState, useEffect } from 'react';
import { screenSizes } from './media';

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= screenSizes.mobile
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= screenSizes.mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
};

export default useMobileDetection;
