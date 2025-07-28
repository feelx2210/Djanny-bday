
import { useState, useEffect } from 'react';

export interface VideoData {
  id: number;
  filename: string;
  username: string;
  videoUrl?: string;
}

export interface VideoWithUrl extends VideoData {
  videoUrl: string;
}

export const useVideoLoader = () => {
  const [videos, setVideos] = useState<VideoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Mobile detection for debugging purposes
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading videos from Cloudinary - Mobile platform:', { 
        isMobile,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      const baseUrl = import.meta.env.BASE_URL;
      const videosJsonUrl = `${baseUrl}videos.json`;
      console.log('Fetching videos from:', videosJsonUrl);
      
      const response = await fetch(videosJsonUrl);
      if (!response.ok) {
        throw new Error(`Failed to load video metadata (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      const videosWithUrls: VideoWithUrl[] = data.videos.map((video: VideoData) => {
        const videoUrl = video.videoUrl || `${baseUrl}videos/${video.filename}`;
        
        console.log('Processing Cloudinary video:', {
          id: video.id,
          filename: video.filename,
          videoUrl,
          isMobile
        });
        
        return {
          ...video,
          videoUrl
        };
      });
      
      setVideos(videosWithUrls);
      console.log(`Successfully loaded ${videosWithUrls.length} videos from Cloudinary`, { 
        isMobile,
        videoCount: videosWithUrls.length
      });
    } catch (err) {
      console.error('Error loading videos:', err, { 
        isMobile,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      setError(`Failed to load videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // Auto-refresh every 5 minutes
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
