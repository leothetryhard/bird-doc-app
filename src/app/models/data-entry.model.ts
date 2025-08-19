// src/app/core/models/data-entry.model.ts

// Interfaces for related models (e.g., Species, RingingStation)
export interface RingingStation {
  id: number;
  name: string;
  // other fields...
}

export interface StaffMember {
  id: number;
  username: string;
  // other fields...
}

export interface Species {
  id: number;
  german_name: string;
  scientific_name: string;
  code: string;
  // other fields...
}

// Main interface for the DataEntry model
export interface DataEntry{
  id?: number;
  ringing_station: number; // Foreign Key ID
  staff: number; // Foreign Key ID
  date_time: string; // ISO 8601 format
  species: number; // Foreign Key ID
  bird_status: BirdStatus;
  ring_number: string;
  net_location: string;
  net_height: NetHeight;
  net_direction: NetDirection;
  fat_deposit: FatDeposit;
  muscle_class: MuscleClass;
  age_class: AgeClass;
  sex: Sex;
  small_feather_int: SmallFeatherInt;
  small_feather_app: SmallFeatherApp;
  hand_wing: number | null;
  tarsus: number | null;
  feather_span: number | null;
  wing_span: number | null;
  weight_gram: number | null;
  notch_f2: number | null;
  inner_foot: number | null;
  comment: string | null;
}

// src/app/core/models/data-entry.model.ts (continued)

export enum BirdStatus {
  NEW = 'N',
  RECAPTURE = 'W',
  CONTROL = 'K',
}

export enum NetHeight {
  BODEN = 'B',
  MITTE = 'M',
  OBEN = 'O',
}

export enum NetDirection {
  NORD = 'N',
  OST = 'O',
  SUED = 'S',
  WEST = 'W',
}

export enum FatDeposit {
  NONE = '0',
  TRACE = '1',
  LITTLE = '2',
  HALF = '3',
  FULL = '4',
  BULGING = '5',
  GROSSLY_FAT = '6',
}

export enum MuscleClass {
  ZERO = '0',
  ONE = '1',
  TWO = '2',
  THREE = '3',
}

export enum AgeClass {
  PULLUS = '1',
  JUVENILE = '3',
  FIRST_YEAR = '3J',
  ADULT = '4',
  AFTER_FIRST_YEAR = '5',
}

export enum Sex {
  MALE = 'M',
  FEMALE = 'F',
  UNKNOWN = 'U',
}

export enum SmallFeatherInt {
  ZERO = '0',
  ONE = '1',
  TWO = '2',
  THREE = '3',
}

export enum SmallFeatherApp {
  ZERO = '0',
  ONE = '1',
  TWO = '2',
  THREE = '3',
}
