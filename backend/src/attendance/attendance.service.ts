import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Attendance } from './attendance.entity';
import { Person } from '../persons/person.entity';
import { PersonsService } from '../persons/persons.service';
import { TrackingModulesService } from '../tracking-modules/tracking-modules.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { findBestMatch } from './face-match.util';
import {
  RecognizeDto,
  ManualAttendanceDto,
  DeviceAttendanceDto,
} from './dto/attendance.dto';
import { Device } from '../devices/device.entity';
import { FaceService } from '../face/face.service';
import {
  AttendanceDirection,
  AttendanceStatus,
  ModuleType,
  PointageMethod,
} from '../common/enums';
import { TrackingModule } from '../tracking-modules/tracking-module.entity';

const DEFAULT_THRESHOLD = 0.55;

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
    private readonly personsService: PersonsService,
    private readonly modulesService: TrackingModulesService,
    private readonly realtime: RealtimeGateway,
    private readonly faceService: FaceService,
  ) {}

  /**
   * Pointage par image envoyée depuis une borne ESP32-CAM : le descripteur est
   * calculé côté serveur, puis comparé aux personnes enrôlées du module.
   */
  async recognizeFromImage(device: Device, image: Buffer) {
    const module = await this.modulesService.findOne(device.moduleId);
    let descriptor: number[] | null;
    try {
      descriptor = await this.faceService.descriptorFromImage(image);
    } catch (e: any) {
      if (e?.message === 'FACE_SERVER_UNAVAILABLE') {
        throw new ServiceUnavailableException(
          'Reconnaissance faciale serveur non disponible',
        );
      }
      throw e;
    }
    if (!descriptor) {
      throw new NotFoundException({
        message: 'Aucun visage détecté dans l’image',
        recognized: false,
      });
    }
    return this.matchAndRecord(module, descriptor, PointageMethod.FACE);
  }

  /** Pointage biométrique : identifie la personne puis enregistre le pointage. */
  async recognize(dto: RecognizeDto) {
    const module = await this.modulesService.findOne(dto.moduleId);

    // Anti-spoofing : si le module exige une preuve de vivacité, la borne
    // doit l'attester (clignement / mouvement détecté côté client).
    if (module.config?.requireLiveness && !dto.liveness) {
      throw new BadRequestException({
        message: 'Preuve de vivacité requise',
        livenessRequired: true,
      });
    }

    return this.matchAndRecord(
      module,
      dto.descriptor,
      PointageMethod.FACE,
      dto.direction,
    );
  }

  /**
   * Compare un descripteur aux personnes enrôlées du module et enregistre le
   * pointage de la meilleure correspondance. Mutualisé entre la borne web et
   * la reconnaissance serveur (ESP32-CAM).
   */
  async matchAndRecord(
    module: TrackingModule,
    descriptor: number[],
    method: PointageMethod,
    direction?: AttendanceDirection,
  ) {
    const threshold = module.config?.faceMatchThreshold ?? DEFAULT_THRESHOLD;
    const candidates = await this.personsService.findEnrolledByModule(
      module.id,
    );

    const match = findBestMatch(descriptor, candidates, threshold);
    if (!match) {
      throw new NotFoundException({
        message: 'Aucun visage correspondant trouvé',
        recognized: false,
      });
    }

    const confidence = Math.max(0, 1 - match.distance);
    return this.record(match.candidate, module, method, confidence, direction);
  }

  /**
   * Pointage émis par une borne ESP32 : badge RFID, empreinte ou code PIN.
   * Le module est celui rattaché à la borne.
   */
  async recordFromDevice(device: Device, dto: DeviceAttendanceDto) {
    return this.recordByIdentifier(device.moduleId, dto);
  }

  /**
   * Résout une personne dans un module via badge / code / empreinte, puis
   * enregistre le pointage. Utilisé par les bornes ESP32 et la borne web.
   */
  async recordByIdentifier(moduleId: string, dto: DeviceAttendanceDto) {
    const module = await this.modulesService.findOne(moduleId);

    let person: Person | null = null;
    switch (dto.method) {
      case PointageMethod.BADGE:
        if (!dto.identifier) {
          throw new BadRequestException('UID de badge manquant');
        }
        person = await this.personsService.findByBadge(
          module.id,
          dto.identifier,
        );
        break;
      case PointageMethod.CODE:
        if (!dto.identifier) {
          throw new BadRequestException('Code PIN manquant');
        }
        person = await this.personsService.findByPinCode(
          module.id,
          dto.identifier,
        );
        break;
      case PointageMethod.FINGERPRINT:
        if (dto.fingerprintId == null) {
          throw new BadRequestException("Index d'empreinte manquant");
        }
        person = await this.personsService.findByFingerprint(
          module.id,
          dto.fingerprintId,
        );
        break;
      default:
        throw new BadRequestException(
          `Méthode ${dto.method} non gérée par une borne`,
        );
    }

    if (!person) {
      throw new NotFoundException({
        message: 'Aucune personne ne correspond',
        recognized: false,
      });
    }

    return this.record(person, module, dto.method, 1, dto.direction);
  }

  /** Pointage manuel via sélection de la personne. */
  async manual(dto: ManualAttendanceDto) {
    const person = await this.personsService.findOne(dto.personId);
    const module = await this.modulesService.findOne(person.moduleId);
    return this.record(
      person,
      module,
      PointageMethod.MANUAL,
      1,
      dto.direction,
    );
  }

  private async record(
    person: Person,
    module: TrackingModule,
    method: PointageMethod,
    confidence: number,
    requestedDirection?: AttendanceDirection,
  ) {
    const direction =
      requestedDirection ??
      (await this.inferNextDirection(person.id, module));
    const status = this.computeStatus(module, direction);

    const attendance = this.repo.create({
      personId: person.id,
      moduleId: module.id,
      direction,
      status,
      method,
      confidence,
    });
    const saved = await this.repo.save(attendance);

    const payload = {
      id: saved.id,
      personId: person.id,
      personName: person.fullName,
      externalId: person.externalId,
      moduleId: module.id,
      moduleName: module.name,
      moduleType: module.type,
      direction: saved.direction,
      status: saved.status,
      method: saved.method,
      confidence: Number(confidence.toFixed(3)),
      timestamp: saved.timestamp,
    };

    this.realtime.emitAttendance(module.id, payload);
    return { recognized: true, attendance: payload };
  }

  /** Déduit s'il s'agit d'une entrée ou d'une sortie selon le dernier pointage du jour. */
  private async inferNextDirection(
    personId: string,
    module: TrackingModule,
  ): Promise<AttendanceDirection> {
    if (
      module.type === ModuleType.EVENT ||
      !module.config?.requireCheckout
    ) {
      return AttendanceDirection.IN;
    }
    const { start, end } = this.dayBounds();
    const last = await this.repo.findOne({
      where: { personId, timestamp: Between(start, end) },
      order: { timestamp: 'DESC' },
    });
    return last?.direction === AttendanceDirection.IN
      ? AttendanceDirection.OUT
      : AttendanceDirection.IN;
  }

  /** Calcule le statut (à l'heure / en retard / départ anticipé). */
  private computeStatus(
    module: TrackingModule,
    direction: AttendanceDirection,
  ): AttendanceStatus {
    if (module.type === ModuleType.EVENT) {
      return AttendanceStatus.PRESENT;
    }
    const now = new Date();

    if (direction === AttendanceDirection.IN && module.config?.startTime) {
      const limit = this.timeToDate(module.config.startTime, now);
      limit.setMinutes(
        limit.getMinutes() + (module.config.lateAfterMinutes ?? 0),
      );
      return now > limit ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME;
    }

    if (direction === AttendanceDirection.OUT && module.config?.endTime) {
      const limit = this.timeToDate(module.config.endTime, now);
      return now < limit
        ? AttendanceStatus.EARLY_LEAVE
        : AttendanceStatus.ON_TIME;
    }

    return AttendanceStatus.ON_TIME;
  }

  private timeToDate(hhmm: string, ref: Date): Date {
    const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
    const d = new Date(ref);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }

  private dayBounds(date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /** Liste filtrée des pointages. */
  async list(params: {
    moduleId?: string;
    personId?: string;
    date?: string;
  }): Promise<Attendance[]> {
    const where: Record<string, any> = {};
    if (params.moduleId) where.moduleId = params.moduleId;
    if (params.personId) where.personId = params.personId;
    if (params.date) {
      const { start, end } = this.dayBounds(new Date(params.date));
      where.timestamp = Between(start, end);
    }
    return this.repo.find({
      where: where as FindOptionsWhere<Attendance>,
      order: { timestamp: 'DESC' },
      take: 200,
    });
  }

  /** Statistiques du jour pour un module (ou tous modules confondus). */
  async stats(moduleId?: string) {
    const { start, end } = this.dayBounds();
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.timestamp BETWEEN :start AND :end', { start, end });
    if (moduleId) {
      qb.andWhere('a.moduleId = :moduleId', { moduleId });
    }
    const records = await qb.getMany();

    const uniquePresent = new Set(
      records
        .filter((r) => r.direction === AttendanceDirection.IN)
        .map((r) => r.personId),
    );

    return {
      total: records.length,
      present: uniquePresent.size,
      late: records.filter((r) => r.status === AttendanceStatus.LATE).length,
      checkIns: records.filter(
        (r) => r.direction === AttendanceDirection.IN,
      ).length,
      checkOuts: records.filter(
        (r) => r.direction === AttendanceDirection.OUT,
      ).length,
    };
  }
}
