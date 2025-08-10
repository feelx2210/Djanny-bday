
import { useEffect, useRef, useState, useCallback } from 'react';

interface PreloadedVideo {
  url: string;
  element: HTMLVideoElement;
  loaded: boolean;
  lastUsed: number;
}

interface VideoPool {
  available: HTMLVideoElement[];
  inUse: Map<string, HTMLVideoElement>;
}

// Detect mobile Safari for optimizations
const isMobileSafari = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS/.test(ua);
};

// Memory management constants
const MAX_PRELOADED_VIDEOS = isMobileSafari() ? 1 : 3;
const MAX_VIDEO_POOL_SIZE = isMobileSafari() ? 3 : 5;
const MEMORY_CLEANUP_INTERVAL = isMobileSafari() ? 10000 : 30000; // 10s on Mobile Safari, 30s elsewhere
const LRU_CLEANUP_THRESHOLD = 5; // Clean up after 5 videos loaded

export const useVideoPreloader = () => {
  const preloadedVideos = useRef<Map<string, PreloadedVideo>>(new Map());
  const videoPool = useRef<VideoPool>({ available: [], inUse: new Map() });
  const [preloadProgress, setPreloadProgress] = useState<Record<string, number>>({});
  const [memoryUsage, setMemoryUsage] = useState({ videoCount: 0, poolSize: 0 });
const loadingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const inFlightPreloads = useRef<Map<string, Promise<HTMLVideoElement>>>(new Map());
  const handlerCleanups = useRef<Map<string, () => void>>(new Map());
  const consecutiveFailures = useRef<number>(0);
  const circuitOpenUntil = useRef<number>(0);

  const isCircuitOpen = () => Date.now() < circuitOpenUntil.current;

  // Create video element with optimized settings
  const createVideoElement = useCallback((): HTMLVideoElement => {
    const video = document.createElement('video');
    
    // Mobile Safari optimizations
    if (isMobileSafari()) {
      video.preload = 'none'; // Minimal preloading for mobile Safari
      video.playsInline = true;
      video.muted = true;
      video.controls = false;
      video.crossOrigin = 'anonymous';
    } else {
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
    }
    
    return video;
  }, []);

  // Get video element from pool or create new one
  const getVideoFromPool = useCallback((): HTMLVideoElement => {
    if (videoPool.current.available.length > 0) {
      return videoPool.current.available.pop()!;
    }
    return createVideoElement();
  }, [createVideoElement]);

  // Return video element to pool
  const returnVideoToPool = useCallback((video: HTMLVideoElement, url: string) => {
    // Clean up the video element
    video.pause();
    video.src = '';
    video.removeAttribute('src');
    try { video.currentTime = 0; } catch {}
    video.load(); // This frees memory in most browsers
    
    // Remove from in-use tracking
    videoPool.current.inUse.delete(url);
    
    // Return to pool if not full
    if (videoPool.current.available.length < MAX_VIDEO_POOL_SIZE) {
      videoPool.current.available.push(video);
    }
    
    updateMemoryUsage();
  }, []);

  // Update memory usage stats
  const updateMemoryUsage = useCallback(() => {
    setMemoryUsage({
      videoCount: preloadedVideos.current.size,
      poolSize: videoPool.current.available.length + videoPool.current.inUse.size
    });
  }, []);

  // LRU cleanup for memory management
  const cleanupLRU = useCallback(() => {
    const entries = Array.from(preloadedVideos.current.entries());
    
    if (entries.length <= MAX_PRELOADED_VIDEOS) return;
    
    // Sort by last used time (oldest first)
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    // Remove oldest entries beyond limit
    const toRemove = entries.slice(0, entries.length - MAX_PRELOADED_VIDEOS);
    
    toRemove.forEach(([url, preloadedVideo]) => {
      console.log(`Cleaning up old preloaded video: ${url}`);
      returnVideoToPool(preloadedVideo.element, url);
      preloadedVideos.current.delete(url);
      setPreloadProgress(prev => {
        const updated = { ...prev };
        delete updated[url];
        return updated;
      });
    });
    
    updateMemoryUsage();
  }, [returnVideoToPool, updateMemoryUsage]);

  // Enhanced preload with retry logic, deduplication, and circuit breaker
  const preloadVideo = useCallback((url: string): Promise<HTMLVideoElement> => {
    // Short-circuit if circuit is open
    if (isCircuitOpen()) {
      return Promise.reject(new Error('Preload temporarily paused (circuit open)'));
    }

    // Already loaded
    const existing = preloadedVideos.current.get(url);
    if (existing?.loaded) {
      existing.lastUsed = Date.now();
      return Promise.resolve(existing.element);
    }

    // Deduplicate in-flight preloads
    const inFlight = inFlightPreloads.current.get(url);
    if (inFlight) return inFlight;

    const video = getVideoFromPool();
    videoPool.current.inUse.set(url, video);

    let retryCount = 0;
    const maxRetries = isMobileSafari() ? 1 : 2; // Fewer retries on mobile Safari

    const promise = new Promise<HTMLVideoElement>((resolve, reject) => {
      const handleCanPlay = () => {
        // Clear timeout
        const t = loadingTimeouts.current.get(url);
        if (t) {
          clearTimeout(t);
          loadingTimeouts.current.delete(url);
        }

        // Detach handlers
        const detach = handlerCleanups.current.get(url);
        detach?.();
        handlerCleanups.current.delete(url);

        preloadedVideos.current.set(url, {
          url,
          element: video,
          loaded: true,
          lastUsed: Date.now(),
        });

        setPreloadProgress(prev => ({ ...prev, [url]: 100 }));
        updateMemoryUsage();
        consecutiveFailures.current = 0; // reset on success
        inFlightPreloads.current.delete(url);
        resolve(video);
      };

      const handleError = (error: Event) => {
        console.warn(`Video load error (attempt ${retryCount + 1}):`, url, error);

        const t = loadingTimeouts.current.get(url);
        if (t) {
          clearTimeout(t);
          loadingTimeouts.current.delete(url);
        }

        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            video.src = url;
            video.load();
          }, delay);
        } else {
          const detach = handlerCleanups.current.get(url);
          detach?.();
          handlerCleanups.current.delete(url);

          returnVideoToPool(video, url);
          inFlightPreloads.current.delete(url);
          consecutiveFailures.current += 1;
          if (consecutiveFailures.current >= 2) {
            const cooldown = isMobileSafari() ? 15000 : 8000;
            circuitOpenUntil.current = Date.now() + cooldown;
          }
          reject(new Error(`Failed to preload video after ${maxRetries} attempts: ${url}`));
        }
      };

      const handleProgress = () => {
        if (video.buffered.length > 0 && video.duration) {
          const progress = (video.buffered.end(0) / video.duration) * 100;
          setPreloadProgress(prev => ({ ...prev, [url]: Math.round(progress) }));
        }
      };

      const handleLoadStart = () => {
        setPreloadProgress(prev => ({ ...prev, [url]: 0 }));
      };

      const detach = () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('progress', handleProgress);
        video.removeEventListener('loadstart', handleLoadStart);
      };

      handlerCleanups.current.set(url, detach);

      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.addEventListener('error', handleError);
      video.addEventListener('progress', handleProgress);
      video.addEventListener('loadstart', handleLoadStart, { once: true });

      video.src = url;
      video.load();

      // Set timeout for stuck loads
      const timeout = setTimeout(() => {
        console.warn(`Video loading timeout: ${url}`);

        const d = handlerCleanups.current.get(url);
        d?.();
        handlerCleanups.current.delete(url);

        returnVideoToPool(video, url);
        loadingTimeouts.current.delete(url);
        inFlightPreloads.current.delete(url);
        consecutiveFailures.current += 1;
        if (consecutiveFailures.current >= 2) {
          const cooldown = isMobileSafari() ? 15000 : 8000;
          circuitOpenUntil.current = Date.now() + cooldown;
        }
        reject(new Error(`Video loading timeout: ${url}`));
      }, isMobileSafari() ? 15000 : 10000);

      loadingTimeouts.current.set(url, timeout);
    });

    inFlightPreloads.current.set(url, promise);
    return promise;
  }, [getVideoFromPool, returnVideoToPool, updateMemoryUsage]);

  // Smart preloading with memory management
  const preloadVideos = useCallback(async (urls: string[]) => {
    if (isCircuitOpen()) {
      console.warn('Preload skipped (circuit open)');
      return [];
    }
    // Clean up old videos first
    cleanupLRU();
    
    // Limit concurrent preloads on mobile Safari
    const maxConcurrent = isMobileSafari() ? 1 : 2;
    const chunks = [];
    
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      chunks.push(urls.slice(i, i + maxConcurrent));
    }
    
    const results = [];
    
    for (const chunk of chunks) {
      const promises = chunk.map(url => 
        preloadVideo(url).catch(error => {
          console.warn(`Failed to preload ${url}:`, error);
          return null;
        })
      );
      
      const chunkResults = await Promise.allSettled(promises);
      results.push(...chunkResults);
      
      // Small delay between chunks on mobile Safari
      if (isMobileSafari() && chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }, [preloadVideo, cleanupLRU]);

  // Get preloaded video and update last used
  const getPreloadedVideo = useCallback((url: string): HTMLVideoElement | null => {
    const preloaded = preloadedVideos.current.get(url);
    if (preloaded?.loaded) {
      preloaded.lastUsed = Date.now();
      return preloaded.element;
    }
    return null;
  }, []);

  // Enhanced cleanup with memory management
  const clearPreloadedVideos = useCallback(() => {
    // Clear all timeouts
    loadingTimeouts.current.forEach(timeout => clearTimeout(timeout));
    loadingTimeouts.current.clear();
    
    // Return all videos to pool
    preloadedVideos.current.forEach((preloaded, url) => {
      returnVideoToPool(preloaded.element, url);
    });
    
    preloadedVideos.current.clear();
    setPreloadProgress({});
    updateMemoryUsage();
  }, [returnVideoToPool, updateMemoryUsage]);

  // Cleanup videos not in range (for memory management)
  const cleanupVideosNotInRange = useCallback((currentUrls: string[]) => {
    const urlSet = new Set(currentUrls);
    const toRemove: string[] = [];
    
    preloadedVideos.current.forEach((_, url) => {
      if (!urlSet.has(url)) {
        toRemove.push(url);
      }
    });
    
    toRemove.forEach(url => {
      const preloaded = preloadedVideos.current.get(url);
      if (preloaded) {
        console.log(`Cleaning up out-of-range video: ${url}`);
        returnVideoToPool(preloaded.element, url);
        preloadedVideos.current.delete(url);
        setPreloadProgress(prev => {
          const updated = { ...prev };
          delete updated[url];
          return updated;
        });
      }
    });
    
    updateMemoryUsage();
  }, [returnVideoToPool, updateMemoryUsage]);

  // Periodic memory cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupLRU();
      
      // Additional mobile Safari memory management
      if (isMobileSafari() && preloadedVideos.current.size > 1) {
        console.log('Mobile Safari: Aggressive memory cleanup');
        cleanupLRU();
      }
    }, MEMORY_CLEANUP_INTERVAL);
    
    return () => clearInterval(interval);
  }, [cleanupLRU]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreloadedVideos();
      
      // Clean up video pool
      videoPool.current.available.forEach(video => {
        video.src = '';
        video.load();
      });
      videoPool.current.available = [];
      videoPool.current.inUse.clear();
    };
  }, [clearPreloadedVideos]);

  return {
    preloadVideo,
    preloadVideos,
    getPreloadedVideo,
    clearPreloadedVideos,
    cleanupVideosNotInRange,
    preloadProgress,
    memoryUsage,
    isMobileSafari: isMobileSafari()
  };
};
