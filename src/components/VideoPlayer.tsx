
import React, { useRef, useEffect, useState } from 'react';
import { Heart, Share, MessageCircle, MoreHorizontal, Play, Loader2, AlertCircle } from 'lucide-react';

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
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Enhanced mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      console.log('Video load started:', videoUrl, 'Mobile:', isMobile);
      setIsLoading(true);
      setHasError(false);
      setErrorDetails('');
    };

    const handleCanPlay = () => {
      console.log('Video can play:', videoUrl, 'Mobile:', isMobile);
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

      console.error('Video error:', errorMessage, 'Code:', error?.code, 'URL:', videoUrl, 'Mobile:', isMobile);
      setIsLoading(false);
      setHasError(true);
      setErrorDetails(errorMessage);
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded:', videoUrl, 'Duration:', video.duration, 'Mobile:', isMobile);
      setIsLoading(false);
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
  }, [videoUrl, isMobile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isActive && !isLoading) {
      const playVideo = async () => {
        try {
          await video.play();
          setIsPlaying(true);
          setNeedsManualPlay(false);
          console.log('Video started playing automatically');
        } catch (error) {
          console.log('Autoplay failed, requiring manual interaction:', error);
          setNeedsManualPlay(true);
          setIsPlaying(false);
        }
      };

      playVideo();
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isLoading, hasError]);

  const handleManualPlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setHasInteracted(true);
      await video.play();
      setIsPlaying(true);
      setNeedsManualPlay(false);
      console.log('Video started playing manually');
    } catch (error) {
      console.error('Manual play failed:', error);
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
      } else {
        setHasInteracted(true);
        await video.play();
        setIsPlaying(true);
        setNeedsManualPlay(false);
      }
    } catch (error) {
      console.error('Toggle play/pause failed:', error);
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
    
    console.log('Retrying video load:', videoUrl);
    setHasError(false);
    setIsLoading(true);
    setErrorDetails('');
    video.load();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload={isMobile ? "metadata" : "auto"}
        onClick={togglePlayPause}
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
            <button
              onClick={retryVideo}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Retry
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
              <p className="text-white text-sm">Tap to play video</p>
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
      </div>
    </div>
  );
};
