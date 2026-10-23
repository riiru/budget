import { TransactionType, TransactionCategory } from './enums';

export interface ITransaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly amount: number;
  readonly category: TransactionCategory;
  readonly description: string;
  readonly date: Date;
  readonly signedAmount: number;
}

export interface IAccount {
  readonly id: string;
  readonly name: string;
  readonly createdAt: Date;
  getBalance(): number;
  getTransactions(): ReadonlyArray<ITransaction>;
  addTransaction(transaction: ITransaction): void;
  removeTransaction(transactionId: string): boolean;
  clearTransactions(): void;
}

export interface IAccountManager {
  createAccount(name: string): IAccount;
  getAccountById(id: string): IAccount | undefined;
  getAllAccounts(): ReadonlyArray<IAccount>;
  deleteAccount(id: string): boolean;
  generateAccountId(): string;
  generateTransactionId(): string;
}

export interface ICsvExportResult {
  readonly filePath: string;
  readonly rowsCount: number;
}
