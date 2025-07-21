import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { useVideoLoader } from '../hooks/useVideoLoader';
import { RefreshCw, AlertCircle, Gift } from 'lucide-react';

export const DjannyTokFeed: React.FC = () => {
  const { videos, loading, error, refreshVideos } = useVideoLoader();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling || videos.length === 0) return;
      
      touchEndY = e.changedTouches[0].screenY;
      const deltaY = touchStartY - touchEndY;
      
      // Threshold for swipe detection
      if (Math.abs(deltaY) > 50) {
        setIsScrolling(true);
        
        if (deltaY > 0) {
          // Swipe up - next video (with endless loop)
          setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        } else {
          // Swipe down - previous video (with endless loop)
          setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
        }
        
        setTimeout(() => setIsScrolling(false), 500);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling || videos.length === 0) return;
      
      e.preventDefault();
      setIsScrolling(true);
      
      if (e.deltaY > 0) {
        // Scroll down - next video (with endless loop)
        setCurrentVideoIndex(prev => (prev + 1) % videos.length);
      } else {
        // Scroll up - previous video (with endless loop)
        setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
      }
      
      setTimeout(() => setIsScrolling(false), 500);
    };

    // Add event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [currentVideoIndex, isScrolling, videos.length]);

  // Keyboard navigation with endless loop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling || videos.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        setIsScrolling(true);
        setCurrentVideoIndex(prev => (prev + 1) % videos.length);
        setTimeout(() => setIsScrolling(false), 500);
      } else if (e.key === 'ArrowUp') {
        setIsScrolling(true);
        setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
        setTimeout(() => setIsScrolling(false), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, isScrolling, videos.length]);

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
          <p className="text-sm opacity-75 mt-2">Discovering videos from pCloud</p>
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
          <p className="text-sm opacity-75 mb-6">Videos will appear here once they're uploaded to the videos folder</p>
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
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Pull-to-refresh hint */}
      {showRefreshHint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2">
          <p className="text-white text-sm flex items-center">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Release to refresh
          </p>
        </div>
      )}

      {/* Video container with smooth transitions */}
      <div 
        className="flex flex-col transition-transform duration-500 ease-out"
        style={{ 
          transform: `translateY(-${currentVideoIndex * 100}vh)`,
          height: `${videos.length * 100}vh`
        }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="w-full h-screen flex-shrink-0">
            <VideoPlayer
              videoUrl={video.videoUrl}
              description={video.description}
              username={video.username}
              isActive={index === currentVideoIndex}
            />
          </div>
        ))}
      </div>

      {/* Progress indicator with endless loop visualization */}
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

      {/* Video counter and endless loop indicator */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-white text-sm font-medium">
          {currentVideoIndex + 1} of {videos.length}
        </p>
        <p className="text-white/60 text-xs">∞ endless loop</p>
      </div>

      {/* Swipe instruction (shows on first video) */}
      {currentVideoIndex === 0 && videos.length > 1 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-sm">Swipe up for more videos 👆</p>
          </div>
        </div>
      )}
    </div>
  );
};
