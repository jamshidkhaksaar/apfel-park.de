export type ProductIntakeErrorCode =
  | 'bad_request'
  | 'conflict'
  | 'forbidden'
  | 'invalid_signature'
  | 'not_found'
  | 'stale_request'
  | 'state_conflict';

export class ProductIntakeError extends Error {
  readonly code: ProductIntakeErrorCode;
  readonly status: number;

  constructor(code: ProductIntakeErrorCode, message: string, status = 400) {
    super(message);
    this.name = 'ProductIntakeError';
    this.code = code;
    this.status = status;
  }
}
export class SchemaValidationError extends ProductIntakeError {
  readonly issues: string[];

  constructor(issues: string[]) {
    super('bad_request', issues.join('; '), 400);
    this.name = 'SchemaValidationError';
    this.issues = issues;
  }
}
