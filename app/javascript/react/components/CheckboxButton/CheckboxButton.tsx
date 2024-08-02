import React from "react";
import * as S from "./CheckboxButton.style";

interface CheckboxButtonProps {
  label: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
}

const CheckboxButton: React.FC<CheckboxButtonProps> = ({
  label,
  isChecked,
  onChange,
}) => {
  return (
    <S.ButtonContainer $isActive={isChecked}>
      <S.Label>{label}</S.Label>
      <S.ButtonCheckboxContainer>
        <S.ButtonCheckbox
          type="checkbox"
          checked={isChecked}
          onChange={() => onChange(!isChecked)}
        />
        <S.RoundCheckbox />
      </S.ButtonCheckboxContainer>
    </S.ButtonContainer>
  );
};

export { CheckboxButton };
