export class AuthError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = 'AuthError';

    if (stack) this.stack = stack;
  }
}

export class ForbiddenError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = 'ForbiddenError';

    if (stack) this.stack = stack;
  }
}

export class NotFoundError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = 'NotFoundError';

    if (stack) this.stack = stack;
  }
}

export class RatelimitError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = 'RatelimitError';

    if (stack) this.stack = stack;
  }
}

export class InternalServerError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = 'InternalServerError';

    if (stack) this.stack = stack;
  }
}

export class BadRequestError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = 'BadRequestError';

    if (stack) this.stack = stack;
  }
}
