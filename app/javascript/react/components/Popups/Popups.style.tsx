import Popup from "reactjs-popup";
import styled from "styled-components";

import { white } from "../../assets/styles/colors";

const WrapperButton = styled.div`
  display: flex;
  position: relative;
`;

const SmallPopup = styled(Popup)`
  width: 100%;
  height: auto;

  &-overlay {
  }

  &-content {
    width: 200px;
    background-color: ${white};
    opacity: 1;
    border-radius: 8px;
    position: relative;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 6;
    display: flex;
  }
`;

const ExportDataSmallPopup = styled(SmallPopup)`
  &-content {
    width: 180px;
  }
`;

const ConfirmationPopup = styled(Popup)`
  &-content {
    background-color: ${white};
    opacity: 1;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1200;
    display: flex;
  }
`;

export { ConfirmationPopup, ExportDataSmallPopup, SmallPopup, WrapperButton };
