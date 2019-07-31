import * as https from 'https';

export class HttpsService {
  get(url: string): Promise<{}> {
    return new Promise((resolve, rejects) => {
      https.get(url, res => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', data => {
          body += data;
        });
        res.on('end', () => {
          resolve(JSON.parse(body));
        });
      });
    });
  }
}
