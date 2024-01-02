import styled from "styled-components";
import { H3, H4, H5 } from "../../Typography";

const Container = styled.div`
  background: #F4F6F9;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const ImageContainer = styled.div`
  padding-left: 15px;
`;

const TextContainer = styled.div`
  color: #4C5660;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding-left: 21px;
`;

const BoldText = styled.div`
  font-weight: 600;
  display: inline;
`;

const Description = styled(H5)`
  font-weight: 500;
  padding-bottom: 10px;
`;

const Header = styled(H3)`
  font-weight: 700;
  padding-bottom: 10px;
`;

const DataDescriptionText = styled(H4)`
  font-weight: 400;
  padding-bottom: 6px;
  line-height: 160%;
`;

const DataDescriptionValue = styled(DataDescriptionText)`
  font-weight: 500;
  text-transform: uppercase;
`;

export { Container, TextContainer, BoldText, ImageContainer, Description, Header, DataDescriptionText, DataDescriptionValue };
