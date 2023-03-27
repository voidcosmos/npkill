import * as https from 'node:https';

export class HttpsService {
  async getJson(url: string): Promise<Record<string, string>> {
    return await new Promise((resolve, reject) => {
      const fail = (err: string): void => {
        reject(err);
      };

      const request = https.get(url, (res) => {
        if (!this.isCorrectResponse(res.statusCode ?? -1)) {
          fail(res.statusMessage ?? 'Unknown error');
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

      request.on('error', (err) => fail(err.message));
    });
  }

  private isCorrectResponse(statusCode: number): boolean {
    const correctRangeStart = 200;
    const correctRangeEnd = 299;
    return statusCode >= correctRangeStart && statusCode <= correctRangeEnd;
  }
}
