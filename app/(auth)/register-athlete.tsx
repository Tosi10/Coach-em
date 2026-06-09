import { Redirect } from 'expo-router';

export default function RegisterAthleteRedirect() {
  return <Redirect href="/(auth)/sign-up?register=athlete" />;
}
