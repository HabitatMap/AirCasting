const sizes = {
  // Why such numbers? Explenation:
  // While there is no hard and fast rule for what breakpoints should be used,
  // values of common CSS breakpoints are 320px or 480px (for mobile phones), 768px (for tablets)
  smallMobile: "340px",
  mobile: "768px",
  smallDesktop: "769px",
  tabletMax: "1023px",
  desktop: "1024px",
  mediocreDesktop: "1091px",
  mediumDesktop: "1240px",
  largeDesktop: "1440px",
  hugeDesktop: "1620px",
};

export const media = {
  smallMobile: `(min-width: ${sizes.smallMobile})`,
  mobile: `(max-width: ${sizes.mobile})`,
  smallDesktop: `(min-width: ${sizes.smallDesktop})`,
  tabletMax: `(max-width: ${sizes.tabletMax})`,
  desktop: `(min-width: ${sizes.desktop})`,
  mediocreDesktop: `(min-width: ${sizes.mediocreDesktop})`,
  mediumDesktop: `(min-width: ${sizes.mediumDesktop})`,
  largeDesktop: `(min-width: ${sizes.largeDesktop})`,
  hugeDesktop: `(min-width: ${sizes.hugeDesktop})`,
};

export const screenSizes = {
  smallMobile: 340,
  mobile: 768,
  smallDesktop: 769,
  tabletMax: 1023,
  desktop: 1024,
  mediocreDesktop: 1091,
  mediumDesktop: 1240,
  largeDesktop: 1440,
  hugeDesktop: 1620,
};
