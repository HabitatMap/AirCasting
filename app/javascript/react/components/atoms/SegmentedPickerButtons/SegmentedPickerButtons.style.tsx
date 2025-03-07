import styled from "styled-components";

import { blue, gray200, white } from "../../../assets/styles/colors";

const SegmentedPickerContainer = styled.div`
  position: relative;
  display: inline-flex;
  border: 1px solid ${gray200};
  border-radius: 5px;
`;

interface SegmentedOptionProps {
  isSelected: boolean;
  index: number;
  numberOfOptions: number;
}

interface BorderProps {
  index: number;
  numberOfOptions: number;
}

const getBorder = ({ index, numberOfOptions }: BorderProps) => {
  const leftBorder = "5px 0 0 5px";
  const rightBorder = "0px 5px 5px 0px";

  if (index == numberOfOptions - 1) {
    return rightBorder;
  } else if (index == 0) {
    return leftBorder;
  }
};

const SegmentedOption = styled.div<SegmentedOptionProps>`
  padding: 8px 15px;
  margin: 2px;
  cursor: pointer;
  background-color: ${({ isSelected }) => (isSelected ? blue : "transparent")};
  border-radius: ${({ isSelected, index, numberOfOptions }) =>
    isSelected && getBorder({ index, numberOfOptions })};
  color: ${({ isSelected }) => (isSelected ? blue : white)};
  > span {
    color: ${({ isSelected }) => (isSelected ? white : gray200)};
    text-transform: uppercase;
  }
`;

export { SegmentedOption, SegmentedPickerContainer };
