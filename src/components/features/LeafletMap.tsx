"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Basic Leaflet map shell (fleet placeholder).
 * Prefer CustomerMap for sales check-in with markers.
 */
export function LeafletMap() {
  return (
    <MapContainer
      center={[10.7769, 106.7009]}
      zoom={12}
      className="z-0 h-64 w-full rounded-lg border border-border"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
