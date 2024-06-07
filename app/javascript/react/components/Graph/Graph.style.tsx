import styled from "styled-components";

export const Container = styled.div`
  position: relative;
`;

export const ScrollbarContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px; // Adjust the height if needed
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; // To ensure the scrollbar does not block interactions with the chart
`;

export const ChartContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: all;
`;
