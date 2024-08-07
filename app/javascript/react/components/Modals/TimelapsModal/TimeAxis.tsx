import React from "react";
import styled from "styled-components";
import * as S from "./TimelapseComponent.style";

interface TimeAxisProps {
  startTime: string;
  endTime: string;
  onTimeChange: (newTime: string) => void;
}

const TimeLabel = styled.span`
  font-size: 14px;
`;

const TimeAxis: React.FC<TimeAxisProps> = ({
  startTime,
  endTime,
  onTimeChange,
}) => {
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(event.target.value);
  };

  return (
    <S.AxisContainer>
      <TimeLabel />
    </S.AxisContainer>
  );
};

export default TimeAxis;
