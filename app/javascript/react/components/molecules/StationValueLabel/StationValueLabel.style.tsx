import styled from "styled-components";

const GradientBox = styled.div`
  background: linear-gradient(
      241deg,
      rgba(0, 181, 239, 0.4) -2.4%,
      rgba(0, 181, 239, 0) 94.94%
    ),
    #81dbcb;
  position: relative;
  display: flex;
  color: white;
  width: 16%;
  height: 11%;
  border-radius: 10px;
`;

const GradientImage = styled.div`
  position: absolute;
  flex: 1;
  display: flex;
  align-items: left;
  left: 6%;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 40%;
`;

const TextContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: right;
  text-align: right;
  padding-right: 6%;
  padding-top: 10%;
  padding-bottom: 10%;
  color: white;
`;

export { GradientBox, GradientImage, TextContainer };
