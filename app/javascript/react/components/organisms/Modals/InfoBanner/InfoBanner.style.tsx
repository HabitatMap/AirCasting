import styled, { css, keyframes } from "styled-components";

import {
  acBlue,
  acBlueDark,
  gray100,
  gray300,
  gray400,
  white,
} from "../../../../assets/styles/colors";
import { media } from "../../../../utils/media";

const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(1.6rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const BannerWrapper = styled.aside<{ $compact: boolean }>`
  position: fixed;
  left: 1.6rem;
  bottom: 1.6rem;
  width: 34rem;
  max-width: calc(100vw - 3.2rem);
  background: ${white};
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 0.6rem 2.4rem rgba(12, 40, 60, 0.18);
  z-index: 1000;
  display: flex;
  animation: ${rise} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;

  ${({ $compact }) =>
    $compact
      ? css`
          flex-direction: row;
          align-items: stretch;
        `
      : css`
          flex-direction: column;
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media ${media.mobile} {
    left: 1.2rem;
    right: 1.2rem;
    bottom: 1.2rem;
    width: auto;
    max-width: none;
  }
`;

// --- Image variant --------------------------------------------------------

const Thumb = styled.div`
  position: relative;
  width: 100%;
  height: 12rem;
  overflow: hidden;
  background: ${gray100};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

// --- Compact (text-only) variant ------------------------------------------

const Accent = styled.div`
  flex: 0 0 0.6rem;
  background: ${acBlue};
`;

// --- Minimal variant (A/B "minimal") --------------------------------------
// A single clickable card: no image, no button. The whole surface is the
// click target via a stretched link (MinimalLink::after covers the card).

const MinimalBanner = styled.aside`
  position: fixed;
  left: 1.6rem;
  bottom: 1.6rem;
  width: 34rem;
  max-width: calc(100vw - 3.2rem);
  background: ${white};
  border-radius: 1.2rem;
  overflow: hidden;
  box-shadow: 0 0.6rem 2.4rem rgba(12, 40, 60, 0.18);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease, background 0.15s ease;
  animation: ${rise} 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;

  &:hover {
    background: ${gray100};
    box-shadow: 0 0.9rem 3rem rgba(12, 40, 60, 0.26);
    transform: translateY(-0.2rem);
  }

  &:hover p:last-of-type,
  &:focus-within p:last-of-type {
    text-decoration: underline;
    text-decoration-color: ${acBlue};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
    &:hover {
      transform: none;
    }
  }

  @media ${media.mobile} {
    left: 1.2rem;
    right: 1.2rem;
    bottom: 1.2rem;
    width: auto;
    max-width: none;
  }
`;

// Invisible anchor whose ::after overlay makes the entire card clickable.
// The close button sits above this overlay (higher z-index) so it stays usable.
const MinimalLink = styled.a`
  text-decoration: none;
  color: inherit;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
`;

// --- Shared ----------------------------------------------------------------

const HabitatBadge = styled.div<{ $onImage?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ $onImage }) => ($onImage ? gray400 : gray300)};

  img {
    height: 1.6rem;
    width: auto;
    display: block;
  }

  ${({ $onImage }) =>
    $onImage &&
    css`
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: rgba(255, 255, 255, 0.94);
      border-radius: 2rem;
      padding: 0.4rem 0.9rem;
      box-shadow: 0 0.1rem 0.4rem rgba(0, 0, 0, 0.15);
      z-index: 2;
    `}
`;

const CloseButton = styled.button<{ $onImage?: boolean }>`
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 2.6rem;
  height: 2.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $onImage }) =>
    $onImage ? "rgba(255, 255, 255, 0.9)" : gray100};
  box-shadow: ${({ $onImage }) =>
    $onImage ? "0 0.1rem 0.4rem rgba(0, 0, 0, 0.2)" : "none"};

  img {
    width: 1.2rem;
    height: 1.2rem;
    object-fit: contain;
  }

  &:hover {
    background: ${({ $onImage }) =>
      $onImage ? white : "rgba(0, 0, 0, 0.06)"};
  }

  ${({ $onImage }) =>
    $onImage &&
    css`
      position: absolute;
      top: 0.9rem;
      right: 0.9rem;
      z-index: 3;
    `}

  body:not(.user-is-tabbing) &:focus-visible {
    outline: none;
  }
`;

const Body = styled.div`
  padding: 1.4rem 1.6rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex: 1;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
`;

// Same as TopRow but lifted above the minimal variant's stretched-link overlay
// so the close button remains clickable.
const MinimalTop = styled(TopRow)`
  position: relative;
  z-index: 2;
`;

const Kicker = styled.p`
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${acBlue};
`;

const Title = styled.p`
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.25;
  color: ${gray400};
  overflow-wrap: break-word;
`;

const ReadLink = styled.a`
  align-self: flex-start;
  margin-top: 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${acBlue};
  color: ${white};
  text-decoration: none;
  font-size: 1.4rem;
  font-weight: 700;
  padding: 0.9rem 1.6rem;
  border-radius: 0.8rem;
  transition: background 0.15s;

  &:hover {
    background: ${acBlueDark};
  }
`;

export {
  Accent,
  BannerWrapper,
  Body,
  CloseButton,
  HabitatBadge,
  Kicker,
  MinimalBanner,
  MinimalLink,
  MinimalTop,
  ReadLink,
  Thumb,
  Title,
  TopRow,
};
