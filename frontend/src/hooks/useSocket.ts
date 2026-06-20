import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { AttendanceEvent } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

/**
 * Abonnement temps réel aux pointages. Optionnellement filtré par module.
 * Retourne le flux des derniers événements reçus.
 */
export function useAttendanceFeed(moduleId?: string) {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (moduleId) socket.emit('subscribe:module', moduleId);
    });
    socket.on('disconnect', () => setConnected(false));

    const onEvent = (e: AttendanceEvent) =>
      setEvents((prev) => [e, ...prev].slice(0, 50));

    socket.on('attendance:created', onEvent);

    return () => {
      socket.off('attendance:created', onEvent);
      socket.disconnect();
    };
    // Re-souscrit si le module change.
  }, [moduleId]);

  return { events, connected, setEvents };
}
