import React, { useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';

// Mock video data - in real app, this would come from Google Drive/Dropbox API
const mockVideos = [
  {
    id: 1,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    username: 'happybirthday_squad',
    description: '🎉 Happy Birthday Djanny! Hope your special day is as amazing as you are! Can\'t wait to celebrate with you! 🎂✨'
  },
  {
    id: 2,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    username: 'family_wishes',
    description: '🥳 From all of us to you - may this new year of life bring you endless joy, laughter, and all your heart desires! 🎈'
  },
  {
    id: 3,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    username: 'childhood_friends',
    description: '🎂 Remember when we used to dream about growing up? Well, here we are! Happy Birthday to my forever friend! 💖'
  },
  {
    id: 4,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    username: 'work_colleagues',
    description: '🌟 Another year of being absolutely wonderful! Wishing you success, happiness, and cake... lots of cake! 🍰'
  },
  {
    id: 5,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    username: 'college_crew',
    description: '🎊 From cramming for exams to celebrating birthdays - some things never change! Have the best day ever! 📚🎉'
  }
];

export const DjannyTokFeed: React.FC = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;
      
      touchEndY = e.changedTouches[0].screenY;
      const deltaY = touchStartY - touchEndY;
      
      // Threshold for swipe detection
      if (Math.abs(deltaY) > 50) {
        setIsScrolling(true);
        
        if (deltaY > 0 && currentVideoIndex < mockVideos.length - 1) {
          // Swipe up - next video
          setCurrentVideoIndex(prev => prev + 1);
        } else if (deltaY < 0 && currentVideoIndex > 0) {
          // Swipe down - previous video
          setCurrentVideoIndex(prev => prev - 1);
        }
        
        setTimeout(() => setIsScrolling(false), 500);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      
      e.preventDefault();
      setIsScrolling(true);
      
      if (e.deltaY > 0 && currentVideoIndex < mockVideos.length - 1) {
        // Scroll down - next video
        setCurrentVideoIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentVideoIndex > 0) {
        // Scroll up - previous video
        setCurrentVideoIndex(prev => prev - 1);
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
  }, [currentVideoIndex, isScrolling]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;
      
      if (e.key === 'ArrowDown' && currentVideoIndex < mockVideos.length - 1) {
        setIsScrolling(true);
        setCurrentVideoIndex(prev => prev + 1);
        setTimeout(() => setIsScrolling(false), 500);
      } else if (e.key === 'ArrowUp' && currentVideoIndex > 0) {
        setIsScrolling(true);
        setCurrentVideoIndex(prev => prev - 1);
        setTimeout(() => setIsScrolling(false), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentVideoIndex, isScrolling]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Video container with smooth transitions */}
      <div 
        className="flex flex-col transition-transform duration-500 ease-out"
        style={{ 
          transform: `translateY(-${currentVideoIndex * 100}vh)`,
          height: `${mockVideos.length * 100}vh`
        }}
      >
        {mockVideos.map((video, index) => (
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

      {/* Progress indicator */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-10">
        {mockVideos.map((_, index) => (
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

      {/* Swipe instruction (shows briefly on first load) */}
      {currentVideoIndex === 0 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-sm">Swipe up for more videos 👆</p>
          </div>
        </div>
      )}
    </div>
  );
};