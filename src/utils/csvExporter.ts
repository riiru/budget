import * as fs from 'fs';
import * as path from 'path';
import { IAccount, ICsvExportResult } from '../types/interfaces';

const CSV_DELIMITER: string = ';';

export class CsvExporter {
  public export(account: IAccount, outputDir: string): ICsvExportResult {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const safeName: string = account.name.replace(/[^\w\u0400-\u04FF-]+/g, '_');
    const timestamp: string = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName: string = `${safeName}_${timestamp}.csv`;
    const filePath: string = path.join(outputDir, fileName);

    const header: string = [
      'ID транзакции',
      'Тип',
      'Сумма',
      'Категория',
      'Описание',
      'Дата',
    ].join(CSV_DELIMITER);

    const rows: string[] = account.getTransactions().map((t) => {
      return [
        t.id,
        t.type,
        t.amount.toFixed(2),
        t.category,
        this.escapeCsvValue(t.description),
        t.date.toISOString(),
      ].join(CSV_DELIMITER);
    });

    const content: string = [header, ...rows].join('\n') + '\n';

    fs.writeFileSync(filePath, content, 'utf8');

    return {
      filePath,
      rowsCount: rows.length,
    };
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(CSV_DELIMITER) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
