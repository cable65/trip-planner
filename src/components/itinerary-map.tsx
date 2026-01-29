"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

type Coordinate = {
  lat: number;
  lng: number;
  name: string;
};

export default function ItineraryMap({ coordinates }: { coordinates: Coordinate[] }) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  if (!coordinates || coordinates.length === 0) return null;

  // Calculate center
  const latSum = coordinates.reduce((sum, c) => sum + c.lat, 0);
  const lngSum = coordinates.reduce((sum, c) => sum + c.lng, 0);
  const center: [number, number] = [latSum / coordinates.length, lngSum / coordinates.length];

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-neutral-800 mt-4">
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coordinates.map((coord, idx) => (
          <Marker key={idx} position={[coord.lat, coord.lng]}>
            <Popup>{coord.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
