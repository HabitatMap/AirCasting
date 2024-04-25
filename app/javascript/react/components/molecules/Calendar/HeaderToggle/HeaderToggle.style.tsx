import styled, { css } from "styled-components";

export const Container = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 5px;
`;

export const RotatedIcon = styled.img<{ rotated: boolean }>`
  margin-right: 8px;
  transform: ${({ rotated }) => (rotated ? "rotate(180deg)" : "none")};
  cursor: pointer;
`;

export const Heading = styled.h3`
  cursor: pointer;
`;
