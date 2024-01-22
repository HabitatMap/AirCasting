const sizes = {
  // Why such numbers? Explenation:
  // While there is no hard and fast rule for what breakpoints should be used,
  // values of common CSS breakpoints are 320px or 480px (for mobile phones), 768px (for tablets)
  mobile: "768px",
  desktop: "769px",
};

const media = {
  mobile: `(max-width: ${sizes.mobile})`,
  desktop: `(min-width: ${sizes.desktop})`,
};

export default media
