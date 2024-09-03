import ErrnoException = NodeJS.ErrnoException;

export type IErrorCallback = (err?: ErrnoException) => void;
