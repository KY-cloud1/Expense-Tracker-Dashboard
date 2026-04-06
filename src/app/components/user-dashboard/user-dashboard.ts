import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserSpending } from '../../models/user-spending';
import { Card } from '../../models/card'
import { UserSpendingDataService } from '../../services/user-spending-data';

/**
 * Dashboard component for displaying and managing user spending data.
 * Handles misc spending, card spending, card limits, and card payments.
 *
 * Note: This component uses manual change detection via ChangeDetectorRef
 * because HTTP observable callbacks run outside Angular's zone, meaning
 * automatic change detection does not pick up state updates from service responses.
 */
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboardComponent implements OnInit {

  userSpending?: UserSpending;
  today: Date = new Date();

  // Form control for the miscellaneous spending input field.
  miscValueControl = new FormControl(null);

  // Map of card key -> spending and limit form controls, one entry per card.
  // Populated dynamically on init once card data is loaded from the service.
  cardControls: Record<string, { spending: FormControl; limit: FormControl }> = {};

  constructor(
    private userSpendingDataService: UserSpendingDataService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userSpendingDataService.getUserSpendingSummary().subscribe({
      next: data => {
        // Initialize a pair of form controls for each card so the template
        // can bind to them before the @for loop renders.
        Object.entries(data.cards).forEach(([key, card]) => {
          this.cardControls[key] = {
            spending: new FormControl(null),
            limit: new FormControl(null)
          };
        });

        this.userSpending = data;
        this.cdr.detectChanges();
      },
      error: err => console.error('Error user-dashboard component init:', err)
    });
  }

  handleMiscSpendCancel(): void {
    this.miscValueControl.reset();
  }

  handleMiscSpendSubmit(): void {
    if (!this.userSpending) return;

    const miscUpdateDelta = Number(this.miscValueControl.value);

    // Reject non-numeric input and reset the field.
    if (isNaN(miscUpdateDelta)) {
      this.miscValueControl.reset();
      return;
    }

    const updatedMiscSpending = this.userSpending.misc_spend + miscUpdateDelta;
    const newTotalYtd = this.userSpending.spending_ytd + miscUpdateDelta;

    this.userSpendingDataService.updateMiscSpending(updatedMiscSpending, newTotalYtd)
      .subscribe({
        next: updatedValue => {
          this.userSpending = updatedValue;
          this.miscValueControl.reset();
          this.cdr.detectChanges();
        },
        error: err => console.error('handleMiscSubmit failed', err)
      });
  }

  /**
   * Returns the live misc spending preview, incorporating any value
   * currently typed in the input field before the user submits.
   */
  get miscSpendingDisplay(): number {
    if (!this.userSpending) return 0;

    const miscDelta = Number(this.miscValueControl.value ?? 0);
    return this.userSpending.misc_spend + miscDelta;
  }

  /**
   * Returns the list of cards as an array for template iteration.
   * Cards are stored as a keyed Record on userSpending to allow O(1)
   * lookup by key, but the template needs an array for @for.
   */
  get cardList(): Card[] {
    return Object.values(this.userSpending?.cards ?? {});
  }

  handleCardCancel(card: Card): void {
    this.cardControls[card.key].spending.reset();
    this.cardControls[card.key].limit.reset();
  }

  handleCardSpendSubmit(card: Card): void {
    if (!this.userSpending) return;

    const spendDelta = Number(this.cardControls[card.key].spending.value);

    // Reject non-numeric input and reset the field.
    if (isNaN(spendDelta)) {
      this.cardControls[card.key].spending.reset();
      return;
    }

    // Apply the delta on top of the current card spending.
    const updatedCards: Record<string, Card> = {
      ...this.userSpending.cards,
      [card.key]: {
        ...this.userSpending.cards[card.key],
        spending: this.userSpending.cards[card.key].spending + spendDelta
      }
    };

    const newTotalYtd = this.userSpending.spending_ytd + spendDelta;

    this.userSpendingDataService
      .updateCardSpending(updatedCards, newTotalYtd)
      .subscribe({
        next: updatedValue => {
          this.userSpending = updatedValue;
          this.cardControls[card.key].spending.reset();
          this.cdr.detectChanges();
        },
        error: err => console.error(err)
      });
  }

  /**
   * Returns the live card spending preview for a given card, incorporating
   * any value currently typed in the spending input field before submission.
   */
  cardSpendingDisplay(card: Card): number {
    if (!this.userSpending) return 0;

    const cardSpendDelta = Number(this.cardControls[card.key]?.spending.value ?? 0);
    return card.spending + cardSpendDelta;
  }

  handleCardLimitSubmit(card: Card): void {
    if (!this.userSpending) return;

    const limitDelta = Number(this.cardControls[card.key].limit.value);

    // Reject non-numeric input and reset the field.
    if (isNaN(limitDelta)) {
      this.cardControls[card.key].limit.reset();
      return;
    }

    // Apply the delta on top of the current card limit.
    const updatedCards: Record<string, Card> = {
      ...this.userSpending.cards,
      [card.key]: {
        ...this.userSpending.cards[card.key],
        limit: this.userSpending.cards[card.key].limit + limitDelta
      }
    };

    this.userSpendingDataService
      .updateCardLimit(updatedCards)
      .subscribe({
        next: updatedValue => {
          this.userSpending = updatedValue;
          this.cardControls[card.key].limit.reset();
          this.cdr.detectChanges();
        },
        error: err => console.error(err)
      });
  }

  /**
   * Returns the live card limit preview for a given card, incorporating
   * any value currently typed in the limit input field before submission.
   */
  cardLimitDisplay(card: Card): number {
    if (!this.userSpending) return 0;

    const cardLimitDelta = Number(this.cardControls[card.key]?.limit.value ?? 0);
    return card.limit + cardLimitDelta;
  }

  /** Resets a card's spending to 0, simulating a full payment. */
  handleCardPaid(card: Card): void {
    if (!this.userSpending) return;

    const updatedCards: Record<string, Card> = {
      ...this.userSpending.cards,
      [card.key]: {
        ...this.userSpending.cards[card.key],
        spending: 0
      }
    };

    this.userSpendingDataService
      .payCard(updatedCards)
      .subscribe({
        next: updatedValue => {
          this.userSpending = updatedValue;
          this.cardControls[card.key].spending.reset();
          this.cdr.detectChanges();
        },
        error: err => console.error(err)
      });
  }
}