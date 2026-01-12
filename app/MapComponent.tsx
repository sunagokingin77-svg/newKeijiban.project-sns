import React, { useEffect, useState } from 'react';

// 型定義
interface MapProps {
  posts?: any[];
  location?: [number, number][];
  setLocation?: (coords: [number, number]) => void;
  flyTarget?: [number, number] | null;
  okinawaCenter: [number, number];
}

export default function MapComponent({ posts = [], location = [], setLocation, flyTarget, okinawaCenter }: MapProps) {
  const [Components, setComponents] = useState<any>(null);

  useEffect(() => {
    // ブラウザ環境（windowがある時）のみライブラリを読み込む
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      require('leaflet/dist/leaflet.css');
      const ReactLeaflet = require('react-leaflet');

      // アイコンの修正
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      setComponents({ ...ReactLeaflet, L });
    }
  }, []);

  // 準備が整うまではグレーの背景を表示
  if (!Components) {
    return <div style={{ height: '100%', width: '100%', backgroundColor: '#f0f0f0' }} />;
  }

  const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = Components;

  // 地図の視点移動
  const FlyToHandler = ({ target }: { target: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
      if (target) map.flyTo(target, 13, { duration: 1.5 });
    }, [target]);
    return null;
  };

  // クリックイベント
  const MapEvents = ({ setLoc }: { setLoc?: (coords: [number, number]) => void }) => {
    const map = useMap();
    useEffect(() => {
      if (!setLoc) return;
      const onClick = (e: any) => setLoc([e.latlng.lat, e.latlng.lng]);
      map.on('click', onClick);
      return () => { map.off('click', onClick); };
    }, [setLoc]);
    return null;
  };

  return (
    <MapContainer center={okinawaCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FlyToHandler target={flyTarget} />
      <MapEvents setLoc={setLocation} />

      {/* 投稿データのピン表示 */}
      {posts.map((post) => {
        const routeCoords: [number, number][] = (post.locations || []).map((loc: any) => 
          Array.isArray(loc) ? loc : [loc.lat, loc.lng]
        );
        return (
          <React.Fragment key={post.id}>
            {routeCoords.length > 1 && (
              <Polyline positions={routeCoords} color="#007AFF" weight={3} opacity={0.6} dashArray="5, 10" />
            )}
            {routeCoords.map((coord, idx) => (
              <Marker key={`${post.id}-${idx}`} position={coord}>
                <Popup>
                  <strong>{post.locationNames?.[idx] || '地点'}</strong><br/>
                  {post.text?.substring(0, 15)}...
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        );
      })}

      {/* プレビュー表示 */}
      {location.length > 0 && (
        <>
          <Polyline positions={location} color="#FF9500" weight={4} />
          {location.map((coord, idx) => (
            <Marker key={`preview-${idx}`} position={coord} />
          ))}
        </>
      )}
    </MapContainer>
  );
}