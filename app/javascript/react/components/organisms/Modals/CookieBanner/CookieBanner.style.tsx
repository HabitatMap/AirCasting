import styled from "styled-components";
import { acBlue, gray400, white } from "../../../../assets/styles/colors";
import { BlueButton } from "../Modals.style";

const BannerWrapper = styled.div`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: ${white};
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
  padding: 2rem 2.5rem;
  z-index: 1000;
  min-width: 340px;
  max-width: 40vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const BannerTitle = styled.h2`
  color: ${acBlue};
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const BannerDescription = styled.p`
  color: #222;
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
  background: ${gray400};
  color: ${white};
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
