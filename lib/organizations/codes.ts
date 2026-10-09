export type CodeMetadata = { id: string; created_at: string; expires_at: string; is_usable: boolean };
export type CodeActionState = { message: string; changed?: boolean; id?: string | null; code?: string; expires_at?: string };
export type CodeEntryState = { message: string };
