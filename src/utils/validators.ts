import { TransactionCategory, TransactionType } from '../types/enums';

export type ValidationResult = { ok: true; value: string } | { ok: false; message: string };

export function validateNonEmpty(input: string): ValidationResult {
  const trimmed: string = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Значение не может быть пустым' };
  }
  return { ok: true, value: trimmed };
}

export function validateAccountName(input: string): ValidationResult {
  const base: ValidationResult = validateNonEmpty(input);
  if (!base.ok) {
    return base;
  }
  if (base.value.length > 50) {
    return { ok: false, message: 'Название счёта не должно превышать 50 символов' };
  }
  return base;
}

export function validateAmount(input: string): ValidationResult {
  const trimmed: string = input.trim().replace(',', '.');
  if (trimmed.length === 0) {
    return { ok: false, message: 'Сумма не может быть пустой' };
  }
  const value: number = Number(trimmed);
  if (Number.isNaN(value)) {
    return { ok: false, message: 'Введите числовое значение' };
  }
  if (value <= 0) {
    return { ok: false, message: 'Сумма должна быть больше нуля' };
  }
  const rounded: number = Math.round(value * 100) / 100;
  return { ok: true, value: rounded.toFixed(2) };
}

export function validateDate(input: string): ValidationResult {
  const trimmed: string = input.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: new Date().toISOString() };
  }
  const parsed: Date = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, message: 'Некорректный формат даты (используйте ГГГГ-ММ-ДД)' };
  }
  if (parsed.getTime() > Date.now()) {
    return { ok: false, message: 'Дата не может быть в будущем' };
  }
  return { ok: true, value: parsed.toISOString() };
}

export function validateCategory(input: string): ValidationResult {
  const values: string[] = Object.values(TransactionCategory);
  if (!values.includes(input)) {
    return { ok: false, message: `Категория должна быть одной из: ${values.join(', ')}` };
  }
  return { ok: true, value: input };
}

export function validateTransactionType(input: string): ValidationResult {
  const values: string[] = Object.values(TransactionType);
  if (!values.includes(input)) {
    return { ok: false, message: `Тип должен быть одним из: ${values.join(', ')}` };
  }
  return { ok: true, value: input };
}

export function formatAmount(value: number): string {
  const sign: string = value >= 0 ? '+' : '-';
  const abs: number = Math.abs(value);
  return `${sign}${abs.toFixed(2)} ₽`;
}

export function formatDate(date: Date): string {
  const day: string = String(date.getDate()).padStart(2, '0');
  const month: string = String(date.getMonth() + 1).padStart(2, '0');
  const year: number = date.getFullYear();
  const hours: string = String(date.getHours()).padStart(2, '0');
  const minutes: string = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
