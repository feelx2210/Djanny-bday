
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
  hasUserInteracted: boolean;
  hasEnabledSound: boolean;
  isGloballyMuted: boolean;
  markUserInteraction: () => void;
  enableSound: () => void;
  toggleGlobalMute: () => void;
  shouldAutoplayWithSound: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [hasEnabledSound, setHasEnabledSound] = useState(false);
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);

  const markUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      console.log('User interaction detected - enabling autoplay');
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

  const enableSound = useCallback(() => {
    if (!hasEnabledSound) {
      console.log('Sound enabled for entire session');
      setHasEnabledSound(true);
    }
    // Also mark user interaction for autoplay compliance
    markUserInteraction();
  }, [hasEnabledSound, markUserInteraction]);

  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
    console.log('Global mute toggled:', !isGloballyMuted);
    // Enabling sound when unmuting
    if (isGloballyMuted) {
      enableSound();
    }
  }, [isGloballyMuted, enableSound]);

  const shouldAutoplayWithSound = hasUserInteracted && hasEnabledSound && !isGloballyMuted;

  return (
    <AudioContext.Provider
      value={{
        hasUserInteracted,
        hasEnabledSound,
        isGloballyMuted,
        markUserInteraction,
        enableSound,
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
