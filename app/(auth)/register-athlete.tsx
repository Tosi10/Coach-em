/** Redireciona para login com registo atleta inline (deep links / rotas antigas). */
import { Redirect } from 'expo-router';

export default function RegisterAthleteRedirect() {
  return <Redirect href="/(auth)/login?register=athlete" />;
}
