
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
  hasUserInteracted: boolean;
  isGloballyMuted: boolean;
  markUserInteraction: () => void;
  toggleGlobalMute: () => void;
  shouldAutoplayWithSound: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);

  const markUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      console.log('User interaction detected - enabling audio for all videos');
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
    console.log('Global mute toggled:', !isGloballyMuted);
  }, [isGloballyMuted]);

  const shouldAutoplayWithSound = hasUserInteracted && !isGloballyMuted;

  return (
    <AudioContext.Provider
      value={{
        hasUserInteracted,
        isGloballyMuted,
        markUserInteraction,
        toggleGlobalMute,
        shouldAutoplayWithSound
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
