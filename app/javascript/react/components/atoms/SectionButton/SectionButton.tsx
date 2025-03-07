import * as React from "react";
import * as S from "./SectionButton.style";

interface SectionButtonProps {
  image: string;
  title: string;
  alt: string;
  onClick: () => void;
  isNotTimelapseButton: boolean;
  isActive?: boolean;
  isDisabled?: boolean;
}

const SectionButton: React.FC<SectionButtonProps> = ({
  image,
  title,
  alt,
  onClick,
  isNotTimelapseButton,
  isActive,
  isDisabled,
}) => {
  return (
    <S.StyledSectionButton
      onClick={onClick}
      $isNotTimelapseButton={isNotTimelapseButton}
      $isActive={isActive}
      $isDisabled={isDisabled}
      className="active-overlay"
    >
      <S.Image src={image} alt={alt} $isActive={isActive} />
      <S.Title $isActive={isActive}>{title}</S.Title>
    </S.StyledSectionButton>
  );
};

export { SectionButton };
