import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface VideoPlayerProps {
  videoUrl: string;
  username: string;
  isActive: boolean;
  preloadedVideo?: HTMLVideoElement | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  username,
  isActive,
  preloadedVideo
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 1000) + 50);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { hasUserInteracted, hasEnabledSound, hasUserEverEnabledSound, isGloballyMuted, toggleGlobalMute, shouldAutoplayWithSound, enableSound } = useAudio();

  // Videos should be muted only if user has never enabled sound OR if globally muted
  const shouldBeMuted = !hasUserEverEnabledSound || isGloballyMuted;

  // Sync video muted state with React state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    console.log('Syncing video muted state:', shouldBeMuted);
    video.muted = shouldBeMuted;
  }, [shouldBeMuted]);

  // Use preloaded video if available
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !preloadedVideo) return;

    // Copy preloaded video state
    try {
      video.src = preloadedVideo.src;
      video.currentTime = 0;
      video.muted = shouldBeMuted;
      
      if (preloadedVideo.readyState >= 2) {
        setIsLoading(false);
        setHasError(false);
      }
    } catch (error) {
      console.warn('Failed to use preloaded video:', error);
    }
  }, [preloadedVideo, shouldBeMuted]);

  // Video loading events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      console.error('Video error:', videoUrl);
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  // TikTok-style autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    const attemptPlay = async () => {
      try {
        video.muted = shouldBeMuted;
        
        if (isActive) {
          await video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.warn('Autoplay failed:', error);
        // Always try muted autoplay as fallback
        try {
          video.muted = true;
          await video.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    };

    const timeout = setTimeout(attemptPlay, 100);
    return () => clearTimeout(timeout);
  }, [isActive, hasError, shouldBeMuted]);

  const handleVideoClick = () => {
    console.log('Video clicked, isPlaying:', isPlaying);
    enableSound(); // Enable sound for entire session
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = shouldBeMuted;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.warn('Manual play failed:', error);
      });
    }
  };

  const handleVideoTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    console.log('Video touched');
    handleVideoClick();
  };

  const handleMuteToggle = () => {
    console.log('Mute toggle clicked, current isGloballyMuted:', isGloballyMuted);
    enableSound(); // Enable sound for entire session
    toggleGlobalMute();
    
    // Video muted state will be synced automatically via useEffect
  };

  const handleMuteTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Mute button touched');
    handleMuteToggle();
  };

  const handleLike = () => {
    enableSound(); // Enable sound for entire session
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    enableSound(); // Enable sound for entire session
    // Share functionality would go here
  };

  const handleMore = () => {
    enableSound(); // Enable sound for entire session
    // More options functionality would go here
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden touch-manipulation">
      {/* Video with TikTok-style optimization */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain touch-manipulation"
        onClick={handleVideoClick}
        onTouchEnd={handleVideoTouch}
        loop
        muted={shouldBeMuted}
        playsInline={true}
        controls={false}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ touchAction: 'manipulation' }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 mx-4 text-center backdrop-blur-sm max-w-sm">
            <p className="text-white text-sm mb-2">Video unavailable</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center space-y-6">
        {/* Mute/Unmute button */}
        <button
          onClick={handleMuteToggle}
          onTouchEnd={handleMuteTouch}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            {shouldBeMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="text-white text-xs mt-1 font-medium">
            {shouldBeMuted ? 'Sound' : 'Mute'}
          </span>
        </button>

        {/* Like button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            <Heart 
              className={`w-6 h-6 ${liked ? 'fill-primary text-primary' : 'text-white'} transition-colors`}
            />
          </div>
          <span className="text-white text-xs mt-1 font-medium">{likes}</span>
        </button>

        {/* Share button */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            <Share className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Share</span>
        </button>

        {/* More options */}
        <button 
          onClick={handleMore}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            <MoreHorizontal className="w-6 h-6 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 pb-safe pb-24 p-4">
        <div className="bg-black/40 rounded-lg p-3 backdrop-blur-sm">
          <div className="mb-3">
            <h3 className="font-semibold text-base text-white">@{username}</h3>
          </div>
          
          {/* Birthday celebration emoji bar */}
          <div className="flex items-center space-x-2 text-lg mb-2">
            <span>🎉</span>
            <span>🎂</span>
            <span>🎈</span>
            <span>🥳</span>
            <span>✨</span>
          </div>

          {/* Audio status indicator */}
          <div className="flex items-center text-xs text-white/60">
            {!hasEnabledSound ? (
              <>
                <VolumeX className="w-3 h-3 mr-1" />
                <span>Tap anywhere for sound</span>
              </>
            ) : shouldBeMuted ? (
              <>
                <VolumeX className="w-3 h-3 mr-1" />
                <span>Muted</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
