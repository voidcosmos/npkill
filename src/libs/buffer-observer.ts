import { OperatorFunction, Observable, of } from 'rxjs';

class Buffer<T> {
  values = '';

  append(value: string) {
    this.values += value;
  }

  reset() {
    this.values = '';
  }
}

export function bufferObserve<T>(
  filter: (buffer: string) => boolean,
  resetNotifier: Observable<any> = of(),
): OperatorFunction<string, string> {
  return function (source$: Observable<string>): Observable<string> {
    let buffer = new Buffer<T>();

    return new Observable((observer) => {
      const resetNotifierSubscription = resetNotifier.subscribe(() =>
        buffer.reset(),
      );
      source$.subscribe({
        next: (value: string) => {
          buffer.append(value);

          if (filter(buffer.values)) {
            observer.next(buffer.values);
            buffer.reset();
          }
        },
        error: () => resetNotifierSubscription.unsubscribe(),
        complete: () => resetNotifierSubscription.unsubscribe(),
      });
    });
  };
}
