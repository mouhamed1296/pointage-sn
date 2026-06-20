import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { UserRole } from './common/enums';

/**
 * Crée un compte administrateur au premier démarrage si la base est vide.
 * Identifiants configurables via les variables d'environnement ADMIN_*.
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const count = await this.usersService.count();
    if (count > 0) {
      return;
    }
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@pointage.sn');
    const password = this.config.get<string>('ADMIN_PASSWORD', 'changeme');
    const name = this.config.get<string>('ADMIN_NAME', 'Administrateur');

    await this.usersService.create({
      email,
      name,
      password,
      role: UserRole.ADMIN,
    });
    this.logger.log(
      `✅ Compte administrateur créé : ${email} (mot de passe : valeur de ADMIN_PASSWORD)`,
    );
  }
}
