// app/index.tsx
import { Redirect } from 'expo-router';
import React from 'react';

export default function AppIndex() {
  // Por enquanto, vamos sempre redirecionar para a tela de login.
  // No futuro, aqui você verificaria se o usuário já está logado.
  // Se estiver logado, redirecionaria para '/(tabs)/explore' ou sua tela principal.
  // Se não estiver logado, redirecionaria para '/login'.
  return <Redirect href="/login" />;
}