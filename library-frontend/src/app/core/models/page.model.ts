export interface Page<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}
