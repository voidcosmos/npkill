import gulp from 'gulp';
import ts from 'gulp-typescript';
import { deleteAsync as del } from 'del';
import { exec } from 'child_process';

function clean() {
  return del(['./lib']);
}

function typescript() {
  const tsProject = ts.createProject('tsconfig.json');
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('lib'));
}

function copyBin() {
  const files = ['./src/bin/windows-find.exe'];
  return gulp.src(files).pipe(gulp.dest('./lib/bin/'));
}

function copyTsConfig() {
  const files = ['./tsconfig.json'];
  return gulp.src(files).pipe(gulp.dest('./lib'));
}

async function buildGo() {
  const env = 'env GOOS=windows GOARCH=amd64';
  const filePath = './src/libs/file-service.go';
  const dest = './src/bin/windows-find.exe';
  // -ldflags "-s -w" reduce the final build
  const command = `${env} go build -ldflags "-s -w" -o ${dest} ${filePath}`;

  const buildGo = async () =>
    new Promise((resolve) => {
      const buildProcess = exec(command, (err) => {
        if (err) {
          throw err;
        }
      });
      buildProcess.on('exit', function () {
        resolve();
      });
    });

  const compressExe = async () =>
    new Promise((resolve) => {
      const compressProcess = exec(`upx --brute ${dest}`, (err) => {
        if (err) {
          throw err;
        }
      });
      compressProcess.on('exit', function () {
        resolve();
      });
    });

  await buildGo();
  await compressExe();
}

const buildAll = gulp.series(clean, typescript, copyBin, copyTsConfig);

gulp.task('default', buildAll);
gulp.task('buildGo', buildGo);
gulp.task('typescript', typescript);
