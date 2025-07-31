import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useVideoLoader } from '../hooks/useVideoLoader';
import { useVideoPreloader } from '../hooks/useVideoPreloader';
import { useAudio } from '../contexts/AudioContext';
import { RefreshCw, AlertCircle, Gift, Volume2, VolumeX } from 'lucide-react';

export const DjannyTokFeed: React.FC = () => {
  const { videos, loading, error, refreshVideos } = useVideoLoader();
  const { preloadVideos, getPreloadedVideo, preloadProgress } = useVideoPreloader();
  const { hasUserInteracted, hasEnabledSound, shouldAutoplayWithSound, enableSound } = useAudio();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);

  // TikTok-style preloading: preload next 2-3 videos
  useEffect(() => {
    if (videos.length === 0) return;

    const preloadNext = () => {
      const urlsToPreload: string[] = [];
      
      // Preload next 2 videos
      for (let i = 1; i <= 2; i++) {
        const nextIndex = (currentVideoIndex + i) % videos.length;
        urlsToPreload.push(videos[nextIndex].videoUrl);
      }
      
      // Also preload previous video for smooth backward navigation
      const prevIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
      if (!urlsToPreload.includes(videos[prevIndex].videoUrl)) {
        urlsToPreload.push(videos[prevIndex].videoUrl);
      }

      preloadVideos(urlsToPreload);
    };

    // Delay preloading slightly to not interfere with current video
    const timeout = setTimeout(preloadNext, 500);
    return () => clearTimeout(timeout);
  }, [currentVideoIndex, videos, preloadVideos]);

  // Swipe navigation with sound enablement
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Check if touch is on an interactive element
      const target = e.target as HTMLElement;
      if (target && (target.closest('button') || target.closest('[onclick]'))) {
        return; // Don't handle navigation for button touches
      }
      
      e.preventDefault();
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Check if touch is on an interactive element
      const target = e.target as HTMLElement;
      if (target && (target.closest('button') || target.closest('[onclick]'))) {
        return; // Don't handle navigation for button touches
      }
      
      e.preventDefault();
      if (isScrolling || videos.length === 0) return;
      
      enableSound(); // Enable sound for entire session on any swipe
      
      touchEndY = e.changedTouches[0].screenY;
      const deltaY = touchStartY - touchEndY;
      
      if (Math.abs(deltaY) > 50) {
        setIsScrolling(true);
        
        if (deltaY > 0) {
          setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        } else {
          setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
        }
        
        setTimeout(() => setIsScrolling(false), 300);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling || videos.length === 0) return;
      
      e.preventDefault();
      enableSound(); // Enable sound for entire session on scroll
      setIsScrolling(true);
      
      if (e.deltaY > 0) {
        setCurrentVideoIndex(prev => (prev + 1) % videos.length);
      } else {
        setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
      }
      
      setTimeout(() => setIsScrolling(false), 300);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [currentVideoIndex, isScrolling, videos.length, enableSound]);

  // Keyboard navigation with sound enablement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling || videos.length === 0) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        enableSound(); // Enable sound for entire session on keyboard navigation
        setIsScrolling(true);
        
        if (e.key === 'ArrowDown') {
          setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        } else {
          setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
        }
        
        setTimeout(() => setIsScrolling(false), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, isScrolling, videos.length, enableSound]);

  // Pull-to-refresh detection
  useEffect(() => {
    let startY = 0;
    let isAtTop = true;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isAtTop = window.scrollY === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 100) {
        setShowRefreshHint(true);
      }
    };

    const handleTouchEnd = () => {
      if (showRefreshHint) {
        refreshVideos();
        setShowRefreshHint(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showRefreshHint, refreshVideos]);

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading birthday videos...</p>
          <p className="text-sm opacity-75 mt-2">Optimizing for smooth playback</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && videos.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white px-6">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Videos</h2>
          <p className="text-sm opacity-75 mb-6">{error}</p>
          <button
            onClick={refreshVideos}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No videos state
  if (videos.length === 0) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white px-6">
          <Gift className="w-16 h-16 text-birthday-gold mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Birthday Videos Yet</h2>
          <p className="text-sm opacity-75 mb-6">Videos will appear here once they're uploaded</p>
          <button
            onClick={refreshVideos}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Check for Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black touch-none">
      {/* Pull-to-refresh hint */}
      {showRefreshHint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2">
          <p className="text-white text-sm flex items-center">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Release to refresh
          </p>
        </div>
      )}

      {/* First-time sound hint */}
      {!hasEnabledSound && currentVideoIndex === 0 && videos.length > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 animate-fade-in">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3">
            <p className="text-white text-sm flex items-center">
              <VolumeX className="w-4 h-4 mr-2" />
              Tap anywhere for sound
            </p>
          </div>
        </div>
      )}


      {/* Video container with faster transitions */}
      <div 
        className="flex flex-col transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateY(-${currentVideoIndex * 100}vh)`,
          height: `${videos.length * 100}vh`
        }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="w-full h-screen flex-shrink-0">
            <VideoPlayer
              videoUrl={video.videoUrl}
              username={video.username}
              isActive={index === currentVideoIndex}
              preloadedVideo={getPreloadedVideo(video.videoUrl)}
            />
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-10">
        {videos.map((_, index) => (
          <div
            key={index}
            className={`w-1 h-8 rounded-full transition-all duration-300 ${
              index === currentVideoIndex 
                ? 'bg-primary shadow-glow' 
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>


      {/* Updated swipe instruction */}
      {currentVideoIndex === 0 && videos.length > 1 && !hasEnabledSound && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-sm">Swipe up for sound & more videos 👆</p>
          </div>
        </div>
      )}
    </div>
  );
};
