
import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Loader2, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface VideoPlayerProps {
  videoUrl: string;
  description: string;
  username: string;
  isActive: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  description,
  username,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 1000) + 50);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { hasUserInteracted, isGloballyMuted, toggleGlobalMute, shouldAutoplayWithSound, markUserInteraction } = useAudio();

  // Mobile detection
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Video load started:', videoUrl);
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      console.log('Video can play:', videoUrl);
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      console.error('Video error:', error, videoUrl);
      setIsLoading(false);
      setHasError(true);
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded:', {
        url: videoUrl,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoUrl]);

  // Autoplay effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError || isLoading) return;

    const attemptAutoplay = async () => {
      try {
        video.muted = !shouldAutoplayWithSound;
        
        if (isActive) {
          console.log('Attempting autoplay:', { 
            muted: video.muted, 
            hasUserInteracted, 
            shouldAutoplayWithSound
          });
          
          await video.play();
          setIsPlaying(true);
          console.log('Autoplay successful');
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Autoplay failed:', error);
        setIsPlaying(false);
      }
    };

    attemptAutoplay();
  }, [isActive, hasError, isLoading, shouldAutoplayWithSound, hasUserInteracted]);

  const handleVideoClick = () => {
    markUserInteraction();
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = !shouldAutoplayWithSound;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Manual play failed:', error);
      });
    }
  };

  const handleMuteToggle = () => {
    markUserInteraction();
    toggleGlobalMute();
    
    const video = videoRef.current;
    if (video) {
      video.muted = !shouldAutoplayWithSound;
    }
  };

  const handleLike = () => {
    markUserInteraction();
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        onClick={handleVideoClick}
        loop
        muted={!shouldAutoplayWithSound}
        playsInline
        preload="metadata"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-xs mt-2 text-center">
              Loading video...
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 mx-4 text-center backdrop-blur-sm max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-sm mb-2">Video failed to load</p>
            <p className="text-white/50 text-xs mb-4">
              URL: {videoUrl}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center space-y-6">
        {/* Mute/Unmute button */}
        <button
          onClick={handleMuteToggle}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            {!shouldAutoplayWithSound ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="text-white text-xs mt-1 font-medium">
            {!shouldAutoplayWithSound ? 'Unmute' : 'Mute'}
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
          onClick={markUserInteraction}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            <Share className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Share</span>
        </button>

        {/* More options */}
        <button 
          onClick={markUserInteraction}
          className="flex flex-col items-center group"
        >
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            <MoreHorizontal className="w-6 h-6 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 text-white">
        <div className="mb-2">
          <h3 className="font-semibold text-base">@{username}</h3>
        </div>
        <div className="mb-4">
          <p className="text-sm leading-relaxed opacity-90">{description}</p>
        </div>
        
        {/* Birthday celebration emoji bar */}
        <div className="flex items-center space-x-2 text-lg">
          <span>🎉</span>
          <span>🎂</span>
          <span>🎈</span>
          <span>🥳</span>
          <span>✨</span>
        </div>

        {/* Audio status indicator */}
        <div className="mt-2 flex items-center text-xs text-white/60">
          {!hasUserInteracted ? (
            <>
              <VolumeX className="w-3 h-3 mr-1" />
              <span>Swipe to enable sound</span>
            </>
          ) : (
            <>
              {shouldAutoplayWithSound ? (
                <Volume2 className="w-3 h-3 mr-1" />
              ) : (
                <VolumeX className="w-3 h-3 mr-1" />
              )}
              <span>
                {shouldAutoplayWithSound ? 'Playing with sound' : 'Muted'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
