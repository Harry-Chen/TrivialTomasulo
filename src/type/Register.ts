import { ReservationStation } from './ReservationStation';
import { immerable } from 'immer';

export class Register {
  public [immerable] = true;
  public content: number = 0;
  public source: ReservationStation = null;
}
