export type RangeBin = {
  start: number;
  end: number;
  count: number;
  label: string;
};

function floorToStep(x: number, step: number): number {
  return Math.floor(x / step) * step;
}

function ceilToStep(x: number, step: number): number {
  return Math.ceil(x / step) * step;
}

function formatFixed(x: number, digits: number): string {
  return x.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

export function histogramEvenBins(
  values: number[],
  min: number,
  max: number,
  step: number,
  opts?: { labelDigits?: number },
): RangeBin[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (step <= 0) throw new Error(`Invalid bin step: ${step}`);
  if (max < min) return [];

  const start = floorToStep(min, step);
  const end = ceilToStep(max, step);
  const binCount = Math.max(1, Math.ceil((end - start) / step));
  const counts = new Array<number>(binCount).fill(0);

  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < start || v > end) continue;
    let idx = Math.floor((v - start) / step);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    counts[idx] += 1;
  }

  const digits = opts?.labelDigits ?? 1;
  const bins: RangeBin[] = [];
  for (let i = 0; i < binCount; i += 1) {
    const bStart = start + i * step;
    const bEnd = bStart + step;
    bins.push({
      start: bStart,
      end: bEnd,
      count: counts[i] ?? 0,
      label: `${formatFixed(bStart, digits)}-${formatFixed(bEnd, digits)}`,
    });
  }
  return bins;
}
