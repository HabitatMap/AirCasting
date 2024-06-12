import * as React from "react";
import * as S from "./sectionButton.style";

interface SectionButtonProps {
  image: string;
  title: string;
  onClick: () => void;
}

const SectionButton: React.FC<SectionButtonProps> = ({ image, title, onClick }) => {
  return (
    <S.StyledSectionButton onClick={onClick}>
        <S.Image src={image} alt="Pin Icon"/>
      <S.Title>{title}</S.Title>
    </S.StyledSectionButton>
  );
};

export { SectionButton };
