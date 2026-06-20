import { DevicesService, OFFLINE_THRESHOLD_MS } from './devices.service';
import { Device } from './device.entity';

describe('DevicesService.isOnline', () => {
  // isOnline ne touche pas au dépôt : on peut instancier sans repository réel.
  const service = new DevicesService(null as any);

  const make = (lastSeenAt: string | null): Device =>
    ({ lastSeenAt } as Device);

  it('hors ligne si aucun heartbeat', () => {
    expect(service.isOnline(make(null))).toBe(false);
  });

  it('en ligne juste après un heartbeat', () => {
    expect(service.isOnline(make(new Date().toISOString()))).toBe(true);
  });

  it('hors ligne au-delà du seuil', () => {
    const old = new Date(Date.now() - OFFLINE_THRESHOLD_MS - 1000).toISOString();
    expect(service.isOnline(make(old))).toBe(false);
  });
});
