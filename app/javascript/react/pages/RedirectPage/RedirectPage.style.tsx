import styled, { keyframes } from "styled-components";
import { blue, gray300, gray400, white } from "../../assets/styles/colors";
import { Button } from "../../components/Button/Button.style";

const dotFlashing = keyframes`
  0% {
    opacity: 0.2;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
`;

interface DotProps {
  delay: string;
}

const Dot = styled.span<DotProps>`
  font-size: 24px;
  margin: 0 2px;
  animation: ${dotFlashing} 1.4s infinite both;
  animation-delay: ${({ delay }) => delay};
`;

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  position: absolute;
  top: 0;
  left: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  color: ${gray300};
  width: 50%;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 1.25rem;
  font-weight: 500;
  color: ${gray400};
`;

const Description = styled.p`
  font-size: 1.6rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const BlueButton = styled(Button)`
  background-color: ${blue};
  color: ${white};
  font-weight: 600;
  border: none;
  width: fit-content;
  font-size: 1.4rem;
  padding: 1rem 1.2rem;
  text-transform: uppercase;
`;

export { BlueButton, ContentContainer, Description, Dot, PageContainer, Title };
