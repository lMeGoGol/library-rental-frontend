import { Book, mapBook } from './book.model';
import { User, mapUser } from './user.model';

export type LoanStatus = 'issued' | 'returned';

export interface Loan {
  id: string;
  book: Book | string;
  reader: User | string;
  issueDate?: string; 
  expectedReturnDate: string; 
  actualReturnDate?: string | null;
  rentPerDay: number;
  days: number;
  discountCategory?: string;
  discountPercent?: number;
  totalRent: number;
  deposit: number;
  penalty?: number;
  damageFee?: number;
  status: LoanStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueLoanDto {
  userId: string;
  bookId: string;
  days: number;
}

export interface ReturnLoanDto {
  damaged?: boolean;
  damageFee?: number;
}

export function mapLoan(raw: any): Loan {
  const book = raw.book ? (typeof raw.book === 'string' ? raw.book : mapBook(raw.book)) : (raw.bookId ?? raw.book);
  const reader = raw.reader ? (typeof raw.reader === 'string' ? raw.reader : mapUser(raw.reader)) : (raw.readerId ?? raw.reader);

  return {
    id: raw._id ?? raw.id,
    book,
    reader,
    issueDate: raw.issueDate,
    expectedReturnDate: raw.expectedReturnDate,
    actualReturnDate: raw.actualReturnDate ?? null,
    rentPerDay: Number(raw.rentPerDay),
    days: Number(raw.days),
    discountCategory: raw.discountCategory,
    discountPercent: raw.discountPercent ?? 0,
    totalRent: Number(raw.totalRent),
    deposit: Number(raw.deposit),
    penalty: raw.penalty ?? 0,
    damageFee: raw.damageFee ?? 0,
    status: (raw.status ?? 'issued') as LoanStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapLoans(rawArray: any[]): Loan[] {
  return (rawArray || []).map(mapLoan);
}
