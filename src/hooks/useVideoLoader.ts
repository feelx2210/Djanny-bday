
import { useState, useEffect } from 'react';

export interface VideoData {
  id: number;
  filename: string;
  username: string;
  description: string;
  videoUrl?: string; // Optional direct URL for pCloud or other external sources
}

export interface VideoWithUrl extends VideoData {
  videoUrl: string;
  alternativeUrl?: string; // Add alternative URL for mobile fallback
}

export const useVideoLoader = () => {
  const [videos, setVideos] = useState<VideoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Mobile detection and debugging
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const userAgent = navigator.userAgent;

  const convertDropboxUrl = (originalUrl: string) => {
    if (originalUrl.includes('dropbox.com') && originalUrl.includes('dl=1')) {
      // Try raw=1 format for mobile compatibility
      const rawUrl = originalUrl.replace('dl=1', 'raw=1');
      console.log('Mobile Dropbox URL conversion:', { original: originalUrl, raw: rawUrl, isMobile, userAgent });
      return { primary: rawUrl, fallback: originalUrl };
    }
    return { primary: originalUrl, fallback: originalUrl };
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading videos - Mobile detection:', { isMobile, isIOS, userAgent });
      
      const response = await fetch('./videos.json');
      if (!response.ok) {
        throw new Error('Failed to load video metadata');
      }
      
      const data = await response.json();
      const videosWithUrls: VideoWithUrl[] = data.videos.map((video: VideoData) => {
        const originalUrl = video.videoUrl || `./videos/${video.filename}`;
        const { primary, fallback } = convertDropboxUrl(originalUrl);
        
        return {
          ...video,
          videoUrl: primary,
          alternativeUrl: fallback !== primary ? fallback : undefined
        };
      });
      
      setVideos(videosWithUrls);
      console.log(`Loaded ${videosWithUrls.length} videos from videos.json`, { isMobile, videosWithUrls });
    } catch (err) {
      console.error('Error loading videos:', err, { isMobile, userAgent });
      setError('Failed to load videos. Please check your connection.');
      // Fallback to empty array if videos.json doesn't exist yet
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshVideos = () => {
    setLastRefresh(Date.now());
    loadVideos();
  };

  useEffect(() => {
    loadVideos();
  }, [lastRefresh]);

  // Auto-refresh every 5 minutes to check for new videos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshVideos();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    videos,
    loading,
    error,
    refreshVideos
  };
};
