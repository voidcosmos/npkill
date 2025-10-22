import pc from 'picocolors';

export const OPTIONS_HINTS_BY_TYPE = {
  input: pc.gray(
    `${pc.bold(pc.underline('SPACE'))} or ${pc.bold(pc.underline('ENTER'))} to edit.`,
  ),
  'input-exit': pc.gray(
    `${pc.bold(pc.underline('ENTER'))} to confirm. ${pc.bold(pc.underline('ESC'))} To cancel.`,
  ),
  dropdown: pc.gray(
    `${pc.bold(pc.underline('SPACE'))}/${pc.bold(pc.underline('SHIFT'))}+${pc.bold(pc.underline('SPACE'))} to navigate.`,
  ),
  checkbox: pc.gray(
    `${pc.bold(pc.underline('SPACE'))} or ${pc.bold(pc.underline('ENTER'))} to toggle.`,
  ),
};
