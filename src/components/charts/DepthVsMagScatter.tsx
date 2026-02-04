import { useMemo } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QuakeFeature } from '../../data/types';
import { depthColor } from '../../utils/geo';

type PointRow = {
  id: string;
  mag: number;
  depthKm: number;
  time: number;
  place: string;
};

function Dot(props: { cx?: number; cy?: number; payload?: PointRow; selectedId: string | null }) {
  const { cx, cy, payload, selectedId } = props;
  if (typeof cx !== 'number' || typeof cy !== 'number' || !payload) return null;
  const selected = payload.id === selectedId;
  const r = selected ? 6 : 3.5;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={depthColor(payload.depthKm)}
      stroke={selected ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.25)'}
      strokeWidth={selected ? 2.5 : 1}
      opacity={selected ? 0.95 : 0.8}
    />
  );
}

export default function DepthVsMagScatter(props: {
  quakes: QuakeFeature[];
  selectedId: string | null;
  onSelectQuake: (id: string) => void;
}) {
  const data = useMemo<PointRow[]>(() => {
    return props.quakes.map((q) => ({
      id: q.id,
      mag: q.properties.mag,
      depthKm: q.geometry.coordinates[2],
      time: q.properties.time,
      place: q.properties.place,
    }));
  }, [props.quakes]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Depth vs magnitude</div>
        <div className="panelMeta">Click a point to select</div>
      </div>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 8, right: 12, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis
              type="number"
              dataKey="depthKm"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              label={{
                value: 'Depth (km)',
                position: 'insideBottom',
                offset: -6,
                fill: 'rgba(255,255,255,0.7)',
                fontSize: 11,
              }}
            />
            <YAxis
              type="number"
              dataKey="mag"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              width={34}
              label={{
                value: 'Mag',
                angle: -90,
                position: 'insideLeft',
                fill: 'rgba(255,255,255,0.7)',
                fontSize: 11,
              }}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
              contentStyle={{
                background: 'rgba(16, 25, 44, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
              }}
              labelFormatter={() => ''}
              formatter={(value, name) => {
                if (name === 'mag') return [`M ${Number(value).toFixed(1)}`, 'Mag'];
                if (name === 'depthKm') return [`${Number(value).toFixed(1)} km`, 'Depth'];
                return [String(value), String(name)];
              }}
            />
            <Scatter
              data={data}
              shape={(p) => <Dot {...p} selectedId={props.selectedId} />}
              onClick={(d) => {
                const row = (d as { payload?: PointRow }).payload;
                if (row?.id) props.onSelectQuake(row.id);
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

