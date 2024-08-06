import React from "react";
import styled from "styled-components";

interface TimeAxisProps {
  startTime: string;
  endTime: string;
  onTimeChange: (newTime: string) => void;
}

const AxisContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

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
    <AxisContainer>
      <TimeLabel />
    </AxisContainer>
  );
};

export default TimeAxis;
