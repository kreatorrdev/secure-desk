export type RetryValues = { company_name: string; phone: string; message: string };
export type RetryDetails = RetryValues & { request_id: string };
export type RetryState = { values?: RetryValues; errors?: Partial<Record<keyof RetryValues, string>>; message?: string };
