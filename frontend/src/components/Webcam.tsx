import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface WebcamHandle {
  video: HTMLVideoElement | null;
}

/** Affiche le flux de la webcam. Expose l'élément <video> via la ref. */
export const Webcam = forwardRef<WebcamHandle, { className?: string }>(
  ({ className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({ video: videoRef.current }), []);

    useEffect(() => {
      let stream: MediaStream | null = null;
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((e) => console.error('Accès caméra refusé', e));

      return () => {
        stream?.getTracks().forEach((t) => t.stop());
      };
    }, []);

    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={className}
        style={{ width: '100%', borderRadius: 12, background: '#000' }}
      />
    );
  },
);

Webcam.displayName = 'Webcam';
