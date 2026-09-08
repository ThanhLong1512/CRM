'use client';

import AuthScreen from '../../../src/components/auth/AuthScreen';
import { useRouter } from 'next/navigation';
import { AuthUser } from '../../../src/types';
import { saveAuthUser } from '../../../src/components/auth/authData';

export default function AuthPage() {
  const router = useRouter();

  const handleLoginSuccess = (user: AuthUser) => {
    saveAuthUser(user);
    // Redirect to main CRM dashboard
    router.push('/');
  };

  return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
}
