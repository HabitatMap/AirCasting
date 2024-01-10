import styled, { css } from "styled-components";

import { backgroundGray, blue    } from "../../assets/styles/colors";

// This will be the outer container
const RectangleContainer = styled.div`
  position: relative;
  width: 100px; // Adjust the width as needed
  height: 300px; // This sets the height of the entire container including the overlay
`;

// This is the gray background at the bottom
const BackgroundContainer = styled.div`
  background-color: ${backgroundGray};
  width: 100%;
  height: 100px; // Fixed height for the gray background
  position: absolute;
  bottom: 0; // Aligns to the bottom of the RectangleContainer
`;

// This is the blue rectangle with top rounded corners, positioned on top of the BackgroundContainer
const ColorfullRectangleContainer = styled.div`
  background-color: ${blue};
  width: 100%; // The blue rectangle will have the same width
  height: 50px; // Height of the blue rectangle
  position: absolute;
  bottom: 0; // Aligns to the bottom of the RectangleContainer
  border-radius: 16px 16px 0 0; // Rounded top corners
  z-index: 2; // Ensures it's above the BackgroundContainer
`;


export { 
    BackgroundContainer,
    RectangleContainer,
    ColorfullRectangleContainer
};
