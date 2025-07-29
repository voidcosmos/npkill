import colors from 'colors';

export const OPTIONS_HINTS_BY_TYPE = {
  input: colors.gray(
    `${colors.bold.underline('SPACE')} or ${colors.bold.underline('ENTER')} to edit.`,
  ),
  'input-exit': colors.gray(
    `${colors.bold.underline('ENTER')} to confirm. ${colors.bold.underline('ESC')} To cancel.`,
  ),
  dropdown: colors.gray(
    `${colors.bold.underline('SPACE')}/${colors.bold.underline('SHIFT')}+${colors.bold.underline('SPACE')} to navigate.`,
  ),
  checkbox: colors.gray(
    `${colors.bold.underline('SPACE')} or ${colors.bold.underline('ENTER')} to toggle.`,
  ),
};
