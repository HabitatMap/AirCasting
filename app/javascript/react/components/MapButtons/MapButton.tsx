import React from "react";

import * as S from "./MapButtons.style";

interface MapButtonProps {
  image: string;
  title: string;
  alt: string;
  onClick: () => void;
  isActive?: boolean;
}

const MapButton: React.FC<MapButtonProps> = ({
  image,
  title,
  alt,
  onClick,
  isActive,
}) => {
  return (
    <S.MapButton onClick={onClick} isActive={isActive}>
      <S.Title isActive={isActive}>{title}</S.Title>
      <S.IconWrapper src={image}>
        <S.Icon src={image} alt={alt} />
      </S.IconWrapper>
    </S.MapButton>
  );
};

export { MapButton };
