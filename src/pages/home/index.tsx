import { LoginButton } from '../../components/login-button';
import { LogoutButton } from '../../components/logout-button';
import { useGetContactsQuery } from '../../queries/contacts';
import { useGetUser } from '../../queries/user';
import styles from './styles.module.scss';

export const Home = () => {
  const { data: user, isLoading } = useGetUser();
  const { data: contacts } = useGetContactsQuery();

  if (isLoading) {
    return <div className={styles.container}>Loading ...</div>;
  }

  return user ? (
    <div className={styles.container}>
      <img src={user.picture} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <h4>Contacts</h4>
      <ul>
        {contacts?.map((contact) => (
          <li>{contact.name}</li>
        ))}
      </ul>
      <LogoutButton />
    </div>
  ) : (
    <div className={styles.container}>
      <LoginButton />
    </div>
  );
};
