
import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Loader2, AlertCircle, Volume2, VolumeX, Play } from 'lucide-react';
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
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showManualPlay, setShowManualPlay] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const { hasUserInteracted, isGloballyMuted, toggleGlobalMute, shouldAutoplayWithSound, markUserInteraction } = useAudio();

  // Mobile detection
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Force muted on mobile devices for autoplay to work
  const shouldBeMuted = isMobileDevice || !shouldAutoplayWithSound;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Mobile video load started:', { url: videoUrl, isMobile: isMobileDevice });
      setIsLoading(true);
      setHasError(false);
      setDebugInfo('Loading started...');
      
      // Set timeout for mobile loading detection
      const timeout = setTimeout(() => {
        console.log('Mobile video loading timeout - showing manual play button');
        setIsLoading(false);
        setShowManualPlay(true);
        setDebugInfo('Loading timeout - tap to play manually');
      }, 10000); // 10 second timeout
      
      setLoadingTimeout(timeout);
    };

    const handleLoadedData = () => {
      console.log('Mobile video data loaded:', { url: videoUrl, readyState: video.readyState });
      setIsLoading(false);
      setHasError(false);
      setShowManualPlay(false);
      setDebugInfo('Video data loaded');
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    const handleCanPlay = () => {
      console.log('Mobile video can play:', { url: videoUrl, readyState: video.readyState });
      setIsLoading(false);
      setHasError(false);
      setShowManualPlay(false);
      setDebugInfo('Video ready to play');
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      console.error('Mobile video error:', { error, url: videoUrl, isMobile: isMobileDevice });
      setIsLoading(false);
      setHasError(true);
      setShowManualPlay(false);
      setDebugInfo(`Error: ${error?.message || 'Unknown error'}`);
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(0) / video.duration * 100;
        setDebugInfo(`Buffered: ${buffered.toFixed(1)}%`);
      }
    };

    // Use mobile-optimized events
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener(isMobileDevice ? 'loadeddata' : 'canplay', isMobileDevice ? handleLoadedData : handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener(isMobileDevice ? 'loadeddata' : 'canplay', isMobileDevice ? handleLoadedData : handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('progress', handleProgress);
      
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [videoUrl, isMobileDevice, loadingTimeout]);

  // Autoplay effect with mobile optimization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    const attemptAutoplay = async () => {
      try {
        // Force muted on mobile for autoplay to work
        video.muted = shouldBeMuted;
        
        if (isActive && !showManualPlay) {
          console.log('Attempting mobile autoplay:', { 
            muted: video.muted, 
            isMobile: isMobileDevice,
            readyState: video.readyState,
            currentTime: video.currentTime
          });
          
          await video.play();
          setIsPlaying(true);
          setDebugInfo('Playing automatically');
          console.log('Mobile autoplay successful');
        } else {
          video.pause();
          setIsPlaying(false);
          setDebugInfo('Paused');
        }
      } catch (error) {
        console.error('Mobile autoplay failed:', error);
        setIsPlaying(false);
        setShowManualPlay(true);
        setDebugInfo('Autoplay failed - tap to play');
      }
    };

    // Add delay for mobile devices to ensure video is ready
    if (isMobileDevice && !isLoading) {
      setTimeout(attemptAutoplay, 500);
    } else if (!isMobileDevice) {
      attemptAutoplay();
    }
  }, [isActive, hasError, isLoading, shouldBeMuted, isMobileDevice, showManualPlay]);

  const handleVideoClick = () => {
    markUserInteraction();
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setDebugInfo('Paused manually');
    } else {
      video.muted = shouldBeMuted;
      video.play().then(() => {
        setIsPlaying(true);
        setShowManualPlay(false);
        setDebugInfo('Playing manually');
      }).catch(error => {
        console.error('Manual play failed:', error);
        setDebugInfo('Manual play failed');
      });
    }
  };

  const handleMuteToggle = () => {
    markUserInteraction();
    
    if (isMobileDevice) {
      toggleGlobalMute();
      const video = videoRef.current;
      if (video) {
        video.muted = !shouldAutoplayWithSound || !hasUserInteracted;
      }
    } else {
      toggleGlobalMute();
      const video = videoRef.current;
      if (video) {
        video.muted = !shouldAutoplayWithSound;
      }
    }
  };

  const handleLike = () => {
    markUserInteraction();
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video with mobile-optimized attributes */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        onClick={handleVideoClick}
        loop
        muted={shouldBeMuted}
        playsInline={true}
        controls={false}
        preload={isMobileDevice ? "none" : "metadata"}
        crossOrigin="anonymous"
        {...(isMobileDevice && { 'webkit-playsinline': 'true' })}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Loading state */}
      {isLoading && !hasError && !showManualPlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm text-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
            <p className="text-white text-xs mt-2">Loading video...</p>
            {isMobileDevice && (
              <p className="text-white/60 text-xs mt-1">{debugInfo}</p>
            )}
          </div>
        </div>
      )}

      {/* Manual play button for mobile */}
      {showManualPlay && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleVideoClick}
            className="bg-primary/90 hover:bg-primary rounded-full p-6 backdrop-blur-sm transition-all"
          >
            <Play className="w-12 h-12 text-white fill-white" />
          </button>
          {isMobileDevice && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
              <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">
                Tap to play video
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 mx-4 text-center backdrop-blur-sm max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-sm mb-2">Video failed to load</p>
            <p className="text-white/50 text-xs mb-2">
              URL: {videoUrl}
            </p>
            {isMobileDevice && (
              <p className="text-white/50 text-xs mb-4">
                Debug: {debugInfo}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Mobile debug info */}
      {isMobileDevice && !hasError && (
        <div className="absolute top-16 left-4 bg-black/50 rounded px-2 py-1">
          <p className="text-white text-xs">{debugInfo}</p>
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
            {shouldBeMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="text-white text-xs mt-1 font-medium">
            {shouldBeMuted ? 'Unmute' : 'Mute'}
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
          {isMobileDevice && !hasUserInteracted ? (
            <>
              <VolumeX className="w-3 h-3 mr-1" />
              <span>Tap volume button to enable sound</span>
            </>
          ) : (
            <>
              {shouldBeMuted ? (
                <VolumeX className="w-3 h-3 mr-1" />
              ) : (
                <Volume2 className="w-3 h-3 mr-1" />
              )}
              <span>
                {shouldBeMuted ? 'Muted' : 'Playing with sound'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
