import React from "react";

import * as S from "./MapButtons.style";

interface MapButtonProps {
  image: string;
  title: string;
  alt: string;
  onClick: () => void;
  isActive: boolean;
  isDisabled?: boolean;
}

const MapButton = React.forwardRef<HTMLButtonElement, MapButtonProps>(
  ({ image, title, alt, onClick, isActive, isDisabled }, ref) => {
    return (
      <S.MapButton
        onClick={onClick}
        $isActive={isActive}
        $isDisabled={isDisabled}
      >
        <S.Title $isActive={isActive}>{title}</S.Title>
        <S.IconWrapper $src={image} $isActive={isActive} title={alt} />
      </S.MapButton>
    );
  }
);

export { MapButton };
