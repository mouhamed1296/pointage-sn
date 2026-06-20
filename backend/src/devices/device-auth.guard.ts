import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DevicesService } from './devices.service';

/**
 * Authentifie une borne à partir des en-têtes HTTP :
 *   X-Device-Id  : identifiant de la borne
 *   X-Device-Key : clé API secrète
 * En cas de succès, la borne est attachée à la requête (req.device) et son
 * heartbeat est mis à jour (utile pour la supervision 24h/24).
 */
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const id = req.headers['x-device-id'];
    const key = req.headers['x-device-key'];

    if (!id || !key) {
      throw new UnauthorizedException('Identifiants de borne manquants');
    }

    const device = await this.devicesService.authenticate(String(id), String(key));
    if (!device) {
      throw new UnauthorizedException('Borne non autorisée');
    }

    // Toute requête authentifiée vaut un signe de vie.
    await this.devicesService.heartbeat(device.id);
    req.device = device;
    return true;
  }
}
