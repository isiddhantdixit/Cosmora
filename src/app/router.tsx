import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { LoadingFallback } from '../components/ui/LoadingFallback';
import { HomePage } from '../features/home/HomePage';

const SkyExplorerPage = lazy(() =>
  import('../features/sky-explorer/SkyExplorerPage').then((m) => ({ default: m.SkyExplorerPage }))
);
const UniversePage = lazy(() =>
  import('../features/planetarium/UniversePage').then((m) => ({ default: m.UniversePage }))
);
const TonightPage = lazy(() =>
  import('../features/tonight/TonightPage').then((m) => ({ default: m.TonightPage }))
);
const PlanetsPage = lazy(() =>
  import('../features/planets/PlanetsPage').then((m) => ({ default: m.PlanetsPage }))
);
const ConstellationsPage = lazy(() =>
  import('../features/constellations/ConstellationsPage').then((m) => ({ default: m.ConstellationsPage }))
);
const SatellitesPage = lazy(() =>
  import('../features/satellites/SatellitesPage').then((m) => ({ default: m.SatellitesPage }))
);
const ObjectDetailsPage = lazy(() =>
  import('../features/object-details/ObjectDetailsPage').then((m) => ({ default: m.ObjectDetailsPage }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const CompanionSenderPage = lazy(() =>
  import('../features/companion/CompanionSenderPage').then((m) => ({ default: m.CompanionSenderPage }))
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'explore',
        element: (
          <Suspense fallback={<LoadingFallback message="Initializing AR camera optical sensor..." />}>
            <SkyExplorerPage />
          </Suspense>
        )
      },
      {
        path: 'universe',
        element: (
          <Suspense fallback={<LoadingFallback message="Loading 3D planetarium celestial sphere..." />}>
            <UniversePage />
          </Suspense>
        )
      },
      {
        path: 'tonight',
        element: (
          <Suspense fallback={<LoadingFallback message="Calculating horizon altitudes..." />}>
            <TonightPage />
          </Suspense>
        )
      },
      {
        path: 'planets',
        element: (
          <Suspense fallback={<LoadingFallback message="Loading planetary ephemeris data..." />}>
            <PlanetsPage />
          </Suspense>
        )
      },
      {
        path: 'constellations',
        element: (
          <Suspense fallback={<LoadingFallback message="Mapping IAU constellation asterisms..." />}>
            <ConstellationsPage />
          </Suspense>
        )
      },
      {
        path: 'satellites',
        element: (
          <Suspense fallback={<LoadingFallback message="Propagating SGP4 orbital tracks..." />}>
            <SatellitesPage />
          </Suspense>
        )
      },
      {
        path: 'object/:id',
        element: (
          <Suspense fallback={<LoadingFallback message="Retrieving astrometric telemetry..." />}>
            <ObjectDetailsPage />
          </Suspense>
        )
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback message="Loading sensor diagnostics..." />}>
            <SettingsPage />
          </Suspense>
        )
      },
      {
        path: 'companion',
        element: (
          <Suspense fallback={<LoadingFallback message="Connecting companion camera controller..." />}>
            <CompanionSenderPage />
          </Suspense>
        )
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
