import ansiEscapes from 'ansi-escapes';
import { Position, BaseUi } from '../ui/index.js';

export class UiService {
  stdin: NodeJS.ReadStream = process.stdin;
  // public stdout: NodeJS.WriteStream = process.stdout;
  uiComponents: BaseUi[] = [];

  setRawMode(set = true): void {
    this.stdin.setRawMode(set);
    process.stdin.resume();
  }

  setCursorVisible(visible: boolean): void {
    const instruction = visible
      ? ansiEscapes.cursorShow
      : ansiEscapes.cursorHide;
    this.print(instruction);
  }

  add(component: BaseUi): void {
    this.uiComponents.push(component);
  }

  renderAll(): void {
    this.clear();
    this.uiComponents.forEach((component) => {
      if (component.visible) {
        component.render();
      }
    });
  }

  clear(): void {
    this.print(ansiEscapes.clearTerminal);
  }

  print(text: string): void {
    process.stdout.write.bind(process.stdout)(text);
  }

  printAt(message: string, position: Position): void {
    this.setCursorAt(position);
    this.print(message);
  }

  setCursorAt({ x, y }: Position): void {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  clearLine(row: number): void {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }
}
