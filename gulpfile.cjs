const gulp = require('gulp');
const ts = require('gulp-typescript');
const del = require('del');
const exec = require('child_process');

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

function buildGo() {
  const env = 'env GOOS=windows GOARCH=amd64';
  const filePath = './src/utils';
  const dest = './src/bin/windows-find.exe';
  const command = `${env} go build -o ${dest} ${filePath}`;

  return new Promise((resolve) => {
    const buildProcess = exec(command, (err) => {
      if (err) {
        throw err;
      }
    });
    buildProcess.on('exit', function () {
      resolve();
    });
  });
}

const buildAll = gulp.series(clean, typescript, copyBin, copyTsConfig);

exports.default = buildAll;
exports.buildGo = buildGo;
exports.typescript = typescript;
