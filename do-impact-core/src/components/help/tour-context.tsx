"use client";

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import type { ModuleTour, TourStep } from "@/lib/help-registry";
import { getTourForRoute, listTours } from "@/lib/tours";

export type TourState = {
  completed: string[];
  dismissed: string[];
  lastSeenAt: Record<string, string>;
};

export const DEFAULT_TOUR_STATE: TourState = {
  completed: [],
  dismissed: [],
  lastSeenAt: {},
};

type TourContextValue = {
  activeTour: ModuleTour | null;
  activeStepIndex: number;
  activeStep: TourStep | null;
  isRunning: boolean;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  stopTour: () => void;
  completeTour: () => void;
  markDismissed: (key: string) => void;
  hasCompleted: (tourId: string) => boolean;
  hasDismissed: (key: string) => boolean;
  currentRouteTour: ModuleTour | undefined;
};

const NOOP_TOUR: TourContextValue = {
  activeTour: null,
  activeStepIndex: 0,
  activeStep: null,
  isRunning: false,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  stopTour: () => {},
  completeTour: () => {},
  markDismissed: () => {},
  hasCompleted: () => false,
  hasDismissed: () => false,
  currentRouteTour: undefined,
};

const TourContext = React.createContext<TourContextValue>(NOOP_TOUR);

export function useTour() {
  return React.useContext(TourContext);
}

export function TourProvider({
  children,
  state,
  onChange,
}: {
  children: React.ReactNode;
  state: TourState;
  onChange: (next: TourState) => void;
}) {
  const [activeTour, setActiveTour] = React.useState<ModuleTour | null>(null);
  const [activeStepIndex, setActiveStepIndex] = React.useState(0);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const currentRouteTour = React.useMemo(() => getTourForRoute(pathname), [pathname]);

  const persist = React.useCallback(
    (patch: Partial<TourState>) => {
      onChange({ ...state, ...patch });
    },
    [onChange, state],
  );

  const startTour = React.useCallback(
    (tourId: string) => {
      const tour = listTours().find((t) => t.id === tourId) ?? currentRouteTour;
      if (!tour) return;
      setActiveTour(tour);
      setActiveStepIndex(0);
      persist({ lastSeenAt: { ...state.lastSeenAt, [tour.id]: new Date().toISOString() } });
    },
    [currentRouteTour, persist, state.lastSeenAt],
  );

  const completeTour = React.useCallback(() => {
    if (!activeTour) return;
    const nextCompleted = state.completed.includes(activeTour.id) ? state.completed : [...state.completed, activeTour.id];
    persist({ completed: nextCompleted });
    setActiveTour(null);
    setActiveStepIndex(0);
  }, [activeTour, persist, state.completed]);

  const nextStep = React.useCallback(() => {
    if (!activeTour) return;
    if (activeStepIndex < activeTour.steps.length - 1) {
      setActiveStepIndex((i) => i + 1);
    } else {
      completeTour();
    }
  }, [activeTour, activeStepIndex, completeTour]);

  const prevStep = React.useCallback(() => {
    setActiveStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const stopTour = React.useCallback(() => {
    setActiveTour(null);
    setActiveStepIndex(0);
  }, []);

  const markDismissed = React.useCallback(
    (key: string) => {
      if (state.dismissed.includes(key)) return;
      persist({ dismissed: [...state.dismissed, key] });
    },
    [persist, state.dismissed],
  );

  const hasCompleted = React.useCallback((tourId: string) => state.completed.includes(tourId), [state.completed]);
  const hasDismissed = React.useCallback((key: string) => state.dismissed.includes(key), [state.dismissed]);

  const activeStep = activeTour?.steps[activeStepIndex] ?? null;
  const isRunning = !!activeTour;

  const value: TourContextValue = {
    activeTour,
    activeStepIndex,
    activeStep,
    isRunning,
    startTour,
    nextStep,
    prevStep,
    stopTour,
    completeTour,
    markDismissed,
    hasCompleted,
    hasDismissed,
    currentRouteTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

