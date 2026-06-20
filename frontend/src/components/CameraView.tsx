import {
  CSSProperties,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Hls from 'hls.js';
import type { Camera } from '../types';

export interface CameraHandle {
  /** Élément média (img MJPEG ou video HLS) exploitable par face-api. */
  element: HTMLImageElement | HTMLVideoElement | null;
}

/**
 * Affiche le flux d'une caméra en direct selon son protocole.
 * - MJPEG : balise <img> (compatible ESP32-CAM, la plupart des caméras IP)
 * - HLS   : <video> piloté par hls.js
 * - WEBRTC: nécessite une passerelle dédiée (non géré ici)
 */
export const CameraView = forwardRef<CameraHandle, { camera: Camera }>(
  ({ camera }, ref) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        element:
          camera.streamType === 'MJPEG' ? imgRef.current : videoRef.current,
      }),
      [camera.streamType],
    );

    useEffect(() => {
      if (camera.streamType !== 'HLS' || !videoRef.current) return;
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: true });
        hls.loadSource(camera.streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError('Flux HLS indisponible');
        });
        return () => hls.destroy();
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari : HLS natif
        video.src = camera.streamUrl;
      }
    }, [camera.streamUrl, camera.streamType]);

    const style: CSSProperties = {
      width: '100%',
      aspectRatio: '16 / 9',
      objectFit: 'cover',
      borderRadius: 10,
      background: '#000',
    };

    if (camera.streamType === 'WEBRTC') {
      return (
        <div className="cam-placeholder" style={style}>
          WebRTC : passerelle requise
        </div>
      );
    }

    if (camera.streamType === 'MJPEG') {
      return (
        <img
          ref={imgRef}
          src={camera.streamUrl}
          alt={camera.name}
          crossOrigin="anonymous"
          style={style}
          onError={() => setError('Flux indisponible')}
        />
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <video ref={videoRef} autoPlay muted playsInline style={style} />
        {error && <div className="cam-error">{error}</div>}
      </div>
    );
  },
);

CameraView.displayName = 'CameraView';
