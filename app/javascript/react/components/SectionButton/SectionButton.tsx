import * as React from "react";
import * as S from "./SectionButton.style";

interface SectionButtonProps {
  image: string;
  title: string;
  alt: string;
  onClick: () => void;
  isNotTimelapsButton: boolean;
}

const SectionButton: React.FC<SectionButtonProps> = ({
  image,
  title,
  alt,
  onClick,
  isNotTimelapsButton,
}) => {
  return (
    <S.StyledSectionButton
      onClick={onClick}
      $isNotTimelapsButton={isNotTimelapsButton}
    >
      <S.Image src={image} alt={alt} />
      <S.Title>{title}</S.Title>
    </S.StyledSectionButton>
  );
};

export { SectionButton };
