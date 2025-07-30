import { IKeyPress } from '../interfaces/index.js';
import ansiEscapes from 'ansi-escapes';

export interface Position {
  x: number;
  y: number;
}

export interface InteractiveUi {
  onKeyInput: (key: IKeyPress) => void;
}

export abstract class BaseUi {
  public readonly id = Math.random().toString(36).substring(2, 10);
  public freezed = false;
  protected _position: Position;
  protected _visible = true;
  private readonly stdout: NodeJS.WriteStream = process.stdout;

  protected printAt(message: string, position: Position): void {
    this.setCursorAt(position);
    this.print(message);
  }

  protected setCursorAt({ x, y }: Position): void {
    this.print(ansiEscapes.cursorTo(x, y));
  }

  protected print(text: string): void {
    if (this.freezed) {
      return;
    }
    process.stdout.write.bind(process.stdout)(text);
  }

  protected clearLine(row: number): void {
    this.printAt(ansiEscapes.eraseLine, { x: 0, y: row });
  }

  setPosition(position: Position, renderOnSet = true): void {
    this._position = position;

    if (renderOnSet) {
      this.render();
    }
  }

  setVisible(visible: boolean, renderOnSet = true): void {
    this._visible = visible;

    if (renderOnSet) {
      this.render();
    }
  }

  get position(): Position {
    return this._position;
  }

  get visible(): boolean {
    return this._visible;
  }

  get terminal(): { columns: number; rows: number } {
    return {
      columns: this.stdout.columns,
      rows: this.stdout.rows,
    };
  }

  abstract render(): void;
}
