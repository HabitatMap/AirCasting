import * as React from "react";
import * as S from "./SectionButtonTest.style";

interface SectionButtonProps {
  image: string;
  title: string;
  alt: string;
  onClick: () => void;
}

const SectionButton: React.FC<SectionButtonProps> = ({
  image,
  title,
  alt,
  onClick,
}) => {
  return (
    <S.StyledSectionButton onClick={onClick}>
      <S.Image src={image} alt={alt} />
      <S.Title>{title}</S.Title>
    </S.StyledSectionButton>
  );
};

export { SectionButton };
