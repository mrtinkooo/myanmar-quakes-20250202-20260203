import type { Extents } from '../state/filtering';
import type { Filters } from '../data/types';
import { DAY_MS, msToUtcDateInput, parseDateInputToUtcDayStartMs } from '../utils/time';

export default function FiltersPanel(props: {
  extents: Extents;
  filters: Filters;
  totalCount: number;
  filteredCount: number;
  onSetTimeRange: (startMs: number, endMs: number) => void;
  onSetMagRange: (min: number, max: number) => void;
  onSetDepthRange: (min: number, max: number) => void;
  onReset: () => void;
  onFitFiltered: () => void;
}) {
  const { extents, filters } = props;
  const startDate = msToUtcDateInput(filters.time.startMs);
  const endDate = msToUtcDateInput(filters.time.endMs);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Filters</div>
        <div className="panelMeta">
          {props.filteredCount.toLocaleString()} / {props.totalCount.toLocaleString()}
        </div>
      </div>

      <div className="field">
        <div className="labelRow">
          <label className="label" htmlFor="startDate">
            Time (UTC)
          </label>
          <span className="hint">
            {msToUtcDateInput(extents.time.startMs)}-{msToUtcDateInput(extents.time.endMs)}
          </span>
        </div>
        <div className="row2">
          <input
            id="startDate"
            type="date"
            value={startDate}
            min={msToUtcDateInput(extents.time.startMs)}
            max={msToUtcDateInput(extents.time.endMs)}
            onChange={(e) => {
              const start = parseDateInputToUtcDayStartMs(e.target.value);
              let end = filters.time.endMs;
              if (start > end) end = start + DAY_MS - 1;
              props.onSetTimeRange(start, end);
            }}
          />
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={msToUtcDateInput(extents.time.startMs)}
            max={msToUtcDateInput(extents.time.endMs)}
            onChange={(e) => {
              const endStart = parseDateInputToUtcDayStartMs(e.target.value);
              const end = endStart + DAY_MS - 1;
              let start = filters.time.startMs;
              if (end < start) start = endStart;
              props.onSetTimeRange(start, end);
            }}
          />
        </div>
      </div>

      <div className="field">
        <div className="labelRow">
          <label className="label">Magnitude</label>
          <span className="hint">
            {filters.mag.min.toFixed(1)}-{filters.mag.max.toFixed(1)}
          </span>
        </div>
        <div className="row2">
          <input
            type="number"
            step={0.1}
            value={filters.mag.min}
            min={extents.mag.min}
            max={filters.mag.max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              props.onSetMagRange(v, filters.mag.max);
            }}
          />
          <input
            type="number"
            step={0.1}
            value={filters.mag.max}
            min={filters.mag.min}
            max={extents.mag.max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              props.onSetMagRange(filters.mag.min, v);
            }}
          />
        </div>
        <div className="row2">
          <input
            type="range"
            min={extents.mag.min}
            max={extents.mag.max}
            step={0.1}
            value={filters.mag.min}
            onChange={(e) => props.onSetMagRange(Number(e.target.value), filters.mag.max)}
          />
          <input
            type="range"
            min={extents.mag.min}
            max={extents.mag.max}
            step={0.1}
            value={filters.mag.max}
            onChange={(e) => props.onSetMagRange(filters.mag.min, Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field">
        <div className="labelRow">
          <label className="label">Depth (km)</label>
          <span className="hint">
            {filters.depthKm.min.toFixed(0)}-{filters.depthKm.max.toFixed(0)}
          </span>
        </div>
        <div className="row2">
          <input
            type="number"
            step={1}
            value={filters.depthKm.min}
            min={extents.depthKm.min}
            max={filters.depthKm.max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              props.onSetDepthRange(v, filters.depthKm.max);
            }}
          />
          <input
            type="number"
            step={1}
            value={filters.depthKm.max}
            min={filters.depthKm.min}
            max={extents.depthKm.max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              props.onSetDepthRange(filters.depthKm.min, v);
            }}
          />
        </div>
        <div className="row2">
          <input
            type="range"
            min={extents.depthKm.min}
            max={extents.depthKm.max}
            step={1}
            value={filters.depthKm.min}
            onChange={(e) => props.onSetDepthRange(Number(e.target.value), filters.depthKm.max)}
          />
          <input
            type="range"
            min={extents.depthKm.min}
            max={extents.depthKm.max}
            step={1}
            value={filters.depthKm.max}
            onChange={(e) => props.onSetDepthRange(filters.depthKm.min, Number(e.target.value))}
          />
        </div>
      </div>

      <div className="actionsRow">
        <button className="button" onClick={props.onReset} type="button">
          Reset
        </button>
        <button className="button buttonAlt" onClick={props.onFitFiltered} type="button">
          Fit map to filtered
        </button>
      </div>
    </section>
  );
}
