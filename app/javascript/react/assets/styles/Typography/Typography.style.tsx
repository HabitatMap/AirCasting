import styled from "styled-components";

const LargeH1 = styled.h1`
  font-family: "Roboto";
  font-weight: 600;
  font-size: 72px;
  color: inherit
`;

const H1 = styled.h1`
  font-family: "Roboto";
  font-weight: 600;
  font-size: 28px;
  color: inherit
`;

const H2 = styled.h2`
  font-family: "Roboto";
  font-weight: 600;
  font-size: 24px;
  text-transform: capitalize;
  color: inherit
`;

const H3 = styled.h3<{ bold?: boolean }>`
  font-weight: ${(p) => (p.bold ? "600" : "400")};
  font-size: 18px;
  color: inherit
`;

const H4 = styled.h4<{ bold?: boolean }>`
  font-family: "Roboto";
  font-weight: ${(p) => (p.bold ? "600" : "400")};
  font-size: 14px;
  letter-spacing: 0.14px;
  color: inherit
`;

const H5 = styled.h5<{ bold?: boolean }>`
  font-family: "Roboto";
  font-weight: ${(p) => (p.bold ? "600" : "400")};
  font-size: 12px;
  color: inherit
`;

const H6 = styled.h6<{ bold?: boolean; uppercase?: boolean }>`
  font-family: "Roboto";
  font-weight: ${(p) => (p.bold ? "500" : "400")};
  font-size: 10px;
  text-transform: ${(p) => (p.uppercase ? "uppercase" : "none")};
  letterspacing: ${(p) => (p.uppercase ? "0.1px" : "normal")};
  color: inherit
`;

export { LargeH1, H1, H2, H3, H4, H5, H6 };
