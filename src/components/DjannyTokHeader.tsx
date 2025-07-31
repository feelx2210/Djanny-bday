import React from 'react';
import { Gift } from 'lucide-react';
export const DjannyTokHeader: React.FC = () => {
  return <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent">
      <div className="flex items-center justify-between px-4 py-3 pt-4">
        {/* Left side - empty for symmetry */}
        <div className="w-8" />
        
        {/* Center - App name */}
        <div className="flex items-center space-x-2">
          <Gift className="w-6 h-6 text-birthday-gold animate-pulse-glow" />
          <h1 className="text-white text-xl font-bold tracking-wider">
            DjannyTok
          </h1>
          <Gift className="w-6 h-6 text-birthday-gold animate-pulse-glow" />
        </div>
        
        {/* Right side - birthday badge */}
        <div className="bg-gradient-birthday rounded-full px-3 py-1">
          <span className="text-black text-xs font-bold">🎂 BDAY #70</span>
        </div>
      </div>
    </div>;
};