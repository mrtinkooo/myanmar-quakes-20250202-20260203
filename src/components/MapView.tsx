import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { CircleMarker, GeoJSON, MapContainer, Pane, Popup, TileLayer } from 'react-leaflet';
import type { Admin0FC, LineamentsFC, QuakeFeature } from '../data/types';
import { bboxFromFeatureCollection, bboxFromQuakes, boundsFromBbox, depthColor } from '../utils/geo';
import { formatUtcDateTime } from '../utils/time';

function magRadius(mag: number): number {
  // M3.0 ~ small, M7.5+ ~ large
  const r = 2 + (mag - 3) * 2;
  return Math.max(2, Math.min(14, r));
}

export default function MapView(props: {
  admin0: Admin0FC;
  lineaments: LineamentsFC;
  quakes: QuakeFeature[];
  selectedQuakeId: string | null;
  fitFilteredNonce: number;
  onSelectQuake: (id: string | null) => void;
}) {
  const mapRef = useRef<LeafletMap | null>(null);

  const adminBounds = useMemo(() => {
    const bbox = bboxFromFeatureCollection(props.admin0);
    return bbox ? boundsFromBbox(bbox) : null;
  }, [props.admin0]);

  useEffect(() => {
    if (!mapRef.current || !adminBounds) return;
    mapRef.current.fitBounds(adminBounds, { padding: [18, 18] });
  }, [adminBounds]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (props.fitFilteredNonce === 0) return;
    const bbox = bboxFromQuakes(props.quakes);
    if (!bbox) return;
    mapRef.current.fitBounds(boundsFromBbox(bbox), { padding: [22, 22] });
  }, [props.fitFilteredNonce, props.quakes]);

  return (
    <section className="panel panelFlush">
      <div className="panelHeader">
        <div className="panelTitle">Map</div>
        <div className="panelMeta">
          {props.quakes.length.toLocaleString()} filtered quakes | lineaments {props.lineaments.features.length.toLocaleString()}
        </div>
      </div>

      <div className="mapWrap">
        <MapContainer
          center={[21.2, 96.0]}
          zoom={5}
          minZoom={4}
          scrollWheelZoom
          preferCanvas
          whenReady={(e) => {
            mapRef.current = e.target;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Pane name="admin0" style={{ zIndex: 350 }}>
            <GeoJSON
              data={props.admin0 as unknown as GeoJSON.GeoJsonObject}
              style={() => ({
                color: 'rgba(255,255,255,0.65)',
                weight: 2,
                fillOpacity: 0,
              })}
            />
          </Pane>

          <Pane name="lineaments" style={{ zIndex: 360 }}>
            <GeoJSON
              data={props.lineaments as unknown as GeoJSON.GeoJsonObject}
              style={() => ({
                color: '#ffb703',
                weight: 1,
                opacity: 0.65,
              })}
            />
          </Pane>

          <Pane name="quakes" style={{ zIndex: 400 }}>
            {props.quakes.map((q) => {
              const [lon, lat, depthKm] = q.geometry.coordinates;
              const selected = q.id === props.selectedQuakeId;
              return (
                <CircleMarker
                  key={q.id}
                  center={[lat, lon]}
                  radius={magRadius(q.properties.mag)}
                  pathOptions={{
                    color: selected ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.35)',
                    weight: selected ? 3 : 1,
                    fillColor: depthColor(depthKm),
                    fillOpacity: selected ? 0.9 : 0.65,
                  }}
                  eventHandlers={{
                    click: () => props.onSelectQuake(q.id),
                  }}
                >
                  <Popup>
                    <div className="popupTitle">{q.properties.title}</div>
                    <div className="popupMeta">{formatUtcDateTime(q.properties.time)}</div>
                    <div className="popupMeta">
                      Depth: {depthKm.toFixed(1)} km | Mag: {q.properties.mag.toFixed(1)}
                    </div>
                    <div className="popupLink">
                      <a href={q.properties.url} target="_blank" rel="noreferrer">
                        USGS event page
                      </a>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </Pane>
        </MapContainer>
      </div>
    </section>
  );
}
