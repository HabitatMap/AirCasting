import styled from "styled-components";
import {
  acBlue,
  gray100,
  gray300,
  white,
} from "../../../../assets/styles/colors";
import { BlueButton } from "../Modals.style";

const BannerWrapper = styled.div`
  position: fixed;
  bottom: 3.2rem;
  left: 50%;
  transform: translateX(-50%);
  background: ${white};
  border-radius: 1.2rem;
  box-shadow: 0 0.2rem 1.6rem rgba(0, 0, 0, 0.12);
  padding: 2rem 2.5rem;
  z-index: 1000;
  min-width: 34rem;
  max-width: 30vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const BannerTitle = styled.h2`
  color: ${acBlue};
  font-size: 1.6rem;
  margin-bottom: 1.6rem;
  text-transform: uppercase;
  align-self: center;
`;

const BannerDescription = styled.p`
  color: ${gray300};
  font-size: 1.2rem;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  text-align: left;
  margin-bottom: 1.5rem;
`;

const BannerActions = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const DenyButton = styled(BlueButton)`
  background: ${gray100};
  color: ${gray300};
`;

const SettingsButton = styled(BlueButton)`
  background: transparent;
  color: ${acBlue};
  border: 1.5px solid ${acBlue};
`;

export {
  BannerActions,
  BannerDescription,
  BannerTitle,
  BannerWrapper,
  DenyButton,
  SettingsButton,
};
