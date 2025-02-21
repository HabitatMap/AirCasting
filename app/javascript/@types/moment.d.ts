import "moment";

declare module "moment" {
  interface Moment {
    tz(timezone: string): Moment;
  }

  interface MomentStatic {
    tz(date: Date | string | number, timezone: string): Moment;
  }
}

declare module "moment-timezone";
