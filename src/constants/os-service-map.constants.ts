import {
  LinuxFilesService,
  WindowsFilesService,
  MacFilesService,
} from '../core/services/files/index.js';

/**
 * A mapping of operating system names to their corresponding file service classes.
 * This map is used to dynamically instantiate the appropriate file service based on the OS.
 */
export const OSServiceMap = {
  linux: LinuxFilesService,
  win32: WindowsFilesService,
  darwin: MacFilesService,
};
