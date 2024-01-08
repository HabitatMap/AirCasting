import React, { useState } from "react";

import * as S from "./SegmentedPickerButtons.style";

interface SegmentedPickerProps {
  options: string[];
}

const SegmentedPicker: React.FC<SegmentedPickerProps> = ({ options }) => {
  const [selectedOption, setSelectedOption] = useState<string>(options[0]);

  const onOptionChange = (option: string) => {
    setSelectedOption(option);
  };

  return (
    <S.SegmentedPickerContainer>
      {options.map((option, index) => (
        <S.SegmentedOption
          key={option}
          onClick={() => onOptionChange(option)}
          isSelected={option === selectedOption}
          index={index}
          numberOfOptions={options.length}
        >
          <span>{option}</span>
        </S.SegmentedOption>
      ))}
    </S.SegmentedPickerContainer>
  );
};

export default SegmentedPicker;
