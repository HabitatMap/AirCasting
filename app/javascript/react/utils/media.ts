const sizes = {
  // Why such numbers? Explenation:
  // While there is no hard and fast rule for what breakpoints should be used,
  // values of common CSS breakpoints are 320px or 480px (for mobile phones), 768px (for tablets)
  mobile: "768px",
  smallDesktop: "769px",
  desktop: "1024px",
  largeDesktop: "1440px",
};

export const media = {
  mobile: `(max-width: ${sizes.mobile})`,
  smallDesktop: `(min-width: ${sizes.smallDesktop})`,
  desktop: `(min-width: ${sizes.desktop})`,
  largeDesktop: `(min-width: ${sizes.largeDesktop})`,
};


export const screenSizes = {
  mobile: 768,
  smallDesktop: 769,
  desktop: 1024,
  largeDesktop: 1440,
}
