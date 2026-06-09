import { Redirect } from 'expo-router';

export default function RegisterCoachRedirect() {
  return <Redirect href="/(auth)/sign-up?register=coach" />;
}
