import gulp from 'gulp';
import ts from 'gulp-typescript';
import { deleteAsync as del } from 'del';

function clean() {
  return del(['./lib']);
}

function typescript() {
  const tsProject = ts.createProject('tsconfig.json');
  return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('lib'));
}

function copyTsConfig() {
  const files = ['./tsconfig.json'];
  return gulp.src(files).pipe(gulp.dest('./lib'));
}

const buildAll = gulp.series(clean, typescript, copyTsConfig);

gulp.task('default', buildAll);
gulp.task('typescript', typescript);
