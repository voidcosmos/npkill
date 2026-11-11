import pc from 'picocolors';
import isUnicodeSupported from 'is-unicode-supported';
import { BAR_WIDTH } from '../../../../../constants/status.constants.js';
import { INFO_MSGS } from '../../../../../constants/messages.constants.js';

type Rgb = [number, number, number];

export interface StatusLoader {
  nextFrame(count: number): string;
}

interface Dot {
  color: Rgb;
  intensity: number;
}

interface Mark {
  age: number;
  energy: number;
}

interface Star {
  x: number;
  y: number;
  twinklePhase: number;
  fadingAge: number | null;
}

const DOT_ROWS = 4;
const INTENSITY_LEVELS = 16;
const BRAILLE_BLANK = 0x2800;
const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];
const BACKGROUND: Rgb = [18, 18, 22];
const WHITE: Rgb = [255, 255, 255];
const STAR_COLOR: Rgb = [170, 185, 230];

const SEARCH_CELLS = BAR_WIDTH - INFO_MSGS.SEARCHING.length;
const PENDING_CELLS = BAR_WIDTH - INFO_MSGS.CALCULATING_STATS.length;
const DOT_STEP_TICKS = 2;

const TRAIL_DOT_COLUMNS = SEARCH_CELLS * 2;
const TRAIL_LENGTH = 10;
const TRAIL_PAUSE_TICKS = 8;
const TRAIL_CYCLE_TICKS = TRAIL_DOT_COLUMNS + TRAIL_LENGTH + TRAIL_PAUSE_TICKS;
const TRAIL_COLORS: Rgb[] = [WHITE, [150, 190, 255], [80, 100, 230]];
const ERASE_BAND = 7;
const CLEAR_MARGIN = 2;
const ERASE_DECAY = 0.72;
const NATURAL_DECAY = 0.99;
const MIN_ENERGY = 0.05;
const MARK_FLASH_TICKS = 4;
const MARK_RESTING_BRIGHTNESS = 0.5;
const MAX_NEW_MARKS_PER_TICK = 6;

const STARS_DOT_COLUMNS = PENDING_CELLS * 2;
const MAX_STARS = Math.round(STARS_DOT_COLUMNS * DOT_ROWS * 0.32);
const STAR_FADE_TICKS = 4;
const TWINKLE_SPEED = 0.25;
const TWINKLE_BASE = 0.7;
const TWINKLE_AMPLITUDE = 0.3;

export function createSearchLoader(): StatusLoader {
  return isUnicodeSupported()
    ? new SonarTrailLoader()
    : new SweepingDotsLoader(SEARCH_CELLS);
}

export function createPendingLoader(): StatusLoader {
  return isUnicodeSupported()
    ? new PendingStarsLoader()
    : new SweepingDotsLoader(PENDING_CELLS);
}

class SweepingDotsLoader implements StatusLoader {
  private tick = -1;

  constructor(private readonly cells: number) {}

  nextFrame(): string {
    this.tick++;
    const step = Math.floor(this.tick / DOT_STEP_TICKS) % (this.cells * 2);
    if (step < this.cells) {
      return '.'.repeat(step + 1);
    }
    const erasedDots = step - this.cells + 1;
    return ' '.repeat(erasedDots) + '.'.repeat(this.cells - erasedDots);
  }
}

class SonarTrailLoader implements StatusLoader {
  private tick = -1;
  private seenResults = 0;
  private readonly marks = new Map<number, Mark>();

  nextFrame(resultsFound: number): string {
    this.tick++;
    const head = this.tick % TRAIL_CYCLE_TICKS;
    this.addMarks(resultsFound - this.seenResults, head);
    this.seenResults = resultsFound;
    this.decayMarks(head);
    const canvas = new BrailleCanvas(SEARCH_CELLS);
    this.marks.forEach((mark, position) => drawMark(canvas, position, mark));
    drawTrail(canvas, head);
    return canvas.render();
  }

  private addMarks(newResults: number, head: number): void {
    const marksToAdd = Math.min(newResults, MAX_NEW_MARKS_PER_TICK);
    for (let index = 0; index < marksToAdd; index++) {
      const position = Math.floor(Math.random() * TRAIL_DOT_COLUMNS * DOT_ROWS);
      if (!isInEraseBand(distanceAhead(position, head))) {
        this.marks.set(position, { age: 0, energy: 1 });
      }
    }
  }

  private decayMarks(head: number): void {
    for (const [position, mark] of this.marks) {
      mark.age++;
      mark.energy *= energyFactor(distanceAhead(position, head));
      if (mark.energy < MIN_ENERGY) {
        this.marks.delete(position);
      }
    }
  }
}

class PendingStarsLoader implements StatusLoader {
  private tick = -1;
  private initialPending: number | null = null;
  private stars = createStars();

  nextFrame(pending: number): string {
    this.tick++;
    this.initialPending ??= pending;
    this.ageFadingStars();
    this.fadeExcessStar(visibleCount(MAX_STARS, pending, this.initialPending));
    const canvas = new BrailleCanvas(PENDING_CELLS);
    this.stars.forEach((star) => this.drawStar(canvas, star));
    return canvas.render();
  }

  private ageFadingStars(): void {
    for (const star of this.stars) {
      if (star.fadingAge !== null) {
        star.fadingAge++;
      }
    }
    this.stars = this.stars.filter(
      (star) => star.fadingAge === null || star.fadingAge < STAR_FADE_TICKS,
    );
  }

  private fadeExcessStar(target: number): void {
    const shiningStars = this.stars.filter((star) => star.fadingAge === null);
    if (shiningStars.length > target) {
      const randomIndex = Math.floor(Math.random() * shiningStars.length);
      shiningStars[randomIndex].fadingAge = 0;
    }
  }

  private drawStar(canvas: BrailleCanvas, star: Star): void {
    if (star.fadingAge === null) {
      const twinkle = Math.sin(this.tick * TWINKLE_SPEED + star.twinklePhase);
      const brightness = TWINKLE_BASE + TWINKLE_AMPLITUDE * twinkle;
      canvas.plot(star.x, star.y, STAR_COLOR, brightness);
      return;
    }
    const fadeProgress = star.fadingAge / STAR_FADE_TICKS;
    const color = mix(WHITE, STAR_COLOR, fadeProgress);
    canvas.plot(star.x, star.y, color, 1 - fadeProgress);
  }
}

class BrailleCanvas {
  private readonly width: number;
  private readonly dots: Array<Dot | null>;

  constructor(private readonly cells: number) {
    this.width = cells * 2;
    this.dots = new Array<Dot | null>(this.width * DOT_ROWS).fill(null);
  }

  plot(x: number, y: number, color: Rgb, intensity: number): void {
    if (intensity <= 0) {
      return;
    }
    const index = y * this.width + x;
    const current = this.dots[index];
    if (current === null || current.intensity < intensity) {
      this.dots[index] = { color, intensity: Math.min(1, intensity) };
    }
  }

  render(): string {
    return Array.from({ length: this.cells }, (_, cell) =>
      this.renderCell(cell),
    ).join('');
  }

  private renderCell(cell: number): string {
    let bits = 0;
    let brightest: Dot | null = null;
    for (let row = 0; row < DOT_ROWS; row++) {
      for (let side = 0; side < 2; side++) {
        const dot = this.dots[row * this.width + cell * 2 + side];
        if (dot === null) {
          continue;
        }
        bits |= DOT_BITS[row][side];
        if (brightest === null || dot.intensity > brightest.intensity) {
          brightest = dot;
        }
      }
    }
    if (brightest === null) {
      return ' ';
    }
    const glyph = String.fromCharCode(BRAILLE_BLANK + bits);
    const intensity = quantize(brightest.intensity);
    return paint(glyph, mix(BACKGROUND, brightest.color, intensity));
  }
}

function visibleCount(
  total: number,
  pending: number,
  initialPending: number,
): number {
  if (initialPending === 0) {
    return 0;
  }
  return Math.ceil(total * Math.min(1, pending / initialPending));
}

function drawMark(
  canvas: BrailleCanvas,
  position: number,
  { age, energy }: Mark,
): void {
  const flash = Math.max(0, 1 - age / MARK_FLASH_TICKS);
  const brightness =
    energy * (MARK_RESTING_BRIGHTNESS + (1 - MARK_RESTING_BRIGHTNESS) * flash);
  const x = position % TRAIL_DOT_COLUMNS;
  const y = Math.floor(position / TRAIL_DOT_COLUMNS);
  canvas.plot(x, y, mix(STAR_COLOR, WHITE, flash), brightness);
}

function drawTrail(canvas: BrailleCanvas, head: number): void {
  for (let distance = 0; distance < TRAIL_LENGTH; distance++) {
    const column = head - distance;
    if (column < 0 || column >= TRAIL_DOT_COLUMNS) {
      continue;
    }
    const strength = 1 - distance / TRAIL_LENGTH;
    const color = gradient(TRAIL_COLORS, distance / (TRAIL_LENGTH - 1));
    const intensity = 0.25 + 0.75 * strength ** 1.5;
    for (const row of pickRandomRows(Math.ceil(DOT_ROWS * strength))) {
      canvas.plot(column, row, color, intensity);
    }
  }
}

function distanceAhead(position: number, head: number): number {
  const column = position % TRAIL_DOT_COLUMNS;
  return (column - head + TRAIL_CYCLE_TICKS) % TRAIL_CYCLE_TICKS;
}

function isInEraseBand(distance: number): boolean {
  return distance >= 1 && distance <= ERASE_BAND;
}

function energyFactor(distance: number): number {
  if (distance >= 1 && distance <= CLEAR_MARGIN) {
    return 0;
  }
  return isInEraseBand(distance) ? ERASE_DECAY : NATURAL_DECAY;
}

function createStars(): Star[] {
  const takenDots = new Set<number>();
  return Array.from({ length: MAX_STARS }, (_, index) => {
    const x = Math.floor(
      ((index + Math.random()) * STARS_DOT_COLUMNS) / MAX_STARS,
    );
    const y = pickRandomRows(DOT_ROWS).find(
      (row) => !takenDots.has(row * STARS_DOT_COLUMNS + x),
    ) as number;
    takenDots.add(y * STARS_DOT_COLUMNS + x);
    return {
      x,
      y,
      twinklePhase: Math.random() * Math.PI * 2,
      fadingAge: null,
    };
  });
}

function pickRandomRows(count: number): number[] {
  const rows = Array.from({ length: DOT_ROWS }, (_, row) => row);
  for (let index = rows.length - 1; index > 0; index--) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [rows[index], rows[swapWith]] = [rows[swapWith], rows[index]];
  }
  return rows.slice(0, count);
}

function gradient(stops: Rgb[], amount: number): Rgb {
  const position = clamp01(amount) * (stops.length - 1);
  const index = Math.min(Math.floor(position), stops.length - 2);
  return mix(stops[index], stops[index + 1], position - index);
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  const t = clamp01(amount);
  return from.map(
    (channel, index) => channel + (to[index] - channel) * t,
  ) as Rgb;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function quantize(intensity: number): number {
  return (
    Math.max(1, Math.round(intensity * INTENSITY_LEVELS)) / INTENSITY_LEVELS
  );
}

function paint(text: string, color: Rgb): string {
  if (!pc.isColorSupported) {
    return text;
  }
  const [red, green, blue] = color.map(Math.round);
  return `\x1b[38;2;${red};${green};${blue}m${text}\x1b[0m`;
}
