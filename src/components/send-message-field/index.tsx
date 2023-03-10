import { FormEvent, useState } from 'react';
import * as S from './styles';

type SendMessageFieldProps = {
  onSubmit: (text: string) => Promise<boolean>;
  onFocus?: () => void;
  isSending?: boolean;
};

export const SendMessageField = ({
  onSubmit,
  onFocus,
  isSending,
}: SendMessageFieldProps) => {
  const [text, setText] = useState<string>('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onSubmit(text);
    if (result) {
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <S.Container>
        <S.Input
          type="text"
          name="text"
          onChange={(event) => setText(event.target.value)}
          value={text}
          readOnly={isSending}
          onFocus={onFocus}
        />
        <button type="submit" disabled={isSending}>
          Send Message
        </button>
      </S.Container>
    </form>
  );
};
