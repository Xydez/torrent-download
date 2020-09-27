const gulp = require("gulp");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const webpack = require("webpack-stream");
const named = require("vinyl-named");
const del = require("del");

function cleanBin() {
    return del(["bin/"]);
}

function cleanDist() {
    return del(["dist/"]);
}

function typescript() {
    return tsProject.src()
        .pipe(tsProject()).js
        .pipe(gulp.dest("bin"));
}

function compress() {
    return gulp.src("./bin/*.js")
        .pipe(named())
        .pipe(webpack({ mode: "production", target: "node" }))
        .pipe(gulp.dest("dist/"));
}

exports.default = gulp.series(gulp.parallel(cleanBin, cleanDist), typescript, compress, cleanBin);
exports.clean = gulp.parallel(cleanBin, cleanDist);
exports.compile = gulp.series(gulp.parallel(cleanBin, cleanDist), typescript);
exports.compress = gulp.series(gulp.parallel(cleanBin, cleanDist), typescript, compress);