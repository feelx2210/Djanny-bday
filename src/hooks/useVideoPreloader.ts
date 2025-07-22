
import { useEffect, useRef, useState } from 'react';

interface PreloadedVideo {
  url: string;
  element: HTMLVideoElement;
  loaded: boolean;
}

export const useVideoPreloader = () => {
  const preloadedVideos = useRef<Map<string, PreloadedVideo>>(new Map());
  const [preloadProgress, setPreloadProgress] = useState<Record<string, number>>({});

  const preloadVideo = (url: string): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      // Check if already preloaded
      const existing = preloadedVideos.current.get(url);
      if (existing?.loaded) {
        resolve(existing.element);
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      const handleCanPlay = () => {
        preloadedVideos.current.set(url, {
          url,
          element: video,
          loaded: true
        });
        
        setPreloadProgress(prev => ({ ...prev, [url]: 100 }));
        cleanup();
        resolve(video);
      };

      const handleError = () => {
        cleanup();
        reject(new Error(`Failed to preload video: ${url}`));
      };

      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const progress = (video.buffered.end(0) / video.duration) * 100;
          setPreloadProgress(prev => ({ ...prev, [url]: Math.round(progress) }));
        }
      };

      const cleanup = () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('progress', handleProgress);
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('progress', handleProgress);
      
      video.src = url;
      video.load();
    });
  };

  const preloadVideos = async (urls: string[]) => {
    const promises = urls.map(url => 
      preloadVideo(url).catch(error => {
        console.warn(`Failed to preload ${url}:`, error);
        return null;
      })
    );
    
    return Promise.allSettled(promises);
  };

  const getPreloadedVideo = (url: string): HTMLVideoElement | null => {
    return preloadedVideos.current.get(url)?.element || null;
  };

  const clearPreloadedVideos = () => {
    preloadedVideos.current.clear();
    setPreloadProgress({});
  };

  return {
    preloadVideo,
    preloadVideos,
    getPreloadedVideo,
    clearPreloadedVideos,
    preloadProgress
  };
};
