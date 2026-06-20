import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Sonde de santé pour la supervision 24h/24 (Docker healthcheck,
 * load-balancer, monitoring externe).
 */
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    let db = 'up';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      db = 'down';
    }
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      time: new Date().toISOString(),
    };
  }
}
