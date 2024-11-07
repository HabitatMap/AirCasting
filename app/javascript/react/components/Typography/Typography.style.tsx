import styled from "styled-components";

const H1 = styled.h1`
  font-weight: 600;
  font-size: 28px;
`;

const H2 = styled.h2`
  font-weight: 600;
  font-size: 24px;
  text-transform: capitalize;
`;

const H3 = styled.h3<{ bold?: boolean }>`
  font-weight: ${(p) => (p.bold ? "600" : "400")};
  font-size: 18px;
`;

const H4 = styled.h4<{ $bold?: boolean }>`
  font-weight: ${(p) => (p.$bold ? "700" : "400")};
  font-size: 14px;
  letter-spacing: 0.14px;
`;

const H5 = styled.h5<{ bold?: boolean }>`
  font-weight: ${(p) => (p.bold ? "600" : "400")};
  font-size: 12px;
`;

const H6 = styled.h6<{ bold?: boolean; uppercase?: boolean }>`
  font-weight: ${(p) => (p.bold ? "500" : "400")};
  font-size: 10px;
  text-transform: ${(p) => (p.uppercase ? "uppercase" : "none")};
  letter-spacing: ${(p) => (p.uppercase ? "0.1px" : "normal")};
`;

export { H1, H2, H3, H4, H5, H6 };
