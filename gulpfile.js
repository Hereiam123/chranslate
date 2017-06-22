var gulp = require('gulp');
var uglify=require('gulp-uglify');
var rename = require('gulp-rename');
var pump=require('pump');
var cleanCss=require('gulp-clean-css');

gulp.task('compressJs',function(cb){
    pump(
        [gulp.src('public/javascripts/main.js'),
         uglify(),
         rename({ suffix: '.min' }),
         gulp.dest('public/javascripts')
        ],
        cb
    );
});

gulp.task('compressCss',function(cb){
    pump(
        [gulp.src('public/stylesheets/styles.css'),
         cleanCss(),
         rename({ suffix: '.min' }),
         gulp.dest('public/stylesheets')
        ],
        cb
    );
});

gulp.task('watch',function(){
    gulp.watch('public/javascripts/main.js',['compressJs']);
    gulp.watch('public/stylesheets/styles.css',['compressCss']);
});

gulp.task('default',['compressJs','compressCss','watch']);
