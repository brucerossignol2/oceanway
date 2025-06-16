// app/providers.jsx
"use client"; // Ce composant doit être un Composant Client

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créez un client
const queryClient = new QueryClient();

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}