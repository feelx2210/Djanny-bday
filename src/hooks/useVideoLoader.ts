
import { useState, useEffect } from 'react';

export interface VideoData {
  id: number;
  filename: string;
  username: string;
  description: string;
  videoUrl?: string;
}

export interface VideoWithUrl extends VideoData {
  videoUrl: string;
  alternativeUrl?: string;
  directUrl?: string; // For direct download without query params
}

export const useVideoLoader = () => {
  const [videos, setVideos] = useState<VideoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Enhanced mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  const createDropboxUrls = (originalUrl: string) => {
    if (!originalUrl.includes('dropbox.com')) {
      return { primary: originalUrl, fallback: originalUrl, direct: originalUrl };
    }

    // Extract the file ID and key from Dropbox URL
    const fileIdMatch = originalUrl.match(/\/scl\/fi\/([^\/]+)/);
    const rkeyMatch = originalUrl.match(/rlkey=([^&]+)/);
    const stMatch = originalUrl.match(/st=([^&]+)/);

    if (fileIdMatch && rkeyMatch) {
      const fileId = fileIdMatch[1];
      const rkey = rkeyMatch[1];
      const st = stMatch ? stMatch[1] : '';

      // Create different URL formats
      const baseParams = `rlkey=${rkey}${st ? `&st=${st}` : ''}`;
      const dlUrl = `https://www.dropbox.com/scl/fi/${fileId}?${baseParams}&dl=1`;
      const rawUrl = `https://www.dropbox.com/scl/fi/${fileId}?${baseParams}&raw=1`;
      const directUrl = `https://dl.dropboxusercontent.com/scl/fi/${fileId}?${baseParams}`;

      console.log('Created Dropbox URL variants:', {
        original: originalUrl,
        dl: dlUrl,
        raw: rawUrl,
        direct: directUrl,
        isMobile,
        isIOS,
        isAndroid
      });

      // For mobile, prefer direct download URLs
      if (isMobile) {
        return { 
          primary: directUrl, 
          fallback: rawUrl, 
          direct: dlUrl 
        };
      } else {
        return { 
          primary: dlUrl, 
          fallback: rawUrl, 
          direct: directUrl 
        };
      }
    }

    // Fallback to simple parameter replacement
    const rawUrl = originalUrl.replace('dl=1', 'raw=1');
    return { 
      primary: originalUrl, 
      fallback: rawUrl, 
      direct: originalUrl.replace('dropbox.com', 'dl.dropboxusercontent.com') 
    };
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading videos - Mobile platform:', { 
        isMobile, 
        isIOS, 
        isAndroid,
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
        const originalUrl = video.videoUrl || `${baseUrl}videos/${video.filename}`;
        const { primary, fallback, direct } = createDropboxUrls(originalUrl);
        
        console.log('Processing video for mobile:', {
          id: video.id,
          filename: video.filename,
          originalUrl,
          primaryUrl: primary,
          fallbackUrl: fallback,
          directUrl: direct,
          isMobile,
          platform: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'
        });
        
        return {
          ...video,
          videoUrl: primary,
          alternativeUrl: fallback !== primary ? fallback : undefined,
          directUrl: direct !== primary ? direct : undefined
        };
      });
      
      setVideos(videosWithUrls);
      console.log(`Successfully loaded ${videosWithUrls.length} videos with mobile optimizations`, { 
        isMobile, 
        isIOS,
        isAndroid,
        videosWithUrls: videosWithUrls.map(v => ({
          id: v.id,
          primaryUrl: v.videoUrl,
          alternativeUrl: v.alternativeUrl,
          directUrl: v.directUrl
        }))
      });
    } catch (err) {
      console.error('Error loading videos on mobile platform:', err, { 
        isMobile, 
        isIOS, 
        isAndroid,
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
