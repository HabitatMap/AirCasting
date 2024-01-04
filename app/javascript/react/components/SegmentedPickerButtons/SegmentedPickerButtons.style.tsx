import styled from "styled-components";

import { blue, lightGray } from "../../assets/styles/colors";

const SegmentedPickerContainer = styled.div`
  position: relative;
  display: inline-flex;
  border: 1px solid ${lightGray};
  border-radius: 5px;
`;

interface SegmentedOptionProps {
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const SegmentedOption = styled.div<SegmentedOptionProps>`
  padding: 8px 15px;
  margin: 2px;
  cursor: pointer;
  background-color: ${({ isSelected }) => (isSelected ? blue : "transparent")};
  border-radius: ${({ isSelected, isFirst, isLast }) =>
    isSelected
      ? isFirst
        ? "5px 0 0 5px"
        : isLast
        ? "0 5px 5px 0"
        : "0px"
      : "0px"};
  color: ${({ isSelected }) => (isSelected ? blue : "#fff")};
  > span {
    color: ${({ isSelected }) => (isSelected ? "#fff" : lightGray)};
    text-transform: uppercase;
  }
`;

export { SegmentedPickerContainer, SegmentedOption };
