
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
      // For mobile, try raw=1 format first, but also provide dl=1 as fallback
      const rawUrl = originalUrl.replace('dl=1', 'raw=1');
      
      console.log('Dropbox URL conversion for mobile:', { 
        original: originalUrl, 
        raw: rawUrl, 
        isMobile, 
        isIOS,
        userAgent 
      });
      
      // On mobile, prefer raw=1 for direct video streaming
      if (isMobile) {
        return { primary: rawUrl, fallback: originalUrl };
      } else {
        // On desktop, dl=1 might work better
        return { primary: originalUrl, fallback: rawUrl };
      }
    }
    return { primary: originalUrl, fallback: originalUrl };
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading videos - Enhanced mobile detection:', { 
        isMobile, 
        isIOS, 
        userAgent,
        timestamp: new Date().toISOString()
      });
      
      // Use the correct base URL from Vite configuration
      const baseUrl = import.meta.env.BASE_URL;
      const videosJsonUrl = `${baseUrl}videos.json`;
      console.log('Fetching videos from:', videosJsonUrl);
      
      const response = await fetch(videosJsonUrl);
      if (!response.ok) {
        throw new Error(`Failed to load video metadata (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      const videosWithUrls: VideoWithUrl[] = data.videos.map((video: VideoData) => {
        const originalUrl = video.videoUrl || `${baseUrl}videos/${video.filename}`;
        const { primary, fallback } = convertDropboxUrl(originalUrl);
        
        console.log('Processing video URL:', {
          id: video.id,
          filename: video.filename,
          originalUrl,
          primaryUrl: primary,
          fallbackUrl: fallback,
          isMobile,
          hasFallback: fallback !== primary
        });
        
        return {
          ...video,
          videoUrl: primary,
          alternativeUrl: fallback !== primary ? fallback : undefined
        };
      });
      
      setVideos(videosWithUrls);
      console.log(`Successfully loaded ${videosWithUrls.length} videos from videos.json`, { 
        isMobile, 
        isIOS,
        videosWithUrls: videosWithUrls.map(v => ({
          id: v.id,
          primaryUrl: v.videoUrl,
          alternativeUrl: v.alternativeUrl
        }))
      });
    } catch (err) {
      console.error('Error loading videos on mobile:', err, { 
        isMobile, 
        isIOS, 
        userAgent,
        timestamp: new Date().toISOString()
      });
      setError(`Failed to load videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
