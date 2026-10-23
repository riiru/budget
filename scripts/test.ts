import { Account } from '../src/models/Account';
import { Transaction } from '../src/models/Transaction';
import { AccountManager } from '../src/managers/AccountManager';
import { TransactionType, TransactionCategory } from '../src/types/enums';
import { CsvExporter } from '../src/utils/csvExporter';
import * as path from 'path';
import * as fs from 'fs';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERT FAILED: ${message}`);
  }
  console.log('OK:', message);
}

function runTests(): void {
  const manager: AccountManager = new AccountManager();

  const account = manager.createAccount('Тестовый');
  assert(account.name === 'Тестовый', 'Имя счёта сохранено');
  assert(account.id.startsWith('acc-'), 'ID счёта имеет префикс acc-');
  assert(account.getBalance() === 0, 'Начальный баланс 0');
  assert(account.getTransactions().length === 0, 'Нет транзакций при создании');

  const txn1: Transaction = new Transaction({
    id: manager.generateTransactionId(),
    type: TransactionType.Income,
    amount: 1000,
    category: TransactionCategory.Salary,
    description: 'Зарплата',
    date: new Date('2025-01-10'),
  });
  account.addTransaction(txn1);
  assert(account.getBalance() === 1000, 'Баланс после дохода 1000');

  const txn2: Transaction = new Transaction({
    id: manager.generateTransactionId(),
    type: TransactionType.Expense,
    amount: 250.5,
    category: TransactionCategory.Food,
    description: 'Продукты',
    date: new Date('2025-01-11'),
  });
  account.addTransaction(txn2);
  assert(Math.abs(account.getBalance() - 749.5) < 0.001, 'Баланс после расхода 749.5');

  const removed: boolean = account.removeTransaction(txn1.id);
  assert(removed, 'Удаление существующей транзакции возвращает true');
  assert(Math.abs(account.getBalance() + 250.5) < 0.001, 'Баланс после удаления дохода -250.5');

  const notRemoved: boolean = account.removeTransaction('nonexistent');
  assert(!notRemoved, 'Удаление несуществующей транзакции возвращает false');

  const accounts = manager.getAllAccounts();
  assert(accounts.length === 1, 'В менеджере один счёт');

  const found = manager.getAccountById(account.id);
  assert(found === account, 'getAccountById возвращает тот же объект');

  const exporter: CsvExporter = new CsvExporter();
  const outputDir: string = path.join(__dirname, '..', 'exports');
  const result = exporter.export(account, outputDir);
  assert(fs.existsSync(result.filePath), 'CSV-файл создан');
  assert(result.rowsCount === 1, 'В CSV одна транзакция');
  console.log('CSV-файл:', result.filePath);

  account.clearTransactions();
  assert(account.getTransactions().length === 0, 'После clearTransactions список пуст');

  const deleted: boolean = manager.deleteAccount(account.id);
  assert(deleted, 'Удаление счёта возвращает true');
  assert(manager.getAllAccounts().length === 0, 'После удаления счёта список пуст');

  console.log('\nВсе тесты пройдены');
}

runTests();
