import React from 'react';
import * as S from "./ValuePlaceholder.style";
import AirCastingWIFi from "../../assets/icons/ACWiFi.svg"

const ValuePlaceholder: React.FC = () => {
    return (
        <S.GradientBox>
            <S.GradientImage>
            <img src={AirCastingWIFi} alt="React Logo"/>
            </S.GradientImage>
            <S.TextContainer>
            <p>Avg for Jun 12</p>
            <p>13</p>
            <p>PM2.5 µg/m</p>
            </S.TextContainer>
        </S.GradientBox>
    );
}

export { ValuePlaceholder };
