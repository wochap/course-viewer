import videojs from 'video.js';
import React, { useEffect, useRef } from 'react';
import 'video.js/dist/video-js.css';
import 'videojs-sprite-thumbnails';
import 'videojs-contrib-quality-levels';
import 'videojs-contrib-quality-menu';

interface VideoPlayerProps {
  options: any;
  onReady?: (player: any) => void;
  onRateChange?: (rate: number) => void;
  onQualityChange?: (quality: string) => void;
  onTimeUpdate?: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady, onRateChange, onQualityChange, onTimeUpdate }) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const onRateChangeRef = useRef(onRateChange);
  const onQualityChangeRef = useRef(onQualityChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const isChangingSrcRef = useRef(false);
  const hasSetStartTimeRef = useRef(false);
  const optionsRef = useRef(options);
  const lastTimeUpdateRef = useRef<number>(0);

  useEffect(() => {
    onRateChangeRef.current = onRateChange;
  }, [onRateChange]);

  useEffect(() => {
    onQualityChangeRef.current = onQualityChange;
  }, [onQualityChange]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

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

        player.on('loadedmetadata', () => {
          if (!hasSetStartTimeRef.current && optionsRef.current.startTime) {
            player.currentTime(optionsRef.current.startTime);
            hasSetStartTimeRef.current = true;
          }
        });

        player.on('timeupdate', () => {
          if (isChangingSrcRef.current) return;
          const now = Date.now();
          if (now - lastTimeUpdateRef.current > 2000) {
            lastTimeUpdateRef.current = now;
            if (onTimeUpdateRef.current) {
              onTimeUpdateRef.current(player.currentTime());
            }
          }
        });

        player.on('loadeddata', () => {
          isChangingSrcRef.current = false;
          // Re-apply playback rate just in case the browser reset it
          const currentRate = optionsRef.current.playbackRate;
          if (currentRate && player.playbackRate() !== currentRate) {
             player.playbackRate(currentRate);
          }

          // Re-apply video quality
          const currentQuality = optionsRef.current.videoQuality;
          if (currentQuality && (player as any).qualityLevels) {
             const ql = (player as any).qualityLevels();
             if (currentQuality === 'Auto') {
               for (let i = 0; i < ql.length; i++) {
                 ql[i].enabled = true;
               }
             } else {
               const target = parseInt(currentQuality.replace('p', ''), 10);
               let found = false;
               for (let i = 0; i < ql.length; i++) {
                 if (ql[i].height === target) found = true;
               }
               if (found) {
                 for (let i = 0; i < ql.length; i++) {
                   ql[i].enabled = (ql[i].height === target);
                 }
               } else {
                 for (let i = 0; i < ql.length; i++) {
                   ql[i].enabled = true;
                 }
               }
             }
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

        if ((player as any).qualityMenu) {
           (player as any).qualityMenu({
               defaultResolution: optionsRef.current.videoQuality || 'Auto',
           });
           
           const updateQuality = () => {
             const ql = (player as any).qualityLevels();
             if (!ql || ql.length === 0) return;
             
             let allEnabled = true;
             let enabledHeight = null;
             let enabledCount = 0;
             for (let i = 0; i < ql.length; i++) {
                 if (!ql[i].enabled) {
                     allEnabled = false;
                 } else {
                     enabledHeight = ql[i].height;
                     enabledCount++;
                 }
             }
             
             if (allEnabled) {
                 if (onQualityChangeRef.current) onQualityChangeRef.current('Auto');
             } else if (enabledHeight && enabledCount > 0 && enabledCount < ql.length) {
                 if (onQualityChangeRef.current) onQualityChangeRef.current(enabledHeight + 'p');
             }
           };

           // We wait a tiny bit after click since the plugin updates the enabled flags on click
           player.on('click', () => {
             setTimeout(updateQuality, 50);
           });
           (player as any).qualityLevels().on('change', updateQuality);
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
        hasSetStartTimeRef.current = false;
        
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
