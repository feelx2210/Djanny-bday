
import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Play, Loader2, AlertCircle, Wifi } from 'lucide-react';

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
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState(videoUrl);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'fast' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced mobile detection and debugging
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
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

  // Comprehensive mobile debugging
  useEffect(() => {
    console.log('VideoPlayer Mobile Debug:', {
      isMobile,
      isIOS,
      isAndroid,
      userAgent,
      videoUrl,
      alternativeUrl,
      currentUrl,
      networkQuality,
      hasWebKit: 'webkitRequestFullscreen' in document.createElement('div'),
      hasVideoSupport: !!document.createElement('video').canPlayType,
      mp4Support: document.createElement('video').canPlayType('video/mp4'),
      webmSupport: document.createElement('video').canPlayType('video/webm')
    });
  }, [videoUrl, isMobile, isIOS, isAndroid, userAgent, currentUrl, networkQuality]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Video load started:', {
        url: currentUrl,
        isMobile,
        isIOS,
        isAndroid,
        retryCount,
        networkQuality
      });
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
    };

    const handleCanPlay = () => {
      console.log('Video can play:', {
        url: currentUrl,
        isMobile,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
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

      console.error('Video error:', {
        errorMessage,
        errorCode: error?.code,
        url: currentUrl,
        isMobile,
        isIOS,
        isAndroid,
        userAgent,
        retryCount,
        hasAlternative: !!alternativeUrl,
        networkQuality
      });

      // Try alternative URL if available and we haven't tried it yet
      if (alternativeUrl && currentUrl !== alternativeUrl && retryCount < 2) {
        console.log('Trying alternative URL:', alternativeUrl);
        setCurrentUrl(alternativeUrl);
        setRetryCount(prev => prev + 1);
        return;
      }

      setIsLoading(false);
      setHasError(true);
      setErrorDetails(errorMessage);
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded:', {
        url: currentUrl,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        isMobile,
        retryCount
      });
      setIsLoading(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(0);
        const duration = video.duration;
        const percentBuffered = (buffered / duration) * 100;
        console.log('Video buffering progress:', { percentBuffered, buffered, duration, isMobile });
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
    };
  }, [currentUrl, isMobile, isIOS, isAndroid, userAgent, retryCount, alternativeUrl, networkQuality]);

  // Update currentUrl when videoUrl changes
  useEffect(() => {
    setCurrentUrl(videoUrl);
    setRetryCount(0);
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isActive && !isLoading) {
      const playVideo = async () => {
        try {
          console.log('Attempting autoplay:', { isMobile, hasInteracted, currentUrl });
          await video.play();
          setIsPlaying(true);
          setNeedsManualPlay(false);
          console.log('Video started playing automatically');
        } catch (error) {
          console.log('Autoplay failed, requiring manual interaction:', { error, isMobile, userAgent });
          setNeedsManualPlay(true);
          setIsPlaying(false);
        }
      };

      playVideo();
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isLoading, hasError, currentUrl]);

  const handleManualPlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      console.log('Manual play attempt:', { isMobile, currentUrl, userAgent });
      setHasInteracted(true);
      await video.play();
      setIsPlaying(true);
      setNeedsManualPlay(false);
      console.log('Video started playing manually');
    } catch (error) {
      console.error('Manual play failed:', { error, isMobile, currentUrl, userAgent });
      setHasError(true);
      setErrorDetails('Failed to start video playback');
    }
  };

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
        console.log('Video paused by user');
      } else {
        setHasInteracted(true);
        await video.play();
        setIsPlaying(true);
        setNeedsManualPlay(false);
        console.log('Video played by user toggle');
      }
    } catch (error) {
      console.error('Toggle play/pause failed:', { error, isMobile, currentUrl });
      setNeedsManualPlay(true);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const retryVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    
    console.log('Retrying video load:', { currentUrl, retryCount, hasAlternative: !!alternativeUrl });
    
    // If we have an alternative URL and haven't tried it yet, try it
    if (alternativeUrl && currentUrl === videoUrl && retryCount === 0) {
      setCurrentUrl(alternativeUrl);
      setRetryCount(1);
    } else if (currentUrl === alternativeUrl && retryCount === 1) {
      // Go back to original URL
      setCurrentUrl(videoUrl);
      setRetryCount(2);
    } else {
      // Reset to original URL
      setCurrentUrl(videoUrl);
      setRetryCount(0);
    }
    
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    video.load();
  };

  // Progressive video attributes based on device and network
  const getVideoAttributes = () => {
    const baseAttributes = {
      loop: true,
      muted: true,
      playsInline: true,
      'webkit-playsinline': 'true' as const
    };

    if (isMobile) {
      return {
        ...baseAttributes,
        preload: networkQuality === 'slow' ? 'none' : 'metadata',
        ...(isIOS && { 'x-webkit-airplay': 'allow' })
      };
    }

    return {
      ...baseAttributes,
      preload: 'auto'
    };
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={currentUrl}
        className="w-full h-full object-cover"
        onClick={togglePlayPause}
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
          {isMobile && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/80 rounded-lg px-4 py-2 backdrop-blur-sm">
                <p className="text-white text-sm flex items-center">
                  <Wifi className="w-4 h-4 mr-2" />
                  Loading video... ({networkQuality} network)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/80 rounded-lg p-6 mx-4 text-center backdrop-blur-sm max-w-sm">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white text-sm mb-2">Failed to load video</p>
            {errorDetails && (
              <p className="text-white/70 text-xs mb-2">{errorDetails}</p>
            )}
            {isMobile && (
              <p className="text-white/60 text-xs mb-4">
                Mobile: {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other'} | Retry #{retryCount}
              </p>
            )}
            <button
              onClick={retryVideo}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {alternativeUrl && retryCount === 0 ? 'Try Alternative URL' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Manual play overlay for mobile */}
      {needsManualPlay && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handleManualPlay}
        >
          <div className="bg-black/50 rounded-full p-6 backdrop-blur-sm">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/80 rounded-lg px-4 py-2 backdrop-blur-sm">
              <p className="text-white text-sm">
                {isMobile ? `Tap to play (${isIOS ? 'iOS' : 'Mobile'})` : 'Tap to play video'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause overlay */}
      {!isPlaying && !needsManualPlay && !isLoading && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
          </div>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center space-y-6">
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
        <button className="flex flex-col items-center group">
          <div className="w-12 h-12 bg-secondary/80 rounded-full flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
            <Share className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Share</span>
        </button>

        {/* More options */}
        <button className="flex flex-col items-center group">
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

        {/* Debug info for mobile (only in development) */}
        {isMobile && process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-white/40">
            Debug: {isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile'} | URL: {currentUrl === videoUrl ? 'Primary' : 'Alternative'} | Retry: {retryCount}
          </div>
        )}
      </div>
    </div>
  );
};
