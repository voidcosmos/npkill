import * as https from 'node:https';

export class HttpsService {
  getJson(url: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      const fail = (err): void => {
        reject(err);
        return;
      };

      const request = https.get(url, (res) => {
        if (!this.isCorrectResponse(res.statusCode ?? -1)) {
          fail(res.statusMessage);
        }

        res.setEncoding('utf8');
        let body = '';
        res.on('data', (data) => {
          body += data;
        });
        res.on('end', () => {
          resolve(JSON.parse(body));
        });
      });

      request.on('error', (err) => fail(err));
    });
  }

  private isCorrectResponse(statusCode: number): boolean {
    const correctRangeStart = 200;
    const correctRangeEnd = 299;
    return statusCode >= correctRangeStart && statusCode <= correctRangeEnd;
  }
}
