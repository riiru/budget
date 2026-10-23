import { ITransaction } from '../types/interfaces';
import { TransactionType, TransactionCategory } from '../types/enums';

export class Transaction implements ITransaction {
  public readonly id: string;
  public readonly type: TransactionType;
  public readonly amount: number;
  public readonly category: TransactionCategory;
  public readonly description: string;
  public readonly date: Date;

  constructor(params: {
    id: string;
    type: TransactionType;
    amount: number;
    category: TransactionCategory;
    description: string;
    date: Date;
  }) {
    this.id = params.id;
    this.type = params.type;
    this.amount = params.amount;
    this.category = params.category;
    this.description = params.description;
    this.date = params.date;
  }

  public get signedAmount(): number {
    return this.type === TransactionType.Income ? this.amount : -this.amount;
  }
}
