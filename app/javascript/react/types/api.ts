const enum StatusEnum {
  Idle = "IDLE",
  Pending = "PENDING",
  Fulfilled = "FULFILLED",
  Rejected = "REJECTED",
}

interface ApiError {
  message: string;
  additionalInfo?: Record<string, any>;
}

export { StatusEnum, ApiError };
