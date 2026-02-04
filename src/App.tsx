import { useEffect, useMemo } from 'react';
import { loadDashboardData } from './data/loadGeojson';
import type { QuakeFeature } from './data/types';
import EventTable from './components/EventTable';
import FiltersPanel from './components/FiltersPanel';
import DetailsPanel from './components/DetailsPanel';
import MapView from './components/MapView';
import DepthHistogram from './components/charts/DepthHistogram';
import DepthVsMagScatter from './components/charts/DepthVsMagScatter';
import MagHistogram from './components/charts/MagHistogram';
import TimeSeriesChart from './components/charts/TimeSeriesChart';
import { DashboardProvider, useDashboard } from './state/dashboardState';
import { computeExtents, computeStats, filterQuakes } from './state/filtering';
import { formatUtcDate } from './utils/time';

function findSelected(quakes: QuakeFeature[], id: string | null): QuakeFeature | null {
  if (!id) return null;
  return quakes.find((q) => q.id === id) ?? null;
}

function TopBar(props: { title: string; stats: ReturnType<typeof computeStats> }) {
  const { stats } = props;
  return (
    <header className="topBar">
      <div className="topTitle">{props.title}</div>
      <div className="topKpis">
        <div className="chip">
          <div className="chipLabel">Filtered</div>
          <div className="chipValue">{stats.count.toLocaleString()}</div>
        </div>
        <div className="chip">
          <div className="chipLabel">Max mag</div>
          <div className="chipValue">{stats.maxMag ? stats.maxMag.toFixed(1) : 'N/A'}</div>
        </div>
        <div className="chip">
          <div className="chipLabel">Time span</div>
          <div className="chipValue">
            {stats.minTime && stats.maxTime ? `${formatUtcDate(stats.minTime)}-${formatUtcDate(stats.maxTime)}` : 'N/A'}
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardApp() {
  const { state, actions } = useDashboard();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { quakes, lineaments, admin0 } = await loadDashboardData();
        if (cancelled) return;
        const extents = computeExtents(quakes);
        actions.dataLoaded({ quakes, lineaments, admin0, extents });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        actions.dataError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actions]);

  const loaded =
    state.data.loaded && !!state.extents && !!state.data.admin0 && !!state.data.lineaments && !state.data.error;

  const quakes = state.data.quakes;
  const extents = state.extents;
  const filters = state.filters;

  const filteredAll = useMemo(() => (loaded ? filterQuakes(quakes, filters) : []), [loaded, quakes, filters]);
  const filteredForTime = useMemo(() => {
    if (!loaded || !extents) return [];
    return filterQuakes(quakes, { ...filters, time: extents.time });
  }, [loaded, quakes, filters, extents]);
  const filteredForMag = useMemo(() => {
    if (!loaded || !extents) return [];
    return filterQuakes(quakes, { ...filters, mag: extents.mag });
  }, [loaded, quakes, filters, extents]);
  const filteredForDepth = useMemo(() => {
    if (!loaded || !extents) return [];
    return filterQuakes(quakes, { ...filters, depthKm: extents.depthKm });
  }, [loaded, quakes, filters, extents]);

  const selectedQuake = useMemo(
    () => (loaded ? findSelected(quakes, state.selection.selectedQuakeId) : null),
    [loaded, quakes, state.selection.selectedQuakeId],
  );
  const stats = useMemo(() => computeStats(filteredAll), [filteredAll]);

  if (state.data.error) {
    return (
      <div className="appShell">
        <div className="errorCard">
          <div className="errorTitle">Failed to load data</div>
          <div className="errorMsg">{state.data.error}</div>
          <div className="errorHint">
            Expected files in <span className="mono">public/data/</span>: quakes.json, Myanmar_Tectonic_Map_2011.geojson,
            admin0.json
          </div>
        </div>
      </div>
    );
  }

  if (!loaded || !extents || !state.data.admin0 || !state.data.lineaments) {
    return (
      <div className="appShell">
        <div className="loadingCard">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar title="Myanmar Quakes + Tectonic Lineaments" stats={stats} />

      <div className="layout">
        <aside className="sidebar">
          <FiltersPanel
            extents={extents}
            filters={filters}
            totalCount={quakes.length}
            filteredCount={filteredAll.length}
            onSetTimeRange={actions.setTimeRange}
            onSetMagRange={actions.setMagRange}
            onSetDepthRange={actions.setDepthRange}
            onReset={actions.resetFilters}
            onFitFiltered={actions.fitFiltered}
          />

          <DetailsPanel quake={selectedQuake} onClear={() => actions.selectQuake(null)} />

          <EventTable
            quakes={filteredAll}
            selectedId={state.selection.selectedQuakeId}
            onSelect={(id) => actions.selectQuake(id)}
          />
        </aside>

        <main className="main">
          <MapView
            admin0={state.data.admin0}
            lineaments={state.data.lineaments}
            quakes={filteredAll}
            selectedQuakeId={state.selection.selectedQuakeId}
            fitFilteredNonce={state.map.fitFilteredNonce}
            onSelectQuake={(id) => actions.selectQuake(id)}
          />

          <div className="charts">
            <TimeSeriesChart
              quakes={filteredForTime}
              extentsTime={extents.time}
              selectedTime={filters.time}
              onSetTimeRange={actions.setTimeRange}
            />
            <MagHistogram
              quakes={filteredForMag}
              extentsMag={extents.mag}
              selectedMag={filters.mag}
              onSetMagRange={actions.setMagRange}
            />
            <DepthHistogram
              quakes={filteredForDepth}
              extentsDepth={extents.depthKm}
              selectedDepth={filters.depthKm}
              onSetDepthRange={actions.setDepthRange}
            />
            <DepthVsMagScatter
              quakes={filteredAll}
              selectedId={state.selection.selectedQuakeId}
              onSelectQuake={(id) => actions.selectQuake(id)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}
