
import { useState, useEffect } from 'react';

export interface VideoData {
  id: number;
  filename: string;
  username: string;
  description: string;
}

export interface VideoWithUrl extends VideoData {
  videoUrl: string;
}

export const useVideoLoader = () => {
  const [videos, setVideos] = useState<VideoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('./videos.json');
      if (!response.ok) {
        throw new Error('Failed to load video metadata');
      }
      
      const data = await response.json();
      const videosWithUrls: VideoWithUrl[] = data.videos.map((video: VideoData) => ({
        ...video,
        videoUrl: `./videos/${video.filename}`
      }));
      
      setVideos(videosWithUrls);
      console.log(`Loaded ${videosWithUrls.length} videos from videos.json`);
    } catch (err) {
      console.error('Error loading videos:', err);
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
