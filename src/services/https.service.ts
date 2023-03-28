import * as https from 'node:https';

export class HttpsService {
  async getJson(url: string): Promise<Record<string, string>> {
    return await new Promise((resolve, reject) => {
      const fail = (err: Error): void => {
        reject(err);
      };

      const request = https.get(url, (res) => {
        if (!this.isCorrectResponse(res.statusCode ?? -1)) {
          const error = new Error(res.statusMessage ?? 'Unknown error');
          fail(error);
          return;
        }

        res.setEncoding('utf8');
        let body = '';
        res.on('data', (data: string) => {
          body += data;
        });
        res.on('end', () => {
          resolve(JSON.parse(body));
        });
      });

      request.on('error', (error) => fail(error));
    });
  }

  private isCorrectResponse(statusCode: number): boolean {
    const correctRangeStart = 200;
    const correctRangeEnd = 299;
    return statusCode >= correctRangeStart && statusCode <= correctRangeEnd;
  }
}
