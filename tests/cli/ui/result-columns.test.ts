import { getColumnLayout } from '../../../src/cli/ui/components/result-columns.js';

describe('result columns layout', () => {
  it('moves the age column one character to the right', () => {
    const layout = getColumnLayout(
      [
        { id: 'age', width: 4, label: 'Age' },
        { id: 'size', width: 9, label: 'Size' },
      ],
      80,
    );

    expect(layout.firstColumnX).toBe(66);
    expect(layout.positions[0]).toMatchObject({
      column: { id: 'age' },
      x: 66,
    });
    expect(layout.headerText).toBe(' Age    Size ');
  });

  it('keeps a right margin when stats columns are hidden', () => {
    const layout = getColumnLayout([], 80);

    expect(layout.firstColumnX).toBe(79);
    expect(layout.pathReservedWidth).toBe(2);
  });
});
