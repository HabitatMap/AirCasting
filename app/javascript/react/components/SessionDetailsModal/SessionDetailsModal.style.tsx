import styled from "styled-components";
import { media } from "../../utils/media";
import { H2 } from "../Typography";
import {
  blue,
  gray100,
  gray200,
  gray300,
  white,
} from "../../assets/styles/colors";
import { ActionButton } from "../ActionButton/ActionButton.style";
import { Link } from "react-router-dom";

interface DotProps {
  $color?: string;
}

const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 0 4rem;
  width: 20%;
`;

const SessionName = styled(H2)`
  font-weight: 500;
`;

const SensorName = styled.span`
  font-size: 1.2rem;
  font-weight: 400;
  color: ${gray300};
`;

const AverageValueContainer = styled.div`
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const AverageValue = styled.span`
  font-size: 1.6rem;
  margin-right: 0.5rem;
`;

const AverageDot = styled.div<DotProps>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  display: inline-block;
  margin-right: 1rem;
`;

const SmallDot = styled.div<DotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  display: inline-block;
  margin-right: 0.5rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
`;

const MinMaxValueContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  gap: 2rem;
`;
const Value = styled.span`
  font-size: 1.6rem;
  margin-left: 0.3rem;
`;

const TimeRange = styled.div`
  font-size: 1.2rem;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
`;
const Button = styled(ActionButton)`
  color: ${gray300};
  background-color: ${gray100};
`;

const BlueButton = styled(Link)`
  background-color: ${blue};
  color: ${white};
  font-weight: 100;
  width: fit-content;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 1.4rem;
  letter-spacing: 0.14px;
  height: 4.2rem;
  border-radius: 5px;
  padding: 1.6rem;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  display: flex;
  border: 1px solid ${gray200};
  text-decoration: none;
`;

export {
  InfoContainer,
  SessionName,
  SensorName,
  AverageValueContainer,
  AverageValue,
  AverageDot,
  SmallDot,
  ButtonsContainer,
  MinMaxValueContainer,
  Value,
  TimeRange,
  Button,
  BlueButton,
};
