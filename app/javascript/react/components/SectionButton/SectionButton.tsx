import * as React from "react";
import * as S from "./SectionButton.style";

interface SectionButtonProps {
  image: string;
  title: string;
  alt: string;
  onClick: () => void;
  isNotTimelapseButton: boolean;
  isActive: boolean;
}

const SectionButton: React.FC<SectionButtonProps> = ({
  image,
  title,
  alt,
  onClick,
  isNotTimelapseButton,
  isActive,
}) => {
  return (
    <S.StyledSectionButton
      onClick={onClick}
      $isNotTimelapseButton={isNotTimelapseButton}
      $isActive={isActive}
    >
      <S.Image src={image} alt={alt} $isActive={isActive} />
      <S.Title $isActive={isActive}>{title}</S.Title>
    </S.StyledSectionButton>
  );
};

export { SectionButton };
