import type { QuakeFeature } from '../data/types';
import { formatUtcDateTime } from '../utils/time';

export default function DetailsPanel(props: { quake: QuakeFeature | null; onClear: () => void }) {
  const q = props.quake;
  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Selected event</div>
        {q ? (
          <button className="linkButton" type="button" onClick={props.onClear}>
            Clear
          </button>
        ) : (
          <div className="panelMeta">None</div>
        )}
      </div>

      {!q ? (
        <div className="emptyState">Click a quake marker or a chart point to see details.</div>
      ) : (
        <div className="details">
          <div className="kpiRow">
            <div className="kpi">
              <div className="kpiLabel">Magnitude</div>
              <div className="kpiValue">M {q.properties.mag.toFixed(1)}</div>
            </div>
            <div className="kpi">
              <div className="kpiLabel">Depth</div>
              <div className="kpiValue">{q.geometry.coordinates[2].toFixed(1)} km</div>
            </div>
          </div>

          <div className="kv">
            <div className="kvKey">Time (UTC)</div>
            <div className="kvVal">{formatUtcDateTime(q.properties.time)}</div>
          </div>
          <div className="kv">
            <div className="kvKey">Place</div>
            <div className="kvVal">{q.properties.place}</div>
          </div>
          <div className="kv">
            <div className="kvKey">Status</div>
            <div className="kvVal">{q.properties.status}</div>
          </div>
          <div className="kv">
            <div className="kvKey">USGS</div>
            <div className="kvVal">
              <a href={q.properties.url} target="_blank" rel="noreferrer">
                Open event page
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

