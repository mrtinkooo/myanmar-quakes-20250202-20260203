import type { QuakeFeature } from '../data/types';
import { formatUtcDateTime } from '../utils/time';

export default function EventTable(props: {
  quakes: QuakeFeature[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = [...props.quakes].sort((a, b) => b.properties.time - a.properties.time);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Events</div>
        <div className="panelMeta">{rows.length.toLocaleString()}</div>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Mag</th>
              <th>Depth</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => {
              const selected = props.selectedId === q.id;
              return (
                <tr
                  key={q.id}
                  className={selected ? 'rowSelected' : undefined}
                  onClick={() => props.onSelect(q.id)}
                  title={q.properties.place}
                >
                  <td className="mono">{formatUtcDateTime(q.properties.time)}</td>
                  <td className="mono">{q.properties.mag.toFixed(1)}</td>
                  <td className="mono">{q.geometry.coordinates[2].toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
