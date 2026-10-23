import { IAccount, IAccountManager } from '../types/interfaces';
import { Account } from '../models/Account';
import { randomUUID } from 'crypto';

export class AccountManager implements IAccountManager {
  private readonly accounts: Map<string, IAccount> = new Map();

  public createAccount(name: string): IAccount {
    const id: string = this.generateAccountId();
    const account: IAccount = new Account(id, name);
    this.accounts.set(id, account);
    return account;
  }

  public getAccountById(id: string): IAccount | undefined {
    return this.accounts.get(id);
  }

  public getAllAccounts(): ReadonlyArray<IAccount> {
    return Array.from(this.accounts.values());
  }

  public deleteAccount(id: string): boolean {
    const account: IAccount | undefined = this.accounts.get(id);
    if (!account) {
      return false;
    }
    account.clearTransactions();
    return this.accounts.delete(id);
  }

  public generateAccountId(): string {
    return `acc-${randomUUID().slice(0, 8)}`;
  }

  public generateTransactionId(): string {
    return `txn-${randomUUID().slice(0, 8)}`;
  }
}
