import { Contact } from '../../models/contact';
import PlaceholderImage from '../../assets/images/profile-placeholder.jpg';
import * as S from './styles';

type ContactHeaderProps = {
  contact: Contact;
};

export const ContactHeader = ({ contact }: ContactHeaderProps) => {
  return (
    <S.Container>
      <S.Picture src={contact.picture ?? PlaceholderImage} alt="Picture" />
      <div>{contact.name}</div>
    </S.Container>
  );
};
