import styled from 'styled-components';

export const Container = styled.div`
  border-bottom: 1px solid rgba(189, 189, 189, 0.179);
  display: flex;
  align-items: center;
  padding: 28px 20px 20px;
`;

export const Picture = styled.img`
  margin-right: 12px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
`;

export const Name = styled.h2`
  font-size: 18px;
  line-height: 20px;
  margin: 2px 0;
  padding: 0;
`;

export const Email = styled.p`
  margin: 0 0 8px;
`;
