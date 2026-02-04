const DAY_MS = 24 * 60 * 60 * 1000;
const SVG_NS = 'http://www.w3.org/2000/svg';

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

function utcDayStartMs(epochMs) {
  const d = new Date(epochMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function msToUtcDateInput(epochMs) {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function parseDateInputToUtcDayStartMs(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error(`Invalid date input: ${dateStr}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatUtcDate(epochMs) {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function formatUtcDateTime(epochMs) {
  const iso = new Date(epochMs).toISOString();
  return iso.replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
}

function depthColor(depthKm) {
  if (depthKm < 30) return '#2E8B57';
  if (depthKm < 70) return '#E6A100';
  return '#C0392B';
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function safeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeQuakes(fc) {
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    throw new Error('Invalid quakes.json (expected GeoJSON FeatureCollection)');
  }

  const out = [];
  for (const f of fc.features) {
    if (!f || typeof f !== 'object') continue;
    const id = typeof f.id === 'string' ? f.id : null;
    const props = f.properties || {};
    const geom = f.geometry || {};
    const coords = Array.isArray(geom.coordinates) ? geom.coordinates : null;

    if (!id || geom.type !== 'Point' || !coords || coords.length < 3) continue;
    const lon = coords[0];
    const lat = coords[1];
    const depthKm = coords[2];
    const mag = props.mag;
    const time = props.time;

    if (typeof lon !== 'number' || typeof lat !== 'number' || typeof depthKm !== 'number') continue;
    if (typeof mag !== 'number' || typeof time !== 'number') continue;

    out.push({
      id,
      lon,
      lat,
      depthKm,
      mag,
      time,
      place: typeof props.place === 'string' ? props.place : '',
      title: typeof props.title === 'string' ? props.title : `M ${mag.toFixed(1)}`,
      status: typeof props.status === 'string' ? props.status : '',
      url: typeof props.url === 'string' ? props.url : '',
    });
  }

  if (out.length === 0) throw new Error('No valid quake points found in quakes.json');
  return out;
}

function computeExtents(quakes) {
  let minTime = Infinity;
  let maxTime = -Infinity;
  let minMag = Infinity;
  let maxMag = -Infinity;
  let minDepth = Infinity;
  let maxDepth = -Infinity;

  for (const q of quakes) {
    minTime = Math.min(minTime, q.time);
    maxTime = Math.max(maxTime, q.time);
    minMag = Math.min(minMag, q.mag);
    maxMag = Math.max(maxMag, q.mag);
    minDepth = Math.min(minDepth, q.depthKm);
    maxDepth = Math.max(maxDepth, q.depthKm);
  }

  return { minTime, maxTime, minMag, maxMag, minDepth, maxDepth };
}

function filterQuakes(quakes, filters) {
  return quakes.filter((q) => {
    return (
      q.time >= filters.timeStartMs &&
      q.time <= filters.timeEndMs &&
      q.mag >= filters.magMin &&
      q.mag <= filters.magMax &&
      q.depthKm >= filters.depthMin &&
      q.depthKm <= filters.depthMax
    );
  });
}

function bboxFromQuakes(quakes) {
  let bbox = null;
  for (const q of quakes) {
    const lon = q.lon;
    const lat = q.lat;
    if (typeof lon !== 'number' || typeof lat !== 'number') continue;
    if (!bbox) bbox = [lon, lat, lon, lat];
    else {
      bbox[0] = Math.min(bbox[0], lon);
      bbox[1] = Math.min(bbox[1], lat);
      bbox[2] = Math.max(bbox[2], lon);
      bbox[3] = Math.max(bbox[3], lat);
    }
  }
  return bbox;
}

function bboxFromCoordsDeep(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const first = coords[0];
  if (typeof first === 'number') {
    const lon = coords[0];
    const lat = coords[1];
    if (typeof lon !== 'number' || typeof lat !== 'number') return null;
    return [lon, lat, lon, lat];
  }
  let bbox = null;
  for (const c of coords) {
    const b = bboxFromCoordsDeep(c);
    if (!b) continue;
    if (!bbox) bbox = b;
    else {
      bbox[0] = Math.min(bbox[0], b[0]);
      bbox[1] = Math.min(bbox[1], b[1]);
      bbox[2] = Math.max(bbox[2], b[2]);
      bbox[3] = Math.max(bbox[3], b[3]);
    }
  }
  return bbox;
}

function bboxFromFeatureCollection(fc) {
  if (!fc || typeof fc !== 'object' || !Array.isArray(fc.features)) return null;
  let bbox = null;
  for (const f of fc.features) {
    const b = bboxFromCoordsDeep(f?.geometry?.coordinates);
    if (!b) continue;
    if (!bbox) bbox = b;
    else {
      bbox[0] = Math.min(bbox[0], b[0]);
      bbox[1] = Math.min(bbox[1], b[1]);
      bbox[2] = Math.max(bbox[2], b[2]);
      bbox[3] = Math.max(bbox[3], b[3]);
    }
  }
  return bbox;
}

function makeSvg(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  }
  return el;
}

function clearSvg(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function floorToStep(x, step) {
  return Math.floor(x / step) * step;
}

function ceilToStep(x, step) {
  return Math.ceil(x / step) * step;
}

function formatFixed(x, digits) {
  return Number(x.toFixed(digits)).toString();
}

function histogramEvenBins(values, min, max, step, digits) {
  const start = floorToStep(min, step);
  const end = ceilToStep(max, step);
  const binCount = Math.max(1, Math.ceil((end - start) / step));
  const counts = new Array(binCount).fill(0);

  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < start || v > end) continue;
    let idx = Math.floor((v - start) / step);
    idx = clamp(idx, 0, binCount - 1);
    counts[idx] += 1;
  }

  const bins = [];
  for (let i = 0; i < binCount; i += 1) {
    const bStart = start + i * step;
    const bEnd = bStart + step;
    bins.push({
      start: bStart,
      end: bEnd,
      count: counts[i] || 0,
      label: `${formatFixed(bStart, digits)}-${formatFixed(bEnd, digits)}`,
    });
  }
  return bins;
}

function magRadiusPx(mag) {
  const r = 2 + (mag - 3) * 2;
  return clamp(r, 2, 14);
}

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function setInputValue(input, value) {
  const v = String(value);
  if (input.value !== v) input.value = v;
}

function buildLinePathFromLine(points, maxPoints) {
  const step = Math.max(1, Math.ceil(points.length / maxPoints));
  const parts = [];

  const takePoint = (p, cmd) => {
    if (!Array.isArray(p) || p.length < 2) return;
    const lon = p[0];
    const lat = p[1];
    if (typeof lon !== 'number' || typeof lat !== 'number') return;
    parts.push(`${cmd}${lon} ${-lat}`);
  };

  for (let i = 0; i < points.length; i += step) {
    takePoint(points[i], i === 0 ? 'M' : 'L');
  }
  // Ensure the final vertex is included for long lines.
  if ((points.length - 1) % step !== 0) takePoint(points[points.length - 1], 'L');
  return parts.join(' ');
}

function buildAdminPath(admin0FeatureCollection) {
  // MultiPolygon -> polygons -> rings -> positions
  if (!admin0FeatureCollection?.features?.[0]?.geometry?.coordinates) return '';
  const coords = admin0FeatureCollection.features[0].geometry.coordinates;

  const parts = [];
  const maxPointsPerRing = 1200;

  for (const polygon of coords) {
    for (const ring of polygon) {
      const step = Math.max(1, Math.ceil(ring.length / maxPointsPerRing));
      for (let i = 0; i < ring.length; i += step) {
        const p = ring[i];
        if (!Array.isArray(p) || p.length < 2) continue;
        const lon = p[0];
        const lat = p[1];
        if (typeof lon !== 'number' || typeof lat !== 'number') continue;
        parts.push(`${i === 0 ? 'M' : 'L'}${lon} ${-lat}`);
      }
      if ((ring.length - 1) % step !== 0) {
        const p = ring[ring.length - 1];
        if (Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number') {
          parts.push(`L${p[0]} ${-p[1]}`);
        }
      }
      parts.push('Z');
    }
  }

  return parts.join(' ');
}

function buildLineamentsPath(lineamentsFeatureCollection) {
  if (!lineamentsFeatureCollection || lineamentsFeatureCollection.type !== 'FeatureCollection') return '';
  const parts = [];
  for (const f of lineamentsFeatureCollection.features || []) {
    const geom = f.geometry || {};
    if (geom.type === 'LineString') {
      parts.push(buildLinePathFromLine(geom.coordinates || [], 800));
    } else if (geom.type === 'MultiLineString') {
      for (const line of geom.coordinates || []) {
        parts.push(buildLinePathFromLine(line || [], 800));
      }
    }
  }
  return parts.filter(Boolean).join(' ');
}

function viewBoxToString(vb) {
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
}

function fitViewBoxToBbox(bbox, padFrac) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const w = maxLon - minLon;
  const h = maxLat - minLat;
  const padX = w * padFrac;
  const padY = h * padFrac;
  return {
    x: minLon - padX,
    y: -(maxLat + padY),
    w: w + padX * 2,
    h: h + padY * 2,
  };
}

const loadingEl = $('loading');
const loadingMsg = $('loadingMsg');
const appEl = $('app');

const mapSvg = $('mapSvg');
const timeChart = $('timeChart');
const magChart = $('magChart');
const depthChart = $('depthChart');
const scatterChart = $('scatterChart');

const ui = {
  kpiFiltered: $('kpiFiltered'),
  kpiMaxMag: $('kpiMaxMag'),
  kpiTimeSpan: $('kpiTimeSpan'),
  filterCount: $('filterCount'),
  timeHint: $('timeHint'),
  magHint: $('magHint'),
  depthHint: $('depthHint'),
  startDate: $('startDate'),
  endDate: $('endDate'),
  magMin: $('magMin'),
  magMax: $('magMax'),
  magMinRange: $('magMinRange'),
  magMaxRange: $('magMaxRange'),
  depthMin: $('depthMin'),
  depthMax: $('depthMax'),
  depthMinRange: $('depthMinRange'),
  depthMaxRange: $('depthMaxRange'),
  resetBtn: $('resetBtn'),
  fitBtn: $('fitBtn'),
  clearSelectionBtn: $('clearSelectionBtn'),
  selectionMeta: $('selectionMeta'),
  selectionBody: $('selectionBody'),
  eventsCount: $('eventsCount'),
  eventsTbody: $('eventsTbody'),
  mapMeta: $('mapMeta'),
};

const state = {
  data: null,
  extents: null,
  filters: null,
  selectedId: null,
  viewBox: null,
  adminBbox: null,
  adminViewBox: null,
  dayStarts: null,
};

function setSelectedId(id) {
  state.selectedId = id;
  renderAll();
}

function setFilters(patch) {
  if (!state.extents || !state.filters) return;
  const e = state.extents;
  const f = { ...state.filters, ...patch };

  f.timeStartMs = clamp(f.timeStartMs, e.minTime, e.maxTime);
  f.timeEndMs = clamp(f.timeEndMs, e.minTime, e.maxTime);
  if (f.timeStartMs > f.timeEndMs) [f.timeStartMs, f.timeEndMs] = [f.timeEndMs, f.timeStartMs];

  f.magMin = clamp(f.magMin, e.minMag, e.maxMag);
  f.magMax = clamp(f.magMax, e.minMag, e.maxMag);
  if (f.magMin > f.magMax) [f.magMin, f.magMax] = [f.magMax, f.magMin];

  f.depthMin = clamp(f.depthMin, e.minDepth, e.maxDepth);
  f.depthMax = clamp(f.depthMax, e.minDepth, e.maxDepth);
  if (f.depthMin > f.depthMax) [f.depthMin, f.depthMax] = [f.depthMax, f.depthMin];

  state.filters = f;
  renderAll();
}

function resetFilters() {
  if (!state.extents) return;
  const e = state.extents;
  state.filters = {
    timeStartMs: e.minTime,
    timeEndMs: e.maxTime,
    magMin: e.minMag,
    magMax: e.maxMag,
    depthMin: e.minDepth,
    depthMax: e.maxDepth,
  };
  state.selectedId = null;
  renderAll();
}

function applyViewBox() {
  if (!state.viewBox) return;
  mapSvg.setAttribute('viewBox', viewBoxToString(state.viewBox));
  updateMarkerRadii();
}

function updateMarkerRadii() {
  if (!state.viewBox) return;
  const rect = mapSvg.getBoundingClientRect();
  if (rect.width <= 0) return;
  const unitsPerPx = state.viewBox.w / rect.width;
  for (const c of mapSvg.querySelectorAll('circle[data-id]')) {
    const mag = safeNumber(c.getAttribute('data-mag'), 3);
    c.setAttribute('r', String(magRadiusPx(mag) * unitsPerPx));
  }
}

function fitMapToFiltered(filtered) {
  const bbox = bboxFromQuakes(filtered) || state.adminBbox;
  if (!bbox) return;
  state.viewBox = fitViewBoxToBbox(bbox, 0.12);
  applyViewBox();
}

function renderSelection(allQuakesById) {
  const selectedId = state.selectedId;
  if (!selectedId) {
    ui.clearSelectionBtn.style.display = 'none';
    ui.selectionMeta.style.display = '';
    setText(ui.selectionMeta, 'None');
    ui.selectionBody.className = 'emptyState';
    ui.selectionBody.textContent = 'Click a quake marker or a chart point to see details.';
    return;
  }

  const q = allQuakesById.get(selectedId);
  if (!q) return;

  ui.clearSelectionBtn.style.display = '';
  ui.selectionMeta.style.display = 'none';
  ui.selectionBody.className = 'details';
  ui.selectionBody.innerHTML = `
    <div class="kpiRow">
      <div class="kpi">
        <div class="kpiLabel">Magnitude</div>
        <div class="kpiValue">M ${q.mag.toFixed(1)}</div>
      </div>
      <div class="kpi">
        <div class="kpiLabel">Depth</div>
        <div class="kpiValue">${q.depthKm.toFixed(1)} km</div>
      </div>
    </div>
    <div class="kv">
      <div class="kvKey">Time (UTC)</div>
      <div class="kvVal">${formatUtcDateTime(q.time)}</div>
    </div>
    <div class="kv">
      <div class="kvKey">Place</div>
      <div class="kvVal">${q.place || ''}</div>
    </div>
    <div class="kv">
      <div class="kvKey">Status</div>
      <div class="kvVal">${q.status || ''}</div>
    </div>
    <div class="kv">
      <div class="kvKey">USGS</div>
      <div class="kvVal">${q.url ? `<a href="${q.url}" target="_blank" rel="noreferrer">Open event page</a>` : ''}</div>
    </div>
  `;
}

function renderEventsTable(filtered) {
  setText(ui.eventsCount, filtered.length.toLocaleString());

  const rows = [...filtered].sort((a, b) => b.time - a.time);
  const frag = document.createDocumentFragment();
  for (const q of rows) {
    const tr = document.createElement('tr');
    if (q.id === state.selectedId) tr.className = 'rowSelected';
    tr.title = q.place || '';
    tr.addEventListener('click', () => setSelectedId(q.id));

    const tdTime = document.createElement('td');
    tdTime.className = 'mono';
    tdTime.textContent = formatUtcDateTime(q.time);
    const tdMag = document.createElement('td');
    tdMag.className = 'mono';
    tdMag.textContent = q.mag.toFixed(1);
    const tdDepth = document.createElement('td');
    tdDepth.className = 'mono';
    tdDepth.textContent = q.depthKm.toFixed(1);

    tr.appendChild(tdTime);
    tr.appendChild(tdMag);
    tr.appendChild(tdDepth);
    frag.appendChild(tr);
  }

  ui.eventsTbody.replaceChildren(frag);
}

function renderMapMarkers(filtered) {
  const layer = mapSvg.querySelector('#quakesLayer');
  if (!layer) return;
  while (layer.firstChild) layer.removeChild(layer.firstChild);

  const frag = document.createDocumentFragment();
  for (const q of filtered) {
    const selected = q.id === state.selectedId;
    const c = makeSvg('circle', {
      cx: q.lon,
      cy: -q.lat,
      r: 1,
      fill: depthColor(q.depthKm),
      'fill-opacity': selected ? 0.9 : 0.65,
      stroke: selected ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.35)',
      'stroke-width': selected ? 2.8 : 1.2,
      'vector-effect': 'non-scaling-stroke',
      cursor: 'pointer',
      'data-id': q.id,
      'data-mag': q.mag,
    });
    c.addEventListener('click', (e) => {
      e.stopPropagation();
      setSelectedId(q.id);
    });
    frag.appendChild(c);
  }

  layer.appendChild(frag);
  updateMarkerRadii();
}

const timeBrush = {
  installed: false,
  brushing: false,
  startIdx: 0,
  meta: null,
};

function installTimeBrushHandlers() {
  if (timeBrush.installed) return;
  timeBrush.installed = true;

  const xToIndex = (clientX) => {
    const m = timeBrush.meta;
    if (!m) return null;
    const { svg, pad, plotW, barW, data } = m;
    const rct = svg.getBoundingClientRect();
    const xPx = clientX - rct.left;
    if (xPx < pad.l || xPx > pad.l + plotW) return null;
    const idx = Math.floor((xPx - pad.l) / barW);
    return clamp(idx, 0, data.length - 1);
  };

  timeChart.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const idx = xToIndex(e.clientX);
    if (idx == null) return;
    e.preventDefault();
    timeBrush.brushing = true;
    timeBrush.startIdx = idx;
    const m = timeBrush.meta;
    const day = m?.data?.[idx]?.dayMs;
    if (typeof day === 'number') setFilters({ timeStartMs: day, timeEndMs: day + DAY_MS - 1 });
  });

  window.addEventListener('mousemove', (e) => {
    if (!timeBrush.brushing) return;
    const idx = xToIndex(e.clientX);
    if (idx == null) return;
    const a = Math.min(timeBrush.startIdx, idx);
    const b = Math.max(timeBrush.startIdx, idx);
    const m = timeBrush.meta;
    const start = m?.data?.[a]?.dayMs;
    const end = m?.data?.[b]?.dayMs;
    if (typeof start !== 'number' || typeof end !== 'number') return;
    setFilters({ timeStartMs: start, timeEndMs: end + DAY_MS - 1 });
  });

  window.addEventListener('mouseup', () => {
    timeBrush.brushing = false;
  });
}

function renderTimeChart(quakesForTime) {
  const svg = timeChart;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 600));
  const height = Math.max(220, Math.floor(rect.height || 240));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  clearSvg(svg);

  const pad = { l: 44, r: 10, t: 10, b: 32 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const days = state.dayStarts || [];
  const startDay = days[0] ?? 0;

  const counts = new Map();
  for (const q of quakesForTime) {
    const d = utcDayStartMs(q.time);
    counts.set(d, (counts.get(d) || 0) + 1);
  }

  const data = days.map((d) => ({ dayMs: d, count: counts.get(d) || 0 }));
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const barW = data.length ? plotW / data.length : plotW;

  // Axes
  svg.appendChild(
    makeSvg('line', {
      x1: pad.l,
      y1: pad.t + plotH,
      x2: pad.l + plotW,
      y2: pad.t + plotH,
      stroke: 'rgba(255,255,255,0.12)',
    }),
  );
  svg.appendChild(
    makeSvg('line', {
      x1: pad.l,
      y1: pad.t,
      x2: pad.l,
      y2: pad.t + plotH,
      stroke: 'rgba(255,255,255,0.12)',
    }),
  );

  // Bars
  const barsG = makeSvg('g');
  for (let i = 0; i < data.length; i += 1) {
    const d = data[i];
    const h = (d.count / maxCount) * plotH;
    const x = pad.l + i * barW;
    const y = pad.t + plotH - h;
    const r = makeSvg('rect', {
      x,
      y,
      width: Math.max(0.5, barW - 0.5),
      height: h,
      fill: 'rgba(33, 158, 188, 0.95)',
      rx: 2,
      ry: 2,
    });
    r.addEventListener('click', (e) => {
      e.stopPropagation();
      setFilters({ timeStartMs: d.dayMs, timeEndMs: d.dayMs + DAY_MS - 1 });
    });
    barsG.appendChild(r);
  }
  svg.appendChild(barsG);

  // Selection overlay
  if (state.filters) {
    const selStartDay = utcDayStartMs(state.filters.timeStartMs);
    const selEndDay = utcDayStartMs(state.filters.timeEndMs);
    const selStartIdx = clamp(Math.floor((selStartDay - startDay) / DAY_MS), 0, data.length - 1);
    const selEndIdx = clamp(Math.floor((selEndDay - startDay) / DAY_MS), 0, data.length - 1);
    const si = Math.min(selStartIdx, selEndIdx);
    const ei = Math.max(selStartIdx, selEndIdx);
    svg.appendChild(
      makeSvg('rect', {
        x: pad.l + si * barW,
        y: pad.t,
        width: (ei - si + 1) * barW,
        height: plotH,
        fill: 'rgba(255, 183, 3, 0.12)',
        stroke: 'rgba(255, 183, 3, 0.45)',
        'stroke-width': 1,
        'pointer-events': 'none',
      }),
    );
  }

  // X labels (few ticks)
  const tickCount = 6;
  for (let t = 0; t < tickCount; t += 1) {
    if (!data.length) break;
    const idx = Math.round((t * (data.length - 1)) / (tickCount - 1));
    const dayMs = data[idx]?.dayMs;
    if (typeof dayMs !== 'number') continue;
    const x = pad.l + idx * barW + barW / 2;
    const label = formatUtcDate(dayMs).slice(0, 7);
    const text = makeSvg('text', {
      x,
      y: pad.t + plotH + 20,
      fill: 'rgba(255,255,255,0.65)',
      'font-size': 11,
      'text-anchor': 'middle',
    });
    text.textContent = label;
    svg.appendChild(text);
  }

  // Y labels (0 and max)
  const y0 = makeSvg('text', {
    x: pad.l - 8,
    y: pad.t + plotH,
    fill: 'rgba(255,255,255,0.65)',
    'font-size': 11,
    'text-anchor': 'end',
    'dominant-baseline': 'central',
  });
  y0.textContent = '0';
  svg.appendChild(y0);
  const yMax = makeSvg('text', {
    x: pad.l - 8,
    y: pad.t,
    fill: 'rgba(255,255,255,0.65)',
    'font-size': 11,
    'text-anchor': 'end',
    'dominant-baseline': 'central',
  });
  yMax.textContent = String(maxCount);
  svg.appendChild(yMax);

  // Update shared brush meta (handlers are installed once).
  timeBrush.meta = { svg, pad, plotW, barW, data };
  installTimeBrushHandlers();
}

function renderHistogram(svg, values, extentMin, extentMax, step, digits, selectedMin, selectedMax, onClickBin) {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 600));
  const height = Math.max(220, Math.floor(rect.height || 240));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  clearSvg(svg);

  const pad = { l: 44, r: 10, t: 10, b: 44 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const bins = histogramEvenBins(values, extentMin, extentMax, step, digits);
  const maxCount = Math.max(1, ...bins.map((b) => b.count));
  const barW = bins.length ? plotW / bins.length : plotW;

  svg.appendChild(
    makeSvg('line', {
      x1: pad.l,
      y1: pad.t + plotH,
      x2: pad.l + plotW,
      y2: pad.t + plotH,
      stroke: 'rgba(255,255,255,0.12)',
    }),
  );
  svg.appendChild(
    makeSvg('line', {
      x1: pad.l,
      y1: pad.t,
      x2: pad.l,
      y2: pad.t + plotH,
      stroke: 'rgba(255,255,255,0.12)',
    }),
  );

  const barsG = makeSvg('g');
  for (let i = 0; i < bins.length; i += 1) {
    const b = bins[i];
    const h = (b.count / maxCount) * plotH;
    const x = pad.l + i * barW;
    const y = pad.t + plotH - h;
    const inSel = b.start >= selectedMin && b.end <= selectedMax;
    const r = makeSvg('rect', {
      x,
      y,
      width: Math.max(0.5, barW - 0.5),
      height: h,
      fill: inSel ? 'rgba(255, 183, 3, 0.95)' : 'rgba(255,255,255,0.18)',
      rx: 2,
      ry: 2,
      cursor: 'pointer',
    });
    r.addEventListener('click', (e) => {
      e.stopPropagation();
      onClickBin(b);
    });
    barsG.appendChild(r);

    if (i % Math.max(1, Math.round(bins.length / 8)) === 0 || i === bins.length - 1) {
      const label = makeSvg('text', {
        x: x + barW / 2,
        y: pad.t + plotH + 22,
        fill: 'rgba(255,255,255,0.65)',
        'font-size': 10,
        'text-anchor': 'middle',
        transform: `rotate(-25 ${x + barW / 2} ${pad.t + plotH + 22})`,
      });
      label.textContent = b.label;
      svg.appendChild(label);
    }
  }
  svg.appendChild(barsG);

  const y0 = makeSvg('text', {
    x: pad.l - 8,
    y: pad.t + plotH,
    fill: 'rgba(255,255,255,0.65)',
    'font-size': 11,
    'text-anchor': 'end',
    'dominant-baseline': 'central',
  });
  y0.textContent = '0';
  svg.appendChild(y0);

  const yMax = makeSvg('text', {
    x: pad.l - 8,
    y: pad.t,
    fill: 'rgba(255,255,255,0.65)',
    'font-size': 11,
    'text-anchor': 'end',
    'dominant-baseline': 'central',
  });
  yMax.textContent = String(maxCount);
  svg.appendChild(yMax);
}

function renderScatter(svg, points) {
  if (!state.extents) return;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || 600));
  const height = Math.max(220, Math.floor(rect.height || 240));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  clearSvg(svg);

  const pad = { l: 44, r: 16, t: 10, b: 32 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const xMin = state.extents.minDepth;
  const xMax = state.extents.maxDepth;
  const yMin = state.extents.minMag;
  const yMax = state.extents.maxMag;

  const xScale = (d) => pad.l + ((d - xMin) / (xMax - xMin || 1)) * plotW;
  const yScale = (m) => pad.t + plotH - ((m - yMin) / (yMax - yMin || 1)) * plotH;

  svg.appendChild(
    makeSvg('line', {
      x1: pad.l,
      y1: pad.t + plotH,
      x2: pad.l + plotW,
      y2: pad.t + plotH,
      stroke: 'rgba(255,255,255,0.12)',
    }),
  );
  svg.appendChild(
    makeSvg('line', {
      x1: pad.l,
      y1: pad.t,
      x2: pad.l,
      y2: pad.t + plotH,
      stroke: 'rgba(255,255,255,0.12)',
    }),
  );

  const xLabel = makeSvg('text', {
    x: pad.l + plotW / 2,
    y: pad.t + plotH + 24,
    fill: 'rgba(255,255,255,0.65)',
    'font-size': 11,
    'text-anchor': 'middle',
  });
  xLabel.textContent = 'Depth (km)';
  svg.appendChild(xLabel);

  const yLabel = makeSvg('text', {
    x: 14,
    y: pad.t + plotH / 2,
    fill: 'rgba(255,255,255,0.65)',
    'font-size': 11,
    'text-anchor': 'middle',
    transform: `rotate(-90 14 ${pad.t + plotH / 2})`,
  });
  yLabel.textContent = 'Mag';
  svg.appendChild(yLabel);

  const g = makeSvg('g');
  for (const q of points) {
    const selected = q.id === state.selectedId;
    const c = makeSvg('circle', {
      cx: xScale(q.depthKm),
      cy: yScale(q.mag),
      r: selected ? 6 : 3.5,
      fill: depthColor(q.depthKm),
      stroke: selected ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.25)',
      'stroke-width': selected ? 2.5 : 1,
      opacity: selected ? 0.95 : 0.8,
      cursor: 'pointer',
    });
    c.addEventListener('click', (e) => {
      e.stopPropagation();
      setSelectedId(q.id);
    });
    g.appendChild(c);
  }
  svg.appendChild(g);
}

function renderAll() {
  if (!state.data || !state.extents || !state.filters) return;
  const { quakes, lineaments } = state.data;
  const e = state.extents;
  const f = state.filters;

  const allById = new Map(quakes.map((q) => [q.id, q]));

  const filteredAll = filterQuakes(quakes, f);
  const filteredForTime = filterQuakes(quakes, { ...f, timeStartMs: e.minTime, timeEndMs: e.maxTime });
  const filteredForMag = filterQuakes(quakes, { ...f, magMin: e.minMag, magMax: e.maxMag });
  const filteredForDepth = filterQuakes(quakes, { ...f, depthMin: e.minDepth, depthMax: e.maxDepth });

  // KPIs
  setText(ui.kpiFiltered, filteredAll.length.toLocaleString());
  const maxMag = filteredAll.length ? Math.max(...filteredAll.map((q) => q.mag)) : null;
  setText(ui.kpiMaxMag, maxMag == null ? 'N/A' : maxMag.toFixed(1));
  if (filteredAll.length) {
    const minT = Math.min(...filteredAll.map((q) => q.time));
    const maxT = Math.max(...filteredAll.map((q) => q.time));
    setText(ui.kpiTimeSpan, `${formatUtcDate(minT)}-${formatUtcDate(maxT)}`);
  } else {
    setText(ui.kpiTimeSpan, 'N/A');
  }

  // Filter panel
  setText(ui.filterCount, `${filteredAll.length.toLocaleString()} / ${quakes.length.toLocaleString()}`);
  setText(ui.timeHint, `${formatUtcDate(e.minTime)}-${formatUtcDate(e.maxTime)}`);
  setText(ui.magHint, `${f.magMin.toFixed(1)}-${f.magMax.toFixed(1)}`);
  setText(ui.depthHint, `${f.depthMin.toFixed(0)}-${f.depthMax.toFixed(0)}`);

  setInputValue(ui.startDate, msToUtcDateInput(f.timeStartMs));
  setInputValue(ui.endDate, msToUtcDateInput(f.timeEndMs));
  setInputValue(ui.magMin, f.magMin);
  setInputValue(ui.magMax, f.magMax);
  setInputValue(ui.magMinRange, f.magMin);
  setInputValue(ui.magMaxRange, f.magMax);
  setInputValue(ui.depthMin, f.depthMin);
  setInputValue(ui.depthMax, f.depthMax);
  setInputValue(ui.depthMinRange, f.depthMin);
  setInputValue(ui.depthMaxRange, f.depthMax);

  // Details + events
  renderSelection(allById);
  renderEventsTable(filteredAll);

  // Map
  setText(
    ui.mapMeta,
    `${filteredAll.length.toLocaleString()} filtered quakes, ${lineaments.features.length.toLocaleString()} lineaments`,
  );
  renderMapMarkers(filteredAll);

  // Charts
  renderTimeChart(filteredForTime);
  renderHistogram(
    magChart,
    filteredForMag.map((q) => q.mag),
    e.minMag,
    e.maxMag,
    0.5,
    1,
    f.magMin,
    f.magMax,
    (b) => setFilters({ magMin: b.start, magMax: b.end }),
  );
  renderHistogram(
    depthChart,
    filteredForDepth.map((q) => q.depthKm),
    e.minDepth,
    e.maxDepth,
    10,
    0,
    f.depthMin,
    f.depthMax,
    (b) => setFilters({ depthMin: b.start, depthMax: b.end }),
  );
  renderScatter(scatterChart, filteredAll);
}

function setupMapLayers() {
  clearSvg(mapSvg);

  const adminPath = makeSvg('path', {
    id: 'admin0Path',
    fill: 'none',
    stroke: 'rgba(255,255,255,0.65)',
    'stroke-width': 2,
    'vector-effect': 'non-scaling-stroke',
  });
  const lineamentsPath = makeSvg('path', {
    id: 'lineamentsPath',
    fill: 'none',
    stroke: 'rgba(255, 183, 3, 0.65)',
    'stroke-width': 1,
    'vector-effect': 'non-scaling-stroke',
  });
  const quakesLayer = makeSvg('g', { id: 'quakesLayer' });

  mapSvg.appendChild(adminPath);
  mapSvg.appendChild(lineamentsPath);
  mapSvg.appendChild(quakesLayer);

  mapSvg.addEventListener('click', () => setSelectedId(null));

  // Pan/zoom controls using SVG viewBox.
  let dragging = false;
  let dragStart = null;

  mapSvg.addEventListener(
    'wheel',
    (e) => {
      if (!state.viewBox || !state.adminViewBox) return;
      e.preventDefault();
      const rect = mapSvg.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      const cursorX = state.viewBox.x + px * state.viewBox.w;
      const cursorY = state.viewBox.y + py * state.viewBox.h;

      const zoomFactor = Math.exp(e.deltaY * 0.0014);
      const newW = clamp(state.viewBox.w * zoomFactor, 0.4, state.adminViewBox.w * 3);
      const newH = clamp(state.viewBox.h * zoomFactor, 0.6, state.adminViewBox.h * 3);

      state.viewBox = {
        x: cursorX - px * newW,
        y: cursorY - py * newH,
        w: newW,
        h: newH,
      };
      applyViewBox();
    },
    { passive: false },
  );

  mapSvg.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !state.viewBox) return;
    dragging = true;
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      vbX: state.viewBox.x,
      vbY: state.viewBox.y,
    };
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging || !dragStart || !state.viewBox) return;
    const rect = mapSvg.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * state.viewBox.w;
    const dy = ((e.clientY - dragStart.y) / rect.height) * state.viewBox.h;
    state.viewBox.x = dragStart.vbX - dx;
    state.viewBox.y = dragStart.vbY - dy;
    applyViewBox();
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
    dragStart = null;
  });
}

function setupUiEvents() {
  ui.startDate.addEventListener('change', () => {
    if (!state.filters) return;
    const start = parseDateInputToUtcDayStartMs(ui.startDate.value);
    let end = state.filters.timeEndMs;
    if (start > end) end = start + DAY_MS - 1;
    setFilters({ timeStartMs: start, timeEndMs: end });
  });

  ui.endDate.addEventListener('change', () => {
    if (!state.filters) return;
    const endStart = parseDateInputToUtcDayStartMs(ui.endDate.value);
    const end = endStart + DAY_MS - 1;
    let start = state.filters.timeStartMs;
    if (end < start) start = endStart;
    setFilters({ timeStartMs: start, timeEndMs: end });
  });

  ui.magMin.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ magMin: safeNumber(ui.magMin.value, state.filters.magMin) });
  });
  ui.magMax.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ magMax: safeNumber(ui.magMax.value, state.filters.magMax) });
  });
  ui.magMinRange.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ magMin: safeNumber(ui.magMinRange.value, state.filters.magMin) });
  });
  ui.magMaxRange.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ magMax: safeNumber(ui.magMaxRange.value, state.filters.magMax) });
  });

  ui.depthMin.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ depthMin: safeNumber(ui.depthMin.value, state.filters.depthMin) });
  });
  ui.depthMax.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ depthMax: safeNumber(ui.depthMax.value, state.filters.depthMax) });
  });
  ui.depthMinRange.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ depthMin: safeNumber(ui.depthMinRange.value, state.filters.depthMin) });
  });
  ui.depthMaxRange.addEventListener('input', () => {
    if (!state.filters) return;
    setFilters({ depthMax: safeNumber(ui.depthMaxRange.value, state.filters.depthMax) });
  });

  ui.resetBtn.addEventListener('click', () => resetFilters());
  ui.fitBtn.addEventListener('click', () => {
    if (!state.data || !state.filters) return;
    fitMapToFiltered(filterQuakes(state.data.quakes, state.filters));
  });
  ui.clearSelectionBtn.addEventListener('click', () => setSelectedId(null));
}

async function loadData() {
  try {
    setText(loadingMsg, 'Loading quakes and lineaments...');

    const [quakesFc, lineaments, admin0] = await Promise.all([
      fetch('/quakes.json').then((r) => r.json()),
      fetch('/Myanmar_Tectonic_Map_2011.geojson').then((r) => r.json()),
      fetch('/admin0.json').then((r) => r.json()),
    ]);

    const quakes = normalizeQuakes(quakesFc);
    const extents = computeExtents(quakes);

    const adminBbox = bboxFromFeatureCollection(admin0);
    if (!adminBbox) throw new Error('Failed to compute bbox from admin0.json');

    const startDay = utcDayStartMs(extents.minTime);
    const endDay = utcDayStartMs(extents.maxTime);
    const dayStarts = [];
    for (let d = startDay; d <= endDay; d += DAY_MS) dayStarts.push(d);

    state.data = { quakes, lineaments, admin0 };
    state.extents = extents;
    state.filters = {
      timeStartMs: extents.minTime,
      timeEndMs: extents.maxTime,
      magMin: extents.minMag,
      magMax: extents.maxMag,
      depthMin: extents.minDepth,
      depthMax: extents.maxDepth,
    };
    state.selectedId = null;
    state.adminBbox = adminBbox;
    state.dayStarts = dayStarts;

    // Input constraints
    ui.startDate.min = msToUtcDateInput(extents.minTime);
    ui.startDate.max = msToUtcDateInput(extents.maxTime);
    ui.endDate.min = msToUtcDateInput(extents.minTime);
    ui.endDate.max = msToUtcDateInput(extents.maxTime);

    ui.magMin.min = String(extents.minMag);
    ui.magMin.max = String(extents.maxMag);
    ui.magMax.min = String(extents.minMag);
    ui.magMax.max = String(extents.maxMag);
    ui.magMinRange.min = String(extents.minMag);
    ui.magMinRange.max = String(extents.maxMag);
    ui.magMaxRange.min = String(extents.minMag);
    ui.magMaxRange.max = String(extents.maxMag);

    ui.depthMin.min = String(extents.minDepth);
    ui.depthMin.max = String(extents.maxDepth);
    ui.depthMax.min = String(extents.minDepth);
    ui.depthMax.max = String(extents.maxDepth);
    ui.depthMinRange.min = String(extents.minDepth);
    ui.depthMinRange.max = String(extents.maxDepth);
    ui.depthMaxRange.min = String(extents.minDepth);
    ui.depthMaxRange.max = String(extents.maxDepth);

    // Map init view and static paths
    state.adminViewBox = fitViewBoxToBbox(adminBbox, 0.06);
    state.viewBox = { ...state.adminViewBox };

    setupMapLayers();
    $('admin0Path').setAttribute('d', buildAdminPath(admin0));
    $('lineamentsPath').setAttribute('d', buildLineamentsPath(lineaments));
    applyViewBox();

    // Show app
    loadingEl.style.display = 'none';
    appEl.style.display = '';

    requestAnimationFrame(() => renderAll());
    window.addEventListener('resize', () => {
      updateMarkerRadii();
      renderAll();
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setText(loadingMsg, `Error: ${msg}`);
  }
}

setupUiEvents();
loadData();
