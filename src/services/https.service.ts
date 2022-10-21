import * as https from 'https';

export class HttpsService {
  get(url: string): Promise<{}> {
    return new Promise((resolve, reject) => {
      const fail = (err) => {
        reject(err);
        return;
      };

      const request = https.get(url, (res) => {
        if (!this.isCorrectResponse(res.statusCode)) fail(res.statusMessage);

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
