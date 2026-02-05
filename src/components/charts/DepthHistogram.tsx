import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Filters, QuakeFeature } from '../../data/types';
import { histogramEvenBins } from '../../utils/bins';

export default function DepthHistogram(props: {
  quakes: QuakeFeature[];
  extentsDepth: Filters['depthKm'];
  selectedDepth: Filters['depthKm'];
  onSetDepthRange: (min: number, max: number) => void;
}) {
  const data = useMemo(() => {
    const depths = props.quakes.map((q) => q.geometry.coordinates[2]);
    return histogramEvenBins(depths, props.extentsDepth.min, props.extentsDepth.max, 10, { labelDigits: 0 });
  }, [props.quakes, props.extentsDepth]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Depth histogram</div>
        <div className="panelMeta">Click a bin to set depth range</div>
      </div>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 10, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              interval={2}
              angle={-25}
              textAnchor="end"
              height={48}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              width={34}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(16, 25, 44, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
              }}
              itemStyle={{ color: 'rgba(255,255,255,0.9)' }}
              labelStyle={{ color: 'rgba(255,255,255,0.85)' }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 2, 2]}
              onClick={(d) => {
                const anyD = d as { start?: number; end?: number };
                if (typeof anyD.start !== 'number' || typeof anyD.end !== 'number') return;
                props.onSetDepthRange(anyD.start, anyD.end);
              }}
            >
              {data.map((b) => {
                const inSel = b.start >= props.selectedDepth.min && b.end <= props.selectedDepth.max;
                return <Cell key={b.label} fill={inSel ? 'rgba(33, 158, 188, 0.95)' : 'rgba(255,255,255,0.18)'} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
