import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { AttendanceEvent, DeviceAlert, DeviceStatus } from '../types';

// En dev, VITE_SOCKET_URL=http://localhost:3001 (cf. .env.example).
// En production derrière un reverse-proxy, laisser vide => même origine.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

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

/**
 * Abonnement temps réel à l'état des bornes (supervision 24h/24).
 */
export function useDeviceStatus() {
  const [statuses, setStatuses] = useState<DeviceStatus[]>([]);
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    const onStatus = (s: DeviceStatus[]) => setStatuses(s);
    const onAlert = (a: DeviceAlert) =>
      setAlerts((prev) => [a, ...prev].slice(0, 20));
    socket.on('devices:status', onStatus);
    socket.on('devices:alert', onAlert);
    return () => {
      socket.disconnect();
    };
  }, []);

  return { statuses, alerts };
}
