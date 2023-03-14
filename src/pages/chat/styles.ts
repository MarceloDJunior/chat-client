import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  display: flex;
  min-height: 100vh;
`;

export const Picture = styled.img`
  border-radius: 50%;
  width: 50px;
  height: 50px;
`;

export const Sidebar = styled.div`
  flex: 1;
  border: 1px solid rgba(189, 189, 189, 0.179);
`;

export const MainContent = styled.main`
  flex: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
`;

export const Messages = styled.div`
  width: 100%;
  flex: 1 1 0;
  overflow: auto;
  padding: 20px;
`;

export const Center = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
