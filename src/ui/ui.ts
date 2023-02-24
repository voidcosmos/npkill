import ansiEscapes from 'ansi-escapes';
import { IKeyPress } from 'src/interfaces';

export interface Position {
  x: number;
  y: number;
}

export interface InteractiveUi {
  onKeyInput(key: IKeyPress): void;
}

export abstract class Ui {
  public freeze = false;
  protected _position: Position;
  protected _visible = true;
  protected stdout: NodeJS.WriteStream = process.stdout;

  constructor() {}

  protected printAt(message: string, position: Position): void {
    this.setCursorAt(position);
    this.print(message);
  }

  protected setCursorAt({ x, y }: Position): void {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  protected print(text: string): void {
    if (this.freeze) {
      return;
    }
    process.stdout.write.bind(process.stdout)(text);
  }

  protected clearLine(row: number): void {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }

  setPosition(position: Position, renderOnSet = true) {
    this._position = position;

    if (renderOnSet) {
      this.render();
    }
  }

  setVisible(visible: boolean, renderOnSet = true) {
    this._visible = visible;

    if (renderOnSet) {
      this.render();
    }
  }

  get position() {
    return this._position;
  }

  get visible() {
    return this._visible;
  }

  abstract render(): void;
}
