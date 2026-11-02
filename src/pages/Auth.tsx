import { AuthForm } from '../components/AuthForm';
import { AuthShell } from '../components/AuthShell';
import { useKult } from '../providers';
export function AuthPage() {
  const { signIn, signUp } = useKult();
  return <AuthShell appName="Kult" logo="/kult.svg"><AuthForm onAuthenticate={(email, password, signUpMode) => signUpMode ? signUp(email, password) : signIn(email, password)} /></AuthShell>;
}
