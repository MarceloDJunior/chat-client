import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
`;

export const Date = styled.div`
  margin: 30px auto;
  background-color: rgba(255, 255, 255, 0.1);
  width: fit-content;
  padding: 6px 12px;
  border-radius: 14px;
`;

type MessageProps = {
  isSent?: boolean;
};

export const MessageWrapper = styled.div<MessageProps>`
  display: flex;
  justify-content: ${(props) => (props.isSent ? 'flex-end' : 'flex-start')};
  padding: 10px 0;

  & > div {
    align-items: ${(props) => (props.isSent ? 'flex-end' : 'flex-start')};
    background-color: ${(props) =>
      props.isSent ? '#CCC' : 'rgb(178, 185, 252)'};
  }
`;

export const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  color: #000;
  border-radius: 20px;
  padding: 10px 14px;
  min-width: 100px;
`;

export const Time = styled.div`
  font-size: 11px;
  font-weight: bold;
  margin-top: 2px;
`;

export const Status = styled.div`
  display: flex;
  justify-content: flex-end;
`;
