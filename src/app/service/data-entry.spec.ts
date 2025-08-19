import { TestBed } from '@angular/core/testing';

import { DataEntry } from './data-entry';

describe('DataEntry', () => {
  let service: DataEntry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataEntry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
