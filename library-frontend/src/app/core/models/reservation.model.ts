export type ReservationStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface Reservation {
  id: string;
  book: string | { id: string; title?: string };
  reader: string | { id: string; username?: string };
  desiredDays: number;
  status: ReservationStatus;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservationDto {
  bookId: string;
  readerId?: string;
  desiredDays: number;
}

export function mapReservation(raw: any): Reservation {
  const norm = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (!obj.id && obj._id) {
      // ensure id present; keep other fields
      return { ...obj, id: obj._id };
    }
    return obj;
  };
  return {
    id: raw._id ?? raw.id,
    book: norm(raw.book ?? raw.bookId),
    reader: norm(raw.reader ?? raw.readerId),
    desiredDays: Number(raw.desiredDays),
    status: raw.status as ReservationStatus,
  cancelReason: raw.cancelReason,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapReservations(arr: any[]): Reservation[] {
  return (arr || []).map(mapReservation);
}
