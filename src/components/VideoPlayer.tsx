
import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Loader2, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

interface VideoPlayerProps {
  videoUrl: string;
  description: string;
  username: string;
  isActive: boolean;
  alternativeUrl?: string;
  directUrl?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  description,
  username,
  isActive,
  alternativeUrl,
  directUrl
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 1000) + 50);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState(videoUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);

  const { hasUserInteracted, isGloballyMuted, toggleGlobalMute, shouldAutoplayWithSound, markUserInteraction } = useAudio();

  // Enhanced mobile detection
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroidDevice = /Android/i.test(navigator.userAgent);

  // Get all available URLs for fallback
  const getAllUrls = () => {
    const urls = [videoUrl];
    if (alternativeUrl && !urls.includes(alternativeUrl)) urls.push(alternativeUrl);
    if (directUrl && !urls.includes(directUrl)) urls.push(directUrl);
    return urls;
  };

  // Mobile debugging - log once per video change
  useEffect(() => {
    const allUrls = getAllUrls();
    console.log('VideoPlayer Mobile Setup:', {
      videoUrl,
      currentUrl,
      allAvailableUrls: allUrls,
      isMobile: isMobileDevice,
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      userAgent: navigator.userAgent,
      hasUserInteracted,
      shouldAutoplayWithSound,
      retryCount,
      urlHistory
    });
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Mobile video load started:', {
        url: currentUrl,
        urlType: currentUrl.includes('dl.dropboxusercontent.com') ? 'direct' : 
                currentUrl.includes('raw=1') ? 'raw' : 'dl',
        isMobile: isMobileDevice,
        platform: isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop'
      });
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
    };

    const handleCanPlay = () => {
      console.log('Mobile video can play:', {
        url: currentUrl,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState,
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
            errorMessage = 'Network error loading video';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Video decode error';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            break;
        }
      }

      console.error('Mobile video error detailed:', {
        errorMessage,
        errorCode: error?.code,
        currentUrl,
        urlType: currentUrl.includes('dl.dropboxusercontent.com') ? 'direct' : 
                currentUrl.includes('raw=1') ? 'raw' : 'dl',
        retryCount,
        availableUrls: getAllUrls(),
        urlHistory,
        isMobile: isMobileDevice,
        platform: isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop',
        networkState: target.networkState,
        readyState: target.readyState
      });

      // Try next URL in sequence
      const allUrls = getAllUrls();
      const currentIndex = allUrls.indexOf(currentUrl);
      const nextIndex = (currentIndex + 1) % allUrls.length;
      
      if (retryCount < allUrls.length * 2) { // Allow multiple rounds of retries
        const nextUrl = allUrls[nextIndex];
        console.log('Mobile video trying next URL:', {
          from: currentUrl,
          to: nextUrl,
          retryCount,
          maxRetries: allUrls.length * 2
        });
        
        setCurrentUrl(nextUrl);
        setUrlHistory(prev => [...prev, currentUrl]);
        setRetryCount(prev => prev + 1);
        return;
      }

      setIsLoading(false);
      setHasError(true);
      setErrorDetails(`${errorMessage} (Mobile: ${isMobileDevice ? 'Yes' : 'No'}, Retries: ${retryCount})`);
    };

    const handleLoadedMetadata = () => {
      console.log('Mobile video metadata loaded:', {
        url: currentUrl,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        hasAudio: video.mozHasAudio || Boolean(video.webkitAudioDecodedByteCount) || Boolean(video.audioTracks?.length),
        isMobile: isMobileDevice
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
  }, [currentUrl, retryCount, isMobileDevice, isIOSDevice, isAndroidDevice]);

  // Reset URL when videoUrl changes
  useEffect(() => {
    setCurrentUrl(videoUrl);
    setRetryCount(0);
    setUrlHistory([]);
  }, [videoUrl]);

  // Autoplay effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError || isLoading) return;

    const attemptAutoplay = async () => {
      try {
        video.muted = !shouldAutoplayWithSound;
        
        if (isActive) {
          console.log('Attempting mobile autoplay:', { 
            muted: video.muted, 
            hasUserInteracted, 
            shouldAutoplayWithSound,
            isMobile: isMobileDevice,
            url: currentUrl
          });
          
          await video.play();
          setIsPlaying(true);
          
          console.log('Mobile autoplay successful');
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Mobile autoplay failed:', {
          error: error instanceof Error ? error.message : error,
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

    console.log('Mobile video clicked:', { 
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
        console.log('Mobile manual play succeeded');
      }).catch(error => {
        console.error('Mobile manual play failed:', error);
      });
    }
  };

  const handleMuteToggle = () => {
    markUserInteraction();
    toggleGlobalMute();
    
    const video = videoRef.current;
    if (video) {
      video.muted = !shouldAutoplayWithSound;
      console.log('Mobile mute toggled:', { muted: video.muted, isMobile: isMobileDevice });
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
    
    console.log('Mobile video retry initiated:', { 
      currentUrl, 
      retryCount, 
      urlHistory,
      isMobile: isMobileDevice 
    });
    
    // Reset to first URL and try again
    setCurrentUrl(videoUrl);
    setRetryCount(0);
    setUrlHistory([]);
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    video.load();
  };

  const getMobileVideoAttributes = () => {
    const baseAttributes = {
      loop: true,
      muted: !shouldAutoplayWithSound,
      playsInline: true,
      preload: 'metadata' as const,
    };

    if (isIOSDevice) {
      return {
        ...baseAttributes,
        'webkit-playsinline': 'true' as const,
        'x-webkit-airplay': 'allow' as const,
        controls: false,
      };
    }

    if (isAndroidDevice) {
      return {
        ...baseAttributes,
        'data-setup': '{}',
        crossOrigin: 'anonymous' as const,
      };
    }

    return baseAttributes;
  };

  const getCurrentUrlType = () => {
    if (currentUrl.includes('dl.dropboxusercontent.com')) return 'Direct';
    if (currentUrl.includes('raw=1')) return 'Raw';
    if (currentUrl.includes('dl=1')) return 'Download';
    return 'Unknown';
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={currentUrl}
        className="w-full h-full object-cover"
        onClick={handleVideoClick}
        {...getMobileVideoAttributes()}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            {isMobileDevice && (
              <p className="text-white text-xs mt-2 text-center">
                Loading {getCurrentUrlType()}...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 mx-4 text-center backdrop-blur-sm max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-sm mb-2">Video failed to load</p>
            {errorDetails && (
              <p className="text-white/70 text-xs mb-2">{errorDetails}</p>
            )}
            <p className="text-white/50 text-xs mb-4">
              URL: {getCurrentUrlType()} • Retry #{retryCount}
            </p>
            <button
              onClick={retryVideo}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Mobile platform indicator */}
      {isMobileDevice && (
        <div className="absolute top-2 left-2 z-20 bg-black/70 rounded px-2 py-1">
          <p className="text-white text-xs">
            📱 {isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Mobile'} • {getCurrentUrlType()}
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
