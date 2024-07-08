export class AuthError extends Error {
  data: Record<string, unknown>;
  name = AuthError.name;

  constructor(
    message: string,
    extra: {
      stack?: string;
      data?: Record<string, unknown>;
    } = {}
  ) {
    super(message);

    if (extra.stack) this.stack = extra.stack;
    if (extra.data) this.data = extra.data;
  }
}

export class UnauthorizedError extends Error {
  public data: Record<string, unknown>;
  name = UnauthorizedError.name;

  constructor(
    public url: string,
    extra: {
      stack?: string;
      data?: Record<string, unknown>;
    } = {}
  ) {
    super('Unauthorized');
    if (extra.stack) this.stack = extra.stack;
    if (extra.data) this.data = extra.data;
  }
}

export class ForbiddenError extends Error {
  public data: Record<string, unknown>;
  name = ForbiddenError.name;

  constructor(
    public url: string,
    extra: {
      stack?: string;
      data?: Record<string, unknown>;
    } = {}
  ) {
    super('Forbidden, are you sure you have the right scopes?');

    if (extra.stack) this.stack = extra.stack;
    if (extra.data) this.data = extra.data;
  }
}

export class NotFoundError extends Error {
  name = NotFoundError.name;

  constructor(
    public url: string,
    public stack?: string
  ) {
    super('Not found');
  }
}

export class RatelimitError extends Error {
  public data: Record<string, unknown>;
  name = RatelimitError.name;

  constructor(
    message: string,
    public url: string,
    extra: {
      stack?: string;
      data?: Record<string, unknown>;
    } = {}
  ) {
    super(message);

    if (extra.stack) this.stack = extra.stack;
  }
}

export class BadRequestError extends Error {
  public data: Record<string, unknown>;
  name = BadRequestError.name;

  constructor(
    public url: string,
    extra: {
      stack?: string;
      data?: Record<string, unknown>;
    } = {}
  ) {
    super('Bad request');

    if (extra.stack) this.stack = extra.stack;
    if (extra.data) this.data = extra.data;
  }
}

export class RequestRetriesExceededError extends Error {
  constructor(
    message: string,
    public url: string,
    public readonly cause: unknown
  ) {
    super(message);
    this.name = 'RequestRetriesExceededError';
  }
}
