"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapCustomer = {
  id: string;
  name: string;
  type: "GARAGE" | "FLEET";
  address: string | null;
  lat: number;
  lng: number;
};

type CustomerMapProps = {
  customers: MapCustomer[];
  selectedId: string | null;
  myPosition: { lat: number; lng: number } | null;
  onSelect: (customerId: string) => void;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009];

function customerIcon(selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:9999px;
      background:${selected ? "#0369a1" : "#0ea5e9"};
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function meIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:9999px;
      background:#16a34a;border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MapFocus({
  customers,
  selectedId,
  myPosition,
}: {
  customers: MapCustomer[];
  selectedId: string | null;
  myPosition: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const selected = customers.find((c) => c.id === selectedId);
    if (selected) {
      map.flyTo([selected.lat, selected.lng], 16, { duration: 0.6 });
      return;
    }
    if (myPosition) {
      map.setView([myPosition.lat, myPosition.lng], map.getZoom());
      return;
    }
    if (customers.length > 0) {
      const bounds = L.latLngBounds(
        customers.map((c) => [c.lat, c.lng] as [number, number]),
      );
      map.fitBounds(bounds.pad(0.2));
    }
  }, [customers, selectedId, myPosition, map]);

  return null;
}

export function CustomerMap({
  customers,
  selectedId,
  myPosition,
  onSelect,
  className,
}: CustomerMapProps) {
  const center: [number, number] =
    customers.length > 0
      ? [customers[0].lat, customers[0].lng]
      : myPosition
        ? [myPosition.lat, myPosition.lng]
        : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={13}
      className={className ?? "h-full min-h-[360px] w-full rounded-lg z-0"}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        subdomains={["mt0", "mt1", "mt2", "mt3"]}
        maxZoom={20}
      />
      <MapFocus
        customers={customers}
        selectedId={selectedId}
        myPosition={myPosition}
      />

      {customers.map((customer) => (
        <Marker
          key={customer.id}
          position={[customer.lat, customer.lng]}
          icon={customerIcon(customer.id === selectedId)}
          eventHandlers={{
            click: () => onSelect(customer.id),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{customer.name}</p>
              <p className="text-muted-foreground">{customer.type}</p>
              {customer.address ? <p>{customer.address}</p> : null}
            </div>
          </Popup>
        </Marker>
      ))}

      {myPosition ? (
        <>
          <Marker
            position={[myPosition.lat, myPosition.lng]}
            icon={meIcon()}
          >
            <Popup>Vị trí của bạn</Popup>
          </Marker>
          <CircleMarker
            center={[myPosition.lat, myPosition.lng]}
            radius={8}
            pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.25 }}
          />
        </>
      ) : null}
    </MapContainer>
  );
}
