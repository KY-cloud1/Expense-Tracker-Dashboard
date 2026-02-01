import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { UserSpending } from '../models/user-spending';
import { Card } from '../models/card';

@Injectable({
  providedIn: 'root',
})
export class UserSpendingDataService {

  private dataUrl = 'assets/db.json';

  constructor(private http: HttpClient) { }

  getUserSpending(): Observable<UserSpending> {
    return this.http.get<any>(this.dataUrl).pipe(
      map(data => {
        interface CardData {
          name: string;
          spending: number;
          limit: number;
          imageUrl: string;
        }

        // Convert the 'cards' objects into an array of Card instances safely
        const cards: Card[] = Object.values(data.cards)
          .filter(
            (c): c is CardData =>
              typeof c === 'object' &&
              c !== null &&
              'name' in c &&
              'spending' in c
          )
          .map(c => new Card(c.name, c.spending, c.limit, c.imageUrl));

        return new UserSpending(
          data.spending_ytd,
          data.spending_month,
          data.misc_spending_month,
          cards
        );
      })
    );
  }
}
