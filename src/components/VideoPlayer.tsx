import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Loader2, AlertCircle, Wifi, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface VideoPlayerProps {
  videoUrl: string;
  description: string;
  username: string;
  isActive: boolean;
  alternativeUrl?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  description,
  username,
  isActive,
  alternativeUrl
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 1000) + 50);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState(videoUrl);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'fast' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  const [showAudioTransition, setShowAudioTransition] = useState(false);

  const { hasUserInteracted, isGloballyMuted, toggleGlobalMute, shouldAutoplayWithSound, markUserInteraction } = useAudio();

  // Enhanced mobile detection and debugging
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroidDevice = /Android/i.test(navigator.userAgent);
  const userAgent = navigator.userAgent;

  // Network quality detection
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        setNetworkQuality(effectiveType === '4g' || effectiveType === '3g' ? 'fast' : 'slow');
        console.log('Network quality detected:', { effectiveType, networkQuality: effectiveType === '4g' || effectiveType === '3g' ? 'fast' : 'slow' });
      }
    }
  }, []);

  // Comprehensive mobile debugging - only log once per video change
  useEffect(() => {
    console.log('VideoPlayer Mobile Debug for URL:', {
      videoUrl,
      currentUrl,
      isMobile: isMobileDevice,
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      userAgent,
      alternativeUrl,
      networkQuality,
      hasWebKit: 'webkitRequestFullscreen' in document.createElement('div'),
      hasVideoSupport: !!document.createElement('video').canPlayType,
      mp4Support: document.createElement('video').canPlayType('video/mp4'),
      webmSupport: document.createElement('video').canPlayType('video/webm'),
      hasUserInteracted,
      shouldAutoplayWithSound
    });
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Video load started:', {
        url: currentUrl,
        isMobile: isMobileDevice,
        hasUserInteracted,
        shouldAutoplayWithSound
      });
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
    };

    const handleCanPlay = () => {
      console.log('Video can play:', {
        url: currentUrl,
        duration: video.duration,
        hasUserInteracted,
        shouldAutoplayWithSound,
        isMobile: isMobileDevice
      });
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      const error = target.error;
      let errorMessage = 'Unknown error';
      
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Video playback aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading video';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Error decoding video';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            break;
        }
      }

      console.error('Video error on mobile:', {
        errorMessage,
        errorCode: error?.code,
        url: currentUrl,
        retryCount,
        hasAlternative: !!alternativeUrl,
        isMobile: isMobileDevice,
        userAgent,
        networkQuality
      });

      // Try alternative URL if available and we haven't tried it yet
      if (alternativeUrl && currentUrl !== alternativeUrl && retryCount < 2) {
        console.log('Trying alternative URL on mobile:', alternativeUrl);
        setCurrentUrl(alternativeUrl);
        setRetryCount(prev => prev + 1);
        return;
      }

      setIsLoading(false);
      setHasError(true);
      setErrorDetails(`${errorMessage} (Mobile: ${isMobileDevice ? 'Yes' : 'No'})`);
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded:', {
        url: currentUrl,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        isMobile: isMobileDevice
      });
    };

    const handleTimeUpdate = () => {
      // Only log once when video actually starts playing
      if (video.currentTime > 0 && !video.paused) {
        console.log('Video started playing on mobile:', {
          currentTime: video.currentTime,
          duration: video.duration,
          url: currentUrl,
          isMobile: isMobileDevice
        });
        video.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentUrl, retryCount, alternativeUrl, isMobileDevice, userAgent, networkQuality]);

  // Update currentUrl when videoUrl changes
  useEffect(() => {
    setCurrentUrl(videoUrl);
    setRetryCount(0);
  }, [videoUrl]);

  // Progressive autoplay effect - removed showAudioTransition from dependencies
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError || isLoading) return;

    const attemptAutoplay = async () => {
      try {
        // Set muted state based on global audio state
        video.muted = !shouldAutoplayWithSound;
        
        if (isActive) {
          console.log('Attempting autoplay on mobile:', { 
            muted: video.muted, 
            hasUserInteracted, 
            shouldAutoplayWithSound,
            isMobile: isMobileDevice,
            url: currentUrl
          });
          
          await video.play();
          setIsPlaying(true);

          // Show audio transition feedback if switching from muted to unmuted
          if (shouldAutoplayWithSound && hasUserInteracted) {
            setShowAudioTransition(true);
            setTimeout(() => setShowAudioTransition(false), 2000);
          }
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Autoplay failed on mobile:', {
          error,
          isMobile: isMobileDevice,
          url: currentUrl,
          hasUserInteracted,
          shouldAutoplayWithSound
        });
        setIsPlaying(false);
      }
    };

    attemptAutoplay();
  }, [isActive, hasError, isLoading, shouldAutoplayWithSound, hasUserInteracted, currentUrl, isMobileDevice]);

  const handleVideoClick = () => {
    markUserInteraction();
    
    const video = videoRef.current;
    if (!video) return;

    console.log('Video clicked on mobile:', { 
      isPlaying, 
      isMobile: isMobileDevice,
      url: currentUrl 
    });

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = !shouldAutoplayWithSound;
      video.play().then(() => {
        setIsPlaying(true);
        console.log('Manual play succeeded on mobile');
      }).catch(error => {
        console.error('Manual play failed on mobile:', error);
      });
    }
  };

  const handleMuteToggle = () => {
    markUserInteraction();
    toggleGlobalMute();
    
    const video = videoRef.current;
    if (video) {
      video.muted = !shouldAutoplayWithSound;
      console.log('Mute toggled on mobile:', { muted: video.muted, isMobile: isMobileDevice });
    }
  };

  const handleLike = () => {
    markUserInteraction();
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const retryVideo = () => {
    markUserInteraction();
    const video = videoRef.current;
    if (!video) return;
    
    console.log('Retrying video load on mobile:', { 
      currentUrl, 
      retryCount, 
      isMobile: isMobileDevice 
    });
    
    if (alternativeUrl && currentUrl === videoUrl && retryCount === 0) {
      setCurrentUrl(alternativeUrl);
      setRetryCount(1);
    } else if (currentUrl === alternativeUrl && retryCount === 1) {
      setCurrentUrl(videoUrl);
      setRetryCount(2);
    } else {
      setCurrentUrl(videoUrl);
      setRetryCount(0);
    }
    
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    video.load();
  };

  const getVideoAttributes = () => {
    const baseAttributes = {
      loop: true,
      muted: !shouldAutoplayWithSound,
      playsInline: true,
      'webkit-playsinline': 'true' as const,
      preload: (isMobileDevice && networkQuality === 'slow') ? 'metadata' : 'auto',
    };

    // Add iOS-specific attributes
    if (isIOSDevice) {
      return {
        ...baseAttributes,
        'x-webkit-airplay': 'allow' as const,
        controls: false, // Ensure no controls on iOS
      };
    }

    // Add Android-specific attributes
    if (isAndroidDevice) {
      return {
        ...baseAttributes,
        'data-setup': '{}',
      };
    }

    return baseAttributes;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={currentUrl}
        className="w-full h-full object-cover"
        onClick={handleVideoClick}
        {...getVideoAttributes()}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 mx-4 text-center backdrop-blur-sm max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-sm mb-2">Failed to load video</p>
            {errorDetails && (
              <p className="text-white/70 text-xs mb-4">{errorDetails}</p>
            )}
            <p className="text-white/50 text-xs mb-4">
              Retry #{retryCount} • URL: {currentUrl.includes('raw=1') ? 'Raw' : 'Direct'}
            </p>
            <button
              onClick={retryVideo}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {alternativeUrl && retryCount === 0 ? 'Try Alternative URL' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Audio transition feedback */}
      {showAudioTransition && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-black/80 rounded-lg px-6 py-3 backdrop-blur-sm animate-fade-in">
            <p className="text-white text-sm flex items-center">
              <Volume2 className="w-5 h-5 mr-2 text-primary" />
              Audio enabled!
            </p>
          </div>
        </div>
      )}

      {/* Mobile debug indicator */}
      {isMobileDevice && (
        <div className="absolute top-2 left-2 z-20 bg-black/70 rounded px-2 py-1">
          <p className="text-white text-xs">
            📱 {isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Mobile'}
          </p>
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
