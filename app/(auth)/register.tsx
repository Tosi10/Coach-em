/** Redireciona para login com registo treinador inline (deep links / rotas antigas). */
import { Redirect } from 'expo-router';

export default function RegisterCoachRedirect() {
  return <Redirect href="/(auth)/login?register=coach" />;
}
