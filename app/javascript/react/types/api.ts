const enum StatusEnum {
  Idle = "IDLE",
  Pending = "PENDING",
  Fulfilled = "FULFILLED",
  Rejected = "REJECTED",
}

interface Error {
  message?: string;
}

export { StatusEnum, Error };
