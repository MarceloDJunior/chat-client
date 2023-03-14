import styled from 'styled-components';

export const ContactList = styled.ul`
  list-style: none;
  padding: 0;
`;

export const ContactWrapper = styled.li`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: rgba(100, 100, 100, 0.179);
  }
`;

export const Picture = styled.img`
  margin-right: 12px;
  border-radius: 50%;
  width: 50px;
  height: 50px;
`;

type StatusProps = {
  isOnline?: boolean;
};

export const Status = styled.div<StatusProps>`
  color: ${(props) =>
    props.isOnline ? 'rgb(19, 139, 0)' : 'rgb(147, 147, 147)'};
  font-size: 14px;
  font-weight: ${(props) => (props.isOnline ? 'bold' : 'normal')};
  text-transform: capitalize;
`;

export const Name = styled.div`
  display: flex;
  align-items: center;
`;

export const NewMessagesCounter = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  background-color: rgba(62, 105, 153, 1);
  color: #fff;
  border-radius: 18px;
  margin-left: 10px;
  padding: 4px;
`;
