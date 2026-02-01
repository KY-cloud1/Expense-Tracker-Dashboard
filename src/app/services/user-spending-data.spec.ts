import { TestBed } from '@angular/core/testing';

import { UserSpendingData } from './user-spending-data';

describe('UserSpendingData', () => {
  let service: UserSpendingData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSpendingData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
