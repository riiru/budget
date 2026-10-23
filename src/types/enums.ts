export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
}

export enum TransactionCategory {
  Salary = 'Зарплата',
  Food = 'Еда',
  Transport = 'Транспорт',
  Housing = 'Жильё',
  Entertainment = 'Развлечения',
  Health = 'Здоровье',
  Education = 'Образование',
  Shopping = 'Покупки',
  Other = 'Другое',
}

export enum MainMenuAction {
  ShowAccounts = 'show_accounts',
  CreateAccount = 'create_account',
  SelectAccount = 'select_account',
  Exit = 'exit',
}

export enum AccountAction {
  ViewTransactions = 'view_transactions',
  AddTransaction = 'add_transaction',
  DeleteTransaction = 'delete_transaction',
  ExportCsv = 'export_csv',
  DeleteAccount = 'delete_account',
  Back = 'back',
}
