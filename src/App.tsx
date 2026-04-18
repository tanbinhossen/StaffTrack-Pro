/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminPanel from './components/AdminPanel';
import UserPanel from './components/UserPanel';
import { LogIn, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-neutral-500 font-medium animate-pulse">Connecting to satellite...</p>
      </div>
    );
  }

  if (profile?.role === 'admin') {
    return <AdminPanel />;
  }

  return <UserPanel />;
}

function Login() {
  const { signIn } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6 bg-[url('https://picsum.photos/seed/map/1920/1080?blur=10')] bg-cover">
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-[3rem] p-12 shadow-2xl z-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
        
        <div className="w-16 h-16 bg-orange-50 p-4 rounded-2xl mb-8">
           <MapPin className="w-full h-full text-orange-500" />
        </div>

        <h1 className="text-4xl font-black text-neutral-900 tracking-tight leading-none mb-3">
          LiveLoc
        </h1>
        <p className="text-neutral-500 mb-10 font-medium">
          Real-time location sharing with military-grade privacy.
        </p>

        <button 
          onClick={signIn}
          className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors active:scale-95 shadow-xl"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-xs text-neutral-400 font-medium leading-relaxed">
          By continuing, you agree to our <span className="underline decoration-orange-500 underline-offset-4 decoration-2">Location Sharing Consent</span> policy.
        </p>
      </motion.div>
    </div>
  );
}

function Main() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-neutral-500 font-medium">Initializing secure bridge...</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
}
