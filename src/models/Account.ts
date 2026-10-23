import { IAccount, ITransaction } from '../types/interfaces';

export class Account implements IAccount {
  public readonly id: string;
  public readonly name: string;
  public readonly createdAt: Date;
  private readonly transactions: ITransaction[] = [];

  constructor(id: string, name: string, createdAt: Date = new Date()) {
    this.id = id;
    this.name = name;
    this.createdAt = createdAt;
  }

  public getBalance(): number {
    return this.transactions.reduce((sum: number, t: ITransaction): number => sum + t.signedAmount, 0);
  }

  public getTransactions(): ReadonlyArray<ITransaction> {
    return this.transactions;
  }

  public addTransaction(transaction: ITransaction): void {
    this.transactions.push(transaction);
  }

  public removeTransaction(transactionId: string): boolean {
    const index: number = this.transactions.findIndex(
      (t: ITransaction): boolean => t.id === transactionId,
    );
    if (index === -1) {
      return false;
    }
    this.transactions.splice(index, 1);
    return true;
  }

  public clearTransactions(): void {
    this.transactions.length = 0;
  }
}
