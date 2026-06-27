import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-sprite-thumbnails';

interface VideoPlayerProps {
  options: any;
  onReady?: (player: any) => void;
  onRateChange?: (rate: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady, onRateChange }) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const onRateChangeRef = useRef(onRateChange);
  const isChangingSrcRef = useRef(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    onRateChangeRef.current = onRateChange;
  }, [onRateChange]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current?.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');

        if (optionsRef.current.playbackRate) {
          player.defaultPlaybackRate(optionsRef.current.playbackRate);
          player.playbackRate(optionsRef.current.playbackRate);
        }

        player.on('ratechange', () => {
          if (isChangingSrcRef.current) return;
          if (onRateChangeRef.current) onRateChangeRef.current(player.playbackRate());
        });

        player.on('loadeddata', () => {
          isChangingSrcRef.current = false;
          // Re-apply playback rate just in case the browser reset it
          const currentRate = optionsRef.current.playbackRate;
          if (currentRate && player.playbackRate() !== currentRate) {
             player.playbackRate(currentRate);
          }
        });

        // Extract base url to attempt loading the BunnyCDN preview sprite
        const src = optionsRef.current.sources?.[0]?.src;
        if (src && src.includes('b-cdn.net')) {
          const baseUrl = src.substring(0, src.lastIndexOf('/'));
          (player as any).spriteThumbnails({
            url: `${baseUrl}/preview.webp`,
            width: 160,
            height: 90,
            columns: 5, // Best guess for Bunny CDN default
            interval: 5
          });
        }

        onReady && onReady(player);
      });
    } else {
      const player = playerRef.current;
      player.autoplay(options.autoplay);
      
      const currentSrc = player.src();
      const newSrc = options.sources?.[0]?.src;
      
      if (newSrc && currentSrc !== newSrc) {
        isChangingSrcRef.current = true;
        
        if (options.playbackRate) {
          player.defaultPlaybackRate(options.playbackRate);
        }
        
        player.src(options.sources);
        
        if (newSrc.includes('b-cdn.net')) {
           const baseUrl = newSrc.substring(0, newSrc.lastIndexOf('/'));
           (player as any).spriteThumbnails({
             url: `${baseUrl}/preview.webp`,
             width: 160,
             height: 90,
             columns: 5,
             interval: 5
           });
        }
      }

      player.playbackRates(options.playbackRates || []);
      
      if (!isChangingSrcRef.current && options.playbackRate !== undefined && player.playbackRate() !== options.playbackRate) {
        player.playbackRate(options.playbackRate);
      }
    }
  }, [options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player style={{ width: '100%', height: '100%' }}>
      <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
export default VideoPlayer;
