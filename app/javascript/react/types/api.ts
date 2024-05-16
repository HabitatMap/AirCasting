const enum StatusEnum {
  Idle = "IDLE",
  Pending = "PENDING",
  Fulfilled = "FULFILLED",
  NoData = "NODATA",
  Rejected = "REJECTED",
}

interface Error {
  message?: string;
}

export { StatusEnum, Error };
