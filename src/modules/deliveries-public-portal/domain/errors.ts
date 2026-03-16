export class PortalAuthError extends Error {
  constructor(message = 'invalid_or_expired_link') {
    super(message);
    this.name = 'PortalAuthError';
  }
}

export class PortalForbiddenError extends Error {
  constructor(message = 'forbidden') {
    super(message);
    this.name = 'PortalForbiddenError';
  }
}

export class PortalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalValidationError';
  }
}

export class PortalTransitionError extends Error {
  constructor(message = 'invalid_status_transition') {
    super(message);
    this.name = 'PortalTransitionError';
  }
}

export class PortalRateLimitError extends Error {
  constructor(message = 'rate_limit_exceeded') {
    super(message);
    this.name = 'PortalRateLimitError';
  }
}
