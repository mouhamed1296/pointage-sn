import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Passerelle WebSocket : diffuse en temps réel les pointages vers les
 * tableaux de bord connectés. Les clients peuvent rejoindre une « room »
 * correspondant à un module pour ne recevoir que ses événements.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client déconnecté : ${client.id}`);
  }

  /** Un client (tableau de bord) s'abonne aux événements d'un module. */
  @SubscribeMessage('subscribe:module')
  onSubscribeModule(
    @ConnectedSocket() client: Socket,
    @MessageBody() moduleId: string,
  ) {
    client.join(`module:${moduleId}`);
    return { ok: true, room: `module:${moduleId}` };
  }

  @SubscribeMessage('unsubscribe:module')
  onUnsubscribeModule(
    @ConnectedSocket() client: Socket,
    @MessageBody() moduleId: string,
  ) {
    client.leave(`module:${moduleId}`);
    return { ok: true };
  }

  /** Émet un nouveau pointage à tous + à la room du module concerné. */
  emitAttendance(moduleId: string, payload: unknown) {
    this.server.emit('attendance:created', payload);
    this.server.to(`module:${moduleId}`).emit('attendance:module', payload);
  }
}
