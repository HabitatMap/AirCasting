import styled from "styled-components";
import { white } from "../assets/styles/colors";

const PageLayout = styled.div`
  background-color: ${white};
  height: 100vh;
  padding: 30px;
`;

const StationDataContainer = styled.div`
  box-shadow: 0px 5px 20px 2px rgba(0, 0, 0, 0.1);
  background: ${white};
  width: 90vw;
  max-width: 1600px;
`;


export { PageLayout, StationDataContainer }
