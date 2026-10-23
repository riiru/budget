export class ConsoleUi {
  public clear(): void {
    console.clear();
  }

  public printLine(text: string = ''): void {
    console.log(text);
  }

  public printHeader(title: string): void {
    const line: string = '─'.repeat(title.length + 4);
    console.log(`\n┌${line}┐`);
    console.log(`│  ${title}  │`);
    console.log(`└${line}┘`);
  }

  public printSeparator(): void {
    console.log('─────────────────────────────────────────────');
  }

  public printSuccess(message: string): void {
    console.log(`✓ ${message}`);
  }

  public printError(message: string): void {
    console.log(`✗ Ошибка: ${message}`);
  }

  public printInfo(message: string): void {
    console.log(`ℹ ${message}`);
  }

  public pause(): void {
    console.log('\nНажмите Enter для продолжения...');
  }
}
