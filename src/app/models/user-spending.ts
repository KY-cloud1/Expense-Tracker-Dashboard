import { Card } from './card';

export class UserSpending {
    constructor(
        public spending_ytd: number,
        public spending_month: number,
        public misc_spending_month: number,
        public cards: Card[]
    ) {}
}
