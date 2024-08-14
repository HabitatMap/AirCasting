import { Link } from "react-router-dom";
import Popup from "reactjs-popup";
import styled from "styled-components";

import {
  blue,
  gray100,
  gray200,
  gray300,
  white,
} from "../../../assets/styles/colors";
import { media } from "../../../utils/media";
import { ActionButton } from "../../ActionButton/ActionButton.style";
import { H2 } from "../../Typography";

interface DotProps {
  $color?: string;
}
interface ContentWrapperProps {
  $isVisible: boolean;
}

interface MinMaxProps {
  $isMobile: boolean;
}

const SessionDetailsModal = styled(Popup)`
  width: 100%;
  height: 100%;

  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none !important;
    z-index: 2;
  }

  &-content {
    width: 100%;
    background-color: ${white};
    padding: 0.5rem;
    border-radius: 10px 10px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    max-height: 80vh;
    overflow-y: auto;
    margin: 0;
    display: flex;
    flex-direction: row-reverse;
    flex-wrap: wrap;

    @media ${media.smallDesktop} {
      padding-bottom: 1.25rem;
      flex-direction: row;
    }
  }
`;

const InfoContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  gap: 4rem;

  @media ${media.desktop} {
    width: 20%;
    flex-direction: column;
    justify-content: space-evenly;
    margin-bottom: 0;
    padding: 3rem 3rem 0 3rem;
    gap: 1.6rem;
  }
`;

const ModalMobileHeader = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;

  @media ${media.desktop} {
    display: none;
  }
`;

const ModalDesktopHeader = styled.div`
  display: none;

  @media ${media.desktop} {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
`;

const SessionName = styled(H2)`
  font-weight: 500;
  font-size: 1.8rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media ${media.smallDesktop} {
    font-size: 2.4rem;
  }
`;

const ProfileName = styled.span`
  font-size: 1.2rem;
  font-weight: 400;
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
  display: none;
  @media ${media.smallDesktop} {
    display: flex;
    justify-content: flex-start;
    gap: 0.5rem;
  }
`;

const MinMaxValueContainer = styled.div<MinMaxProps>`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  gap: 2rem;
  justify-content: ${(props) => (props.$isMobile ? "flex-end" : "flex-start")};
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
  box-shadow: none;
  padding: 1.6rem;
  border: none;

  /* fix for outlines appearing on component load */

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
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
  border-radius: 10px;
  padding: 1.2rem;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  display: flex;
  border: 1px solid ${gray200};
  text-decoration: none;
  border: none;
  margin-right: 0.5rem;

  /* fix for outlines appearing on component load */

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }

  @media ${media.largeDesktop} {
    padding: 1.6rem;
    border-radius: 5px;
  }
`;

const CancelButtonX = styled.button`
  border: none;
  background-color: transparent;
  position: absolute;
  top: 0.5rem;
  right: 0.3rem;
  height: fit-content;
  align-self: flex-end;
  cursor: pointer;

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
  @media ${media.smallDesktop} {
    width: fit-content;
  }
`;

const SmallPopup = styled(Popup)`
  width: 100%;
  height: auto;

  &-overlay {
  }

  &-content {
    background-color: ${white};
    opacity: 1;
    border-radius: 8px;
    position: relative;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 6;
    display: flex;
    width: 180px;
    height: 91px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media ${media.smallDesktop} {
    gap: 1.6rem;
  }
`;

const NoData = styled.span`
  font-size: 1.6rem;
`;

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
  padding: 1rem 1rem 0 0;
`;

const ContentWrapper = styled.div<ContentWrapperProps>`
  display: ${(props) => (props.$isVisible ? "flex" : "none")};
  gap: 1rem;
  width: 100%;
  padding: 0.5rem 1rem;
  justify-content: space-between;
  align-items: center;
`;

const ClickableWrapper = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const RotatedIcon = styled.img<{ $rotated: boolean }>`
  transform: ${({ $rotated }) => ($rotated ? "rotate(180deg)" : "none")};
  cursor: pointer;
`;

export {
  AverageDot,
  AverageValue,
  AverageValueContainer,
  BlueButton,
  Button,
  ButtonsContainer,
  CancelButtonX,
  ClickableWrapper,
  ContentWrapper,
  HeaderWrapper,
  InfoContainer,
  MinMaxValueContainer,
  ModalDesktopHeader,
  ModalMobileHeader,
  NoData,
  ProfileName,
  RotatedIcon,
  SensorName,
  SessionDetailsModal,
  SessionName,
  SmallDot,
  SmallPopup,
  TimeRange,
  Value,
  Wrapper,
};
