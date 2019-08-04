'use strict';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const fs = require('fs');
const del = require('del');
const exec = require('child_process').exec;

function clean() {
  return del(['./lib']);
}

function typescript() {
  const tsProject = ts.createProject('tsconfig.json');
  return tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('lib'));
}

function copyBin() {
  const files = ['./src/bin/windows-find.exe'];
  return gulp.src(files).pipe(gulp.dest('./lib/bin/'));
}

function buildGo() {
  const env = 'env GOOS=windows GOARCH=amd64';
  const filePath = './src/utils';
  const dest = './src/bin/windows-find.exe';
  const command = `${env} go build -o ${dest} ${filePath}`;

  return new Promise((resolve, reject) => {
    const buildProcess = exec(command, (err, stdout, stderr) => {
      if (err) {
        throw err;
      }
    });
    buildProcess.on('exit', function() {
      resolve();
    });
  });
}

const buildAll = gulp.series(clean, typescript, copyBin);

exports.default = buildAll;
exports.buildGo = buildGo;
exports.typescript = typescript;
