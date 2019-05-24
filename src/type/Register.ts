import { ReservationStation } from './ReservationStation';
import { immerable } from 'immer';

export class Register {
  public [immerable] = true;
  public content: number = 0;
  public source: ReservationStation = null;
  public num: number = 0;

  constructor(num: number) {
    this.num = num;
  }
}
