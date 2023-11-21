import styled from "styled-components";

const GradientBox = styled.div`
  background: linear-gradient(241deg, rgba(0, 181, 239, 0.40) -2.4%, rgba(0, 181, 239, 0.00) 94.94%), #81DBCB;
  position: relative;
  display: flex;
  color: white;
  padding: 20px;
  text-align: center;
  width: 292px;
  height: 180px;
  border-radius: 10px;
`;

const GradientImage = styled.div`
  position: absolute;
  flex: 1; // Adjust flex proportions as needed
  display: flex;
  justify-content: center;
  align-items: center;
  left: 5%;
  top: 50%;
  transform: translateY(-50%);
  height: 50%;
  width: auto;
`;

const TextContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: right;
  padding: 20px;
  text-align: right;
`;

export { GradientBox, GradientImage, TextContainer }