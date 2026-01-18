export interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
}

export interface MappedUser {
  id: string;
  displayName: string;
  email: string;
}

export function mapUser(db: DbUser | null): MappedUser | null {
  if (!db) return null;
  return {
    id: db.id,
    displayName: db.display_name ?? db.email,
    email: db.email,
  };
}
