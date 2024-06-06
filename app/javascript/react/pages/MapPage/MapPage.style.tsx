import styled from "styled-components";

const StyledMapContainer = styled.div`
  body:not(.user-is-tabbing) .gm-style iframe + div {
    border: none !important;
  }
`;

export { StyledMapContainer };
