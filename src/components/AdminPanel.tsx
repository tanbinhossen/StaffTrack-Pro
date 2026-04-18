import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, LogOut, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapView({ locations, selectedUid }: { locations: any[], selectedUid: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedUid) {
      const selected = locations.find(l => l.uid === selectedUid);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 13);
      }
    }
  }, [selectedUid, locations, map]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker 
          key={loc.id} 
          position={[loc.latitude, loc.longitude]}
          eventHandlers={{
            click: () => {
              map.flyTo([loc.latitude, loc.longitude], 13);
            },
          }}
        >
          <Popup>
            <div className="p-2 min-w-[150px]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-orange-100 italic">
                  {loc.displayName?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-bold text-neutral-800 leading-tight">{loc.displayName || 'Anonymous User'}</p>
                  <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Active Now</p>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-medium">COORDINATES</p>
                <p className="text-xs font-mono text-neutral-600">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

const AdminPanel: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const { logOut } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'locations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locs);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-neutral-200 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-neutral-900 tracking-tight leading-none">LiveLoc</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-orange-600 mt-1">Admin Guard</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Live Units</p>
              <p className="text-2xl font-black text-neutral-900">{locations.length}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Tracked Personnel</p>
          {locations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-neutral-300 text-sm italic">No users active</p>
            </div>
          ) : (
            locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedUid(loc.uid)}
                className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center gap-4 ${
                  selectedUid === loc.uid 
                  ? 'bg-orange-50 border-orange-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-neutral-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  selectedUid === loc.uid ? 'bg-orange-500' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {loc.displayName?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-800 truncate leading-tight">{loc.displayName || 'Anonymous User'}</p>
                  <p className="text-[10px] text-neutral-400 truncate font-medium">
                    {new Date(loc.timestamp?.toDate ? loc.timestamp.toDate() : loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {selectedUid === loc.uid && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-neutral-100">
          <button 
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-neutral-500 hover:text-red-500 transition-colors font-bold text-sm bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-red-50 hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Access</span>
          </button>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative">
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
           <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-200 shadow-xl flex items-center gap-3">
              <Navigation className="w-4 h-4 text-blue-600 animate-pulse" />
              <p className="text-xs font-bold text-neutral-800 tracking-tight">Real-time Satellite Sync Active</p>
           </div>
        </div>

        <MapContainer center={[23.685, 90.3563]} zoom={7} className="h-full w-full">
          <MapView locations={locations} selectedUid={selectedUid} />
        </MapContainer>
      </main>
    </div>
  );
};

export default AdminPanel;
