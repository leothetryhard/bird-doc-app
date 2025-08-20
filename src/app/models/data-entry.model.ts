export enum Direction {
  Left = 'L',
  Right = 'R',
}

export enum BirdStatus {
  FirstCatch = 'e',
  ReCatch = 'w',
}

export enum AgeClass {
  Nest = 1,
  Unknown = 2,
  ThisYear = 3,
  NotThisYear = 4,
  LastYear = 5,
  NotLastYear = 6,
}

export enum Sex {
  Unknown = 0,
  Male = 1,
  Female = 2,
}

export enum SmallFeatherIntMoult {
  None = 0,
  Some = 1,
  Many = 2,
}

export enum SmallFeatherAppMoult {
  Juvenile = 'J',
  Unmoulted = 'U',
  Mixed = 'M',
  New = 'N',
}

export enum HandWingMoult {
  None = 0,
  NoneOld = 1,
  AtLeastOne = 2,
  All = 3,
  Part = 4,
}

export enum MuscleClass {
  Null = 0,
  One = 1,
  Two = 2,
  Three = 3,
}

export interface DataEntry {
  id: string;
  species: string;
  ring: string;
  staff: number; // User ID
  ringing_station: string;
  net_location: number;
  net_height: number;
  net_direction: Direction;
  feather_span: number;
  wing_span: number;
  tarsus: number;
  notch_f2: number;
  inner_foot: number;
  weight_gram: number;
  bird_status: BirdStatus;
  fat_deposit: number | null;
  muscle_class: MuscleClass | null;
  age_class: AgeClass;
  sex: Sex;
  small_feather_int: SmallFeatherIntMoult | null;
  small_feather_app: SmallFeatherAppMoult | null;
  hand_wing: HandWingMoult | null;
  date_time: string;
  created: string;
  updated: string;
  comment: string;
}

// Helper for select options
export interface SelectOption<T> {
  value: T;
  viewValue: string;
}
