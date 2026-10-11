import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { UserPreferencesProvider } from './providers/UserPreferencesProvider';
import { AstronomyProvider } from './providers/AstronomyContext';

export const App: React.FC = () => {
  return (
    <UserPreferencesProvider>
      <AstronomyProvider>
        <RouterProvider router={router} />
      </AstronomyProvider>
    </UserPreferencesProvider>
  );
};

export default App;
