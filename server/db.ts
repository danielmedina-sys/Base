// Re-export all database logic from api/_db.ts
// This guarantees ZERO dependencies on src/ in any backend file.
export * from '../api/_db.ts';
