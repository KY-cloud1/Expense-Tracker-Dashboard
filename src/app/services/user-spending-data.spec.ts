import { TestBed } from '@angular/core/testing';

import { UserSpendingDataService } from './user-spending-data';

describe('UserSpendingDataService', () => {
  let service: UserSpendingDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSpendingDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
