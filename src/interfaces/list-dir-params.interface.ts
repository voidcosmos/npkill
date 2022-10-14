export interface IListDirParams {
  path: string;
  target: string;
  exclude?: string[];
  excludeHiddenDirectories?: boolean;
}
