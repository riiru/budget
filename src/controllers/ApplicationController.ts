import inquirer, { DistinctQuestion, ListChoiceOptions, Answers } from 'inquirer';
import { IAccount, ITransaction } from '../types/interfaces';
import { AccountManager } from '../managers/AccountManager';
import { Transaction } from '../models/Transaction';
import { CsvExporter } from '../utils/csvExporter';
import { ConsoleUi } from '../utils/console';
import {
  validateAccountName,
  validateAmount,
  validateDate,
  formatAmount,
  formatDate,
  ValidationResult,
} from '../utils/validators';
import {
  MainMenuAction,
  AccountAction,
  TransactionType,
  TransactionCategory,
} from '../types/enums';
import * as path from 'path';

type Choice<T> = ListChoiceOptions<Answers> & { value: T };

export class ApplicationController {
  private readonly manager: AccountManager = new AccountManager();
  private readonly csvExporter: CsvExporter = new CsvExporter();
  private readonly ui: ConsoleUi = new ConsoleUi();
  private readonly exportDir: string = path.join(process.cwd(), 'exports');
  private isRunning: boolean = true;

  public async run(): Promise<void> {
    this.ui.printHeader('Управление личными финансами');
    this.ui.printInfo('Консольное приложение на TypeScript + inquirer');

    while (this.isRunning) {
      await this.showMainMenu();
    }

    this.ui.clear();
    this.ui.printLine('До свидания!');
  }

  private async showMainMenu(): Promise<void> {
    this.ui.clear();
    this.ui.printHeader('Главное меню');
    this.printAccountsSummary();

    const answer: { action: MainMenuAction } = await this.prompt<{ action: MainMenuAction }>({
      type: 'list',
      name: 'action',
      message: 'Выберите действие:',
      choices: this.buildMainMenuChoices(),
    });

    switch (answer.action) {
      case MainMenuAction.ShowAccounts:
        await this.handleShowAccounts();
        break;
      case MainMenuAction.CreateAccount:
        await this.handleCreateAccount();
        break;
      case MainMenuAction.SelectAccount:
        await this.handleSelectAccount();
        break;
      case MainMenuAction.Exit:
        this.isRunning = false;
        break;
      default:
        break;
    }
  }

  private buildMainMenuChoices(): Choice<MainMenuAction>[] {
    const accountsCount: number = this.manager.getAllAccounts().length;
    return [
      {
        name: `Просмотреть список счетов (${accountsCount})`,
        value: MainMenuAction.ShowAccounts,
        short: 'Список счетов',
      },
      {
        name: 'Создать новый счёт',
        value: MainMenuAction.CreateAccount,
        short: 'Создание счёта',
      },
      {
        name: accountsCount > 0 ? 'Выбрать счёт для работы' : 'Выбрать счёт для работы (нет счетов)',
        value: MainMenuAction.SelectAccount,
        short: 'Выбор счёта',
        disabled: accountsCount === 0,
      },
      {
        name: 'Выход',
        value: MainMenuAction.Exit,
        short: 'Выход',
      },
    ];
  }

  private printAccountsSummary(): void {
    const accounts: ReadonlyArray<IAccount> = this.manager.getAllAccounts();
    if (accounts.length === 0) {
      this.ui.printInfo('Счета ещё не созданы. Создайте первый счёт.');
      return;
    }
    const totalBalance: number = accounts.reduce(
      (sum: number, a: IAccount): number => sum + a.getBalance(),
      0,
    );
    this.ui.printInfo(`Всего счетов: ${accounts.length}, общий баланс: ${formatAmount(totalBalance)}`);
  }

  private async handleShowAccounts(): Promise<void> {
    this.ui.clear();
    this.ui.printHeader('Список счетов');
    const accounts: ReadonlyArray<IAccount> = this.manager.getAllAccounts();

    if (accounts.length === 0) {
      this.ui.printInfo('Счетов пока нет.');
    } else {
      this.ui.printLine('ID            | Название                  | Баланс          | Транзакций');
      this.ui.printSeparator();
      for (const account of accounts) {
        const id: string = account.id.padEnd(13);
        const name: string = account.name.padEnd(25).slice(0, 25);
        const balance: string = formatAmount(account.getBalance()).padEnd(15);
        const count: number = account.getTransactions().length;
        this.ui.printLine(`${id} | ${name} | ${balance} | ${count}`);
      }
      this.ui.printSeparator();
    }

    await this.waitEnter();
  }

  private async handleCreateAccount(): Promise<void> {
    this.ui.clear();
    this.ui.printHeader('Создание нового счёта');

    const nameAnswer = await this.prompt<{ name: string }>({
      type: 'input',
      name: 'name',
      message: 'Введите название счёта:',
      validate: (input: string): boolean | string => {
        const result: ValidationResult = validateAccountName(input);
        return result.ok ? true : result.message;
      },
    });

    const account: IAccount = this.manager.createAccount(nameAnswer.name.trim());
    this.ui.printSuccess(`Счёт "${account.name}" создан. ID: ${account.id}`);
    await this.waitEnter();
  }

  private async handleSelectAccount(): Promise<void> {
    const accounts: ReadonlyArray<IAccount> = this.manager.getAllAccounts();
    if (accounts.length === 0) {
      this.ui.printError('Нет доступных счетов');
      await this.waitEnter();
      return;
    }

    const choices: Choice<string>[] = accounts.map((a: IAccount): Choice<string> => ({
      name: `${a.name}  (${formatAmount(a.getBalance())}, транзакций: ${a.getTransactions().length})`,
      value: a.id,
      short: a.name,
    }));

    const answer: { accountId: string } = await this.prompt<{ accountId: string }>({
      type: 'list',
      name: 'accountId',
      message: 'Выберите счёт:',
      choices,
    });

    await this.showAccountMenu(answer.accountId);
  }

  private async showAccountMenu(accountId: string): Promise<void> {
    let active: boolean = true;

    while (active) {
      const account: IAccount | undefined = this.manager.getAccountById(accountId);
      if (!account) {
        this.ui.printError('Счёт не найден');
        await this.waitEnter();
        return;
      }

      this.ui.clear();
      this.ui.printHeader(`Счёт: ${account.name}`);
      this.printAccountDetails(account);

      const answer: { action: AccountAction } = await this.prompt<{ action: AccountAction }>({
        type: 'list',
        name: 'action',
        message: 'Действие со счётом:',
        choices: this.buildAccountMenuChoices(account),
      });

      switch (answer.action) {
        case AccountAction.ViewTransactions:
          await this.handleViewTransactions(account);
          break;
        case AccountAction.AddTransaction:
          await this.handleAddTransaction(account);
          break;
        case AccountAction.DeleteTransaction:
          await this.handleDeleteTransaction(account);
          break;
        case AccountAction.ExportCsv:
          await this.handleExportCsv(account);
          break;
        case AccountAction.DeleteAccount:
          await this.handleDeleteAccount(account);
          active = false;
          break;
        case AccountAction.Back:
          active = false;
          break;
        default:
          break;
      }
    }
  }

  private buildAccountMenuChoices(account: IAccount): Choice<AccountAction>[] {
    const transactionsCount: number = account.getTransactions().length;
    return [
      {
        name: `Просмотреть транзакции (${transactionsCount})`,
        value: AccountAction.ViewTransactions,
        short: 'Транзакции',
      },
      {
        name: 'Добавить транзакцию',
        value: AccountAction.AddTransaction,
        short: 'Добавить',
      },
      {
        name: 'Удалить транзакцию',
        value: AccountAction.DeleteTransaction,
        short: 'Удалить транзакцию',
        disabled: transactionsCount === 0,
      },
      {
        name: 'Экспортировать в CSV',
        value: AccountAction.ExportCsv,
        short: 'Экспорт CSV',
      },
      {
        name: 'Удалить счёт',
        value: AccountAction.DeleteAccount,
        short: 'Удалить счёт',
      },
      {
        name: 'Назад в главное меню',
        value: AccountAction.Back,
        short: 'Назад',
      },
    ];
  }

  private printAccountDetails(account: IAccount): void {
    this.ui.printLine(`ID счёта:       ${account.id}`);
    this.ui.printLine(`Дата создания:  ${formatDate(account.createdAt)}`);
    this.ui.printLine(`Транзакций:     ${account.getTransactions().length}`);
    this.ui.printLine(`Баланс:         ${formatAmount(account.getBalance())}`);
    this.ui.printSeparator();
  }

  private async handleViewTransactions(account: IAccount): Promise<void> {
    this.ui.clear();
    this.ui.printHeader(`Транзакции счёта "${account.name}"`);

    const transactions: ReadonlyArray<ITransaction> = account.getTransactions();
    if (transactions.length === 0) {
      this.ui.printInfo('Транзакций пока нет.');
      await this.waitEnter();
      return;
    }

    const sorted: ITransaction[] = [...transactions].sort(
      (a: ITransaction, b: ITransaction): number => b.date.getTime() - a.date.getTime(),
    );

    this.ui.printLine('Дата            | Тип     | Категория       | Сумма          | Описание');
    this.ui.printSeparator();
    for (const t of sorted) {
      const date: string = formatDate(t.date).slice(0, 16).padEnd(15);
      const type: string = (t.type === TransactionType.Income ? 'Доход' : 'Расход').padEnd(8);
      const category: string = t.category.padEnd(15).slice(0, 15);
      const amount: string = formatAmount(t.signedAmount).padEnd(15);
      const description: string = t.description;
      this.ui.printLine(`${date} | ${type} | ${category} | ${amount} | ${description}`);
    }
    this.ui.printSeparator();
    this.ui.printLine(`Итоговый баланс: ${formatAmount(account.getBalance())}`);
    await this.waitEnter();
  }

  private async handleAddTransaction(account: IAccount): Promise<void> {
    this.ui.clear();
    this.ui.printHeader(`Добавление транзакции в "${account.name}"`);

    const typeAnswer: { type: TransactionType } = await this.prompt<{ type: TransactionType }>({
      type: 'list',
      name: 'type',
      message: 'Тип транзакции:',
      choices: [
        { name: 'Доход', value: TransactionType.Income },
        { name: 'Расход', value: TransactionType.Expense },
      ],
    });

    const categoryChoices: Choice<TransactionCategory>[] = (
      Object.values(TransactionCategory) as TransactionCategory[]
    ).map((c: TransactionCategory): Choice<TransactionCategory> => ({
      name: c,
      value: c,
      short: c,
    }));

    const categoryAnswer: { category: TransactionCategory } = await this.prompt<{
      category: TransactionCategory;
    }>({
      type: 'list',
      name: 'category',
      message: 'Категория:',
      choices: categoryChoices,
    });

    const amountAnswer: { amount: string } = await this.prompt<{ amount: string }>({
      type: 'input',
      name: 'amount',
      message: 'Сумма (в рублях):',
      validate: (input: string): boolean | string => {
        const result: ValidationResult = validateAmount(input);
        return result.ok ? true : result.message;
      },
    });

    const dateAnswer: { date: string } = await this.prompt<{ date: string }>({
      type: 'input',
      name: 'date',
      message: 'Дата (ГГГГ-ММ-ДД, пусто = сегодня):',
      default: '',
      validate: (input: string): boolean | string => {
        const result: ValidationResult = validateDate(input);
        return result.ok ? true : result.message;
      },
    });

    const descriptionAnswer: { description: string } = await this.prompt<{ description: string }>({
      type: 'input',
      name: 'description',
      message: 'Описание (необязательно):',
      default: '',
    });

    const transaction: ITransaction = new Transaction({
      id: this.manager.generateTransactionId(),
      type: typeAnswer.type,
      amount: Number(amountAnswer.amount),
      category: categoryAnswer.category,
      description: descriptionAnswer.description.trim() || 'Без описания',
      date: new Date(dateAnswer.date),
    });

    account.addTransaction(transaction);
    this.ui.printSuccess(`Транзакция добавлена. ID: ${transaction.id}`);
    await this.waitEnter();
  }

  private async handleDeleteTransaction(account: IAccount): Promise<void> {
    this.ui.clear();
    this.ui.printHeader(`Удаление транзакции из "${account.name}"`);

    const transactions: ReadonlyArray<ITransaction> = account.getTransactions();
    if (transactions.length === 0) {
      this.ui.printInfo('Транзакций для удаления нет.');
      await this.waitEnter();
      return;
    }

    const sorted: ITransaction[] = [...transactions].sort(
      (a: ITransaction, b: ITransaction): number => b.date.getTime() - a.date.getTime(),
    );

    const choices: Choice<string>[] = sorted.map((t: ITransaction): Choice<string> => ({
      name: `${formatDate(t.date).slice(0, 16)} | ${t.type === TransactionType.Income ? 'Доход' : 'Расход'} | ${formatAmount(t.signedAmount)} | ${t.description}`,
      value: t.id,
      short: 'Удаление транзакции',
    }));

    const selectAnswer: { transactionId: string } = await this.prompt<{ transactionId: string }>({
      type: 'list',
      name: 'transactionId',
      message: 'Выберите транзакцию для удаления:',
      choices,
    });

    const confirmAnswer: { confirmed: boolean } = await this.prompt<{ confirmed: boolean }>({
      type: 'confirm',
      name: 'confirmed',
      message: 'Удалить выбранную транзакцию?',
      default: false,
    });

    if (!confirmAnswer.confirmed) {
      this.ui.printInfo('Удаление отменено');
      await this.waitEnter();
      return;
    }

    const removed: boolean = account.removeTransaction(selectAnswer.transactionId);
    if (removed) {
      this.ui.printSuccess('Транзакция удалена');
    } else {
      this.ui.printError('Не удалось удалить транзакцию');
    }
    await this.waitEnter();
  }

  private async handleExportCsv(account: IAccount): Promise<void> {
    this.ui.clear();
    this.ui.printHeader(`Экспорт счёта "${account.name}" в CSV`);

    const result = this.csvExporter.export(account, this.exportDir);
    this.ui.printSuccess(`Экспортировано транзакций: ${result.rowsCount}`);
    this.ui.printInfo(`Файл сохранён: ${result.filePath}`);
    await this.waitEnter();
  }

  private async handleDeleteAccount(account: IAccount): Promise<void> {
    const confirmAnswer: { confirmed: boolean } = await this.prompt<{ confirmed: boolean }>({
      type: 'confirm',
      name: 'confirmed',
      message: `Удалить счёт "${account.name}" вместе со всеми транзакциями?`,
      default: false,
    });

    if (!confirmAnswer.confirmed) {
      this.ui.printInfo('Удаление отменено');
      await this.waitEnter();
      return;
    }

    const removed: boolean = this.manager.deleteAccount(account.id);
    if (removed) {
      this.ui.printSuccess(`Счёт "${account.name}" удалён`);
    } else {
      this.ui.printError('Не удалось удалить счёт');
    }
    await this.waitEnter();
  }

  private async waitEnter(): Promise<void> {
    await this.prompt<{ cont: string }>({
      type: 'input',
      name: 'cont',
      message: 'Нажмите Enter для продолжения...',
      default: '',
    });
  }

  private prompt<T extends Answers>(question: DistinctQuestion<T>): Promise<T> {
    return inquirer.prompt<T>(question as Parameters<typeof inquirer.prompt>[0]);
  }
}
