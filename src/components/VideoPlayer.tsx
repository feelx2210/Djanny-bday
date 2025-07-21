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
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const { hasUserInteracted, isGloballyMuted, toggleGlobalMute, shouldAutoplayWithSound, markUserInteraction } = useAudio();

  // Mobile detection for debugging
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroidDevice = /Android/i.test(navigator.userAgent);

  // Create mobile-optimized URL with fallback
  const getOptimizedVideoUrl = (originalUrl: string, retryAttempt: number = 0) => {
    const baseUrl = originalUrl.split('/upload/')[0];
    const publicId = originalUrl.split('/upload/')[1].split('.')[0].replace(/f_auto,q_auto:good,fl_progressive\//, '');
    
    switch (retryAttempt) {
      case 0:
        // First attempt: Mobile optimized
        return `${baseUrl}/upload/f_auto,q_auto:good,fl_progressive/${publicId}`;
      case 1:
        // Second attempt: Lower quality for mobile
        return `${baseUrl}/upload/f_auto,q_auto:low,fl_progressive/${publicId}`;
      case 2:
        // Third attempt: Force MP4
        return `${baseUrl}/upload/f_mp4,q_auto:low/${publicId}.mp4`;
      default:
        // Final fallback: Original URL
        return originalUrl;
    }
  };

  const currentVideoUrl = getOptimizedVideoUrl(videoUrl, retryCount);

  // Log video setup on mobile
  useEffect(() => {
    console.log('VideoPlayer setup for mobile-optimized Cloudinary:', {
      originalUrl: videoUrl,
      optimizedUrl: currentVideoUrl,
      retryCount,
      isMobile: isMobileDevice,
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      hasUserInteracted,
      shouldAutoplayWithSound
    });
  }, [videoUrl, currentVideoUrl, retryCount]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Mobile-optimized Cloudinary video load started:', {
        url: currentVideoUrl,
        retryCount,
        isMobile: isMobileDevice,
        platform: isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop'
      });
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
    };

    const handleWaiting = () => {
      console.log('Cloudinary video waiting/buffering:', {
        url: videoUrl,
        isMobile: isMobileDevice,
        networkState: video.networkState,
        readyState: video.readyState
      });
    };

    const handleStalled = () => {
      console.error('Cloudinary video stalled:', {
        url: videoUrl,
        isMobile: isMobileDevice,
        networkState: video.networkState,
        readyState: video.readyState
      });
      
      if (isMobileDevice) {
        setErrorDetails('Video stalled on mobile - checking connection...');
      }
    };

    const handleCanPlay = () => {
      console.log('Mobile-optimized Cloudinary video can play:', {
        url: currentVideoUrl,
        retryCount,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        isMobile: isMobileDevice
      });
      setIsLoading(false);
      setHasError(false);
      setRetryCount(0); // Reset retry count on success
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

      console.error('Mobile-optimized Cloudinary video error:', {
        errorMessage,
        errorCode: error?.code,
        originalUrl: videoUrl,
        currentUrl: currentVideoUrl,
        retryCount,
        isMobile: isMobileDevice,
        platform: isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop',
        networkState: target.networkState,
        readyState: target.readyState
      });

      // Auto-retry with different URL format
      if (retryCount < 3) {
        console.log(`Auto-retrying with attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        return;
      }

      setIsLoading(false);
      setHasError(true);
      setErrorDetails(`${errorMessage} (Mobile: ${isMobileDevice ? 'Yes' : 'No'}, Attempts: ${retryCount + 1})`);
    };

    const handleLoadedMetadata = () => {
      console.log('Mobile-optimized Cloudinary video metadata loaded:', {
        url: currentVideoUrl,
        retryCount,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        hasAudio: Boolean((video as any).mozHasAudio || (video as any).webkitAudioDecodedByteCount || (video as any).audioTracks?.length),
        isMobile: isMobileDevice
      });
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);

    // Mobile-specific timeout for loading
    let loadTimeout: NodeJS.Timeout;
    if (isMobileDevice) {
      loadTimeout = setTimeout(() => {
        if (isLoading && !hasError) {
          console.error('Mobile video load timeout after 15s:', { url: videoUrl });
          setErrorDetails('Video loading timeout on mobile device');
          setHasError(true);
          setIsLoading(false);
        }
      }, 15000);
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [currentVideoUrl, retryCount, isMobileDevice, isIOSDevice, isAndroidDevice]);

  // Autoplay effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError || isLoading) return;

    const attemptAutoplay = async () => {
      try {
        video.muted = !shouldAutoplayWithSound;
        
        if (isActive) {
          console.log('Attempting autoplay on Cloudinary video:', { 
            muted: video.muted, 
            hasUserInteracted, 
            shouldAutoplayWithSound,
            isMobile: isMobileDevice,
            url: videoUrl
          });
          
          await video.play();
          setIsPlaying(true);
          
          console.log('Cloudinary video autoplay successful');
        } else {
          video.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Cloudinary video autoplay failed:', {
          error: error instanceof Error ? error.message : error,
          isMobile: isMobileDevice,
          url: videoUrl,
          hasUserInteracted,
          shouldAutoplayWithSound
        });
        setIsPlaying(false);
      }
    };

    attemptAutoplay();
  }, [isActive, hasError, isLoading, shouldAutoplayWithSound, hasUserInteracted, videoUrl, isMobileDevice]);

  const handleVideoClick = () => {
    markUserInteraction();
    
    const video = videoRef.current;
    if (!video) return;

    console.log('Mobile-optimized Cloudinary video clicked:', { 
      isPlaying, 
      isMobile: isMobileDevice,
      url: currentVideoUrl,
      retryCount
    });

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.muted = !shouldAutoplayWithSound;
      video.play().then(() => {
        setIsPlaying(true);
        console.log('Mobile-optimized Cloudinary manual play succeeded');
      }).catch(error => {
        console.error('Mobile-optimized Cloudinary manual play failed:', error);
      });
    }
  };

  const handleMuteToggle = () => {
    markUserInteraction();
    toggleGlobalMute();
    
    const video = videoRef.current;
    if (video) {
      video.muted = !shouldAutoplayWithSound;
      console.log('Audio toggled for Cloudinary video:', { muted: video.muted, isMobile: isMobileDevice });
    }
  };

  const handleLike = () => {
    markUserInteraction();
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const retryVideo = () => {
    markUserInteraction();
    
    console.log('Manual retry for mobile-optimized Cloudinary video:', { 
      originalUrl: videoUrl,
      currentUrl: currentVideoUrl,
      retryCount,
      isMobile: isMobileDevice 
    });
    
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    setRetryCount(prev => prev + 1);
  };

  const getMobileVideoAttributes = () => {
    const baseAttributes = {
      loop: true,
      muted: !shouldAutoplayWithSound,
      playsInline: true,
      preload: 'metadata' as const,
      poster: undefined as string | undefined,
    };

    // Add poster image from Cloudinary for better mobile experience
    if (currentVideoUrl.includes('cloudinary.com')) {
      const posterUrl = currentVideoUrl.replace('/video/upload/', '/image/upload/').replace(/\.(mp4|webm|mov)$/, '.jpg');
      baseAttributes.poster = posterUrl;
    }

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

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={currentVideoUrl}
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
                Loading optimized mobile video...
                {retryCount > 0 && <br />}
                {retryCount > 0 && `Attempt ${retryCount + 1}`}
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
              Mobile-optimized Cloudinary URL: {currentVideoUrl}
            </p>
            <button
              onClick={retryVideo}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try Again {retryCount < 3 ? `(${4 - retryCount} attempts left)` : '(Final attempt)'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile platform indicator */}
      {isMobileDevice && (
        <div className="absolute top-2 left-2 z-20 bg-black/70 rounded px-2 py-1">
          <p className="text-white text-xs">
            📱 {isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Mobile'} • Optimized
            {retryCount > 0 && ` • Retry ${retryCount}`}
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
