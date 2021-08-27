export interface PagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next?: string;
  offset: number;
  previous?: string;
  total: number;
}

export interface CursorPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string;
  cursors: { after: string; before: string };
  total: number;
}
