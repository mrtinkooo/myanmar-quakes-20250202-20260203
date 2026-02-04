import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { Admin0FC, Filters, LineamentsFC, QuakeFeature } from '../data/types';
import type { Extents } from './filtering';

type DataState = {
  quakes: QuakeFeature[];
  lineaments: LineamentsFC | null;
  admin0: Admin0FC | null;
  loaded: boolean;
  error: string | null;
};

export type DashboardState = {
  data: DataState;
  extents: Extents | null;
  filters: Filters;
  selection: {
    selectedQuakeId: string | null;
  };
  map: {
    fitFilteredNonce: number;
  };
};

const EMPTY_FILTERS: Filters = {
  time: { startMs: 0, endMs: 0 },
  mag: { min: 0, max: 0 },
  depthKm: { min: 0, max: 0 },
};

const initialState: DashboardState = {
  data: { quakes: [], lineaments: null, admin0: null, loaded: false, error: null },
  extents: null,
  filters: EMPTY_FILTERS,
  selection: { selectedQuakeId: null },
  map: { fitFilteredNonce: 0 },
};

type Action =
  | {
      type: 'dataLoaded';
      payload: {
        quakes: QuakeFeature[];
        lineaments: LineamentsFC;
        admin0: Admin0FC;
        extents: Extents;
      };
    }
  | { type: 'dataError'; error: string }
  | { type: 'setTimeRange'; startMs: number; endMs: number }
  | { type: 'setMagRange'; min: number; max: number }
  | { type: 'setDepthRange'; min: number; max: number }
  | { type: 'resetFilters' }
  | { type: 'selectQuake'; id: string | null }
  | { type: 'fitFiltered' };

function clampRange(min: number, max: number, extentMin: number, extentMax: number): { min: number; max: number } {
  const lo = Math.max(extentMin, Math.min(extentMax, min));
  const hi = Math.max(extentMin, Math.min(extentMax, max));
  if (lo <= hi) return { min: lo, max: hi };
  return { min: hi, max: lo };
}

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'dataLoaded': {
      const { quakes, lineaments, admin0, extents } = action.payload;
      return {
        ...state,
        data: { quakes, lineaments, admin0, loaded: true, error: null },
        extents,
        filters: extents,
        selection: { selectedQuakeId: null },
      };
    }
    case 'dataError':
      return {
        ...state,
        data: { ...state.data, loaded: false, error: action.error },
      };
    case 'setTimeRange': {
      if (!state.extents) return state;
      const r = clampRange(action.startMs, action.endMs, state.extents.time.startMs, state.extents.time.endMs);
      return { ...state, filters: { ...state.filters, time: { startMs: r.min, endMs: r.max } } };
    }
    case 'setMagRange': {
      if (!state.extents) return state;
      const r = clampRange(action.min, action.max, state.extents.mag.min, state.extents.mag.max);
      return { ...state, filters: { ...state.filters, mag: { min: r.min, max: r.max } } };
    }
    case 'setDepthRange': {
      if (!state.extents) return state;
      const r = clampRange(action.min, action.max, state.extents.depthKm.min, state.extents.depthKm.max);
      return { ...state, filters: { ...state.filters, depthKm: { min: r.min, max: r.max } } };
    }
    case 'resetFilters':
      if (!state.extents) return state;
      return { ...state, filters: state.extents, selection: { selectedQuakeId: null } };
    case 'selectQuake':
      return { ...state, selection: { selectedQuakeId: action.id } };
    case 'fitFiltered':
      return { ...state, map: { fitFilteredNonce: state.map.fitFilteredNonce + 1 } };
    default:
      return state;
  }
}

type DashboardContextValue = {
  state: DashboardState;
  actions: {
    setTimeRange: (startMs: number, endMs: number) => void;
    setMagRange: (min: number, max: number) => void;
    setDepthRange: (min: number, max: number) => void;
    resetFilters: () => void;
    selectQuake: (id: string | null) => void;
    fitFiltered: () => void;
    dataLoaded: (payload: Action['payload']) => void;
    dataError: (error: string) => void;
  };
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo<DashboardContextValue['actions']>(() => {
    return {
      setTimeRange: (startMs, endMs) => dispatch({ type: 'setTimeRange', startMs, endMs }),
      setMagRange: (min, max) => dispatch({ type: 'setMagRange', min, max }),
      setDepthRange: (min, max) => dispatch({ type: 'setDepthRange', min, max }),
      resetFilters: () => dispatch({ type: 'resetFilters' }),
      selectQuake: (id) => dispatch({ type: 'selectQuake', id }),
      fitFiltered: () => dispatch({ type: 'fitFiltered' }),
      dataLoaded: (payload) => dispatch({ type: 'dataLoaded', payload }),
      dataError: (error) => dispatch({ type: 'dataError', error }),
    };
  }, []);

  return <DashboardContext.Provider value={{ state, actions }}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

