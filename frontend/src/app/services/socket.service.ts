import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface OrderAssignedEvent {
  orderId: string;
  product: string | null;
  details: string | null;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  /** Emits when the current worker is assigned a new order */
  orderAssigned$ = new Subject<OrderAssignedEvent>();

  /**
   * Connect to the backend WebSocket and join the user-specific room.
   * Call this once after login with the authenticated user's id.
   */
  connect(userId: string): void {
    if (this.socket?.connected) return;

    const url = (environment.apiUrl || 'http://localhost:3000').replace(/\/+$/, '');
    this.socket = io(url, { transports: ['websocket', 'polling'] });

    this.socket.on('connect', () => {
      this.socket!.emit('join', userId);
    });

    this.socket.on('order:assigned', (data: OrderAssignedEvent) => {
      this.orderAssigned$.next(data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
