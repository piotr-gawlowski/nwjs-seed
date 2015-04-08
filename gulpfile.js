var gulp = require('gulp'),
    sass = require('gulp-sass'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    cssmin = require('gulp-cssmin'),
    ngAnnotate = require('gulp-ng-annotate'),
    livereload = require('gulp-livereload'),
    prefix = require('gulp-autoprefixer'),
    exec = require('child_process').exec,
    sourcemaps = require('gulp-sourcemaps'),
    NodeWebkitBuilder = require('node-webkit-builder'),

    jsPath = 'src/js/**/*.js',
    htmlPath = 'frontend/**/*.html',
    sassPath = 'src/sass/style.scss';

gulp.task('build:binary', ['compile'], function(cb) {


    // Find out which modules to include
    var package = require('./package.json');
    var modules = []
    if (!!package.dependencies) {
        modules = Object.keys(package.dependencies)
            .filter(function (m) {
                return m != 'nodewebkit'
            })
            .map(function (m) {
                return './node_modules/' + m + '/**/*'
            })
    }

    //linux32, linux64, osx,
    var platforms = ['win64'];

    // Initialize NodeWebkitBuilder
    var nw = new NodeWebkitBuilder({
        files: ['./package.json', './frontend/**/*'].concat(modules),
        cacheDir: '../build/cache',
        platforms: platforms,
        checkVersions: true
    });

    nw.on('log', function (msg) {
        // Ignore 'Zipping... messages
        if (msg.indexOf('Zipping') !== 0) console.log(msg)
    });

    // Build!
    nw.build(function(err) {

        if (!!err) return console.error(err);

        // Handle ffmpeg for Windows
        if (platforms.indexOf('win') > -1) {
            gulp.src('./deps/ffmpegsumo/win/*')
                .pipe(gulp.dest(
                    './build/'+package.name+'/win'
                ))
        }

        // Handle ffmpeg for Mac
        if (platforms.indexOf('osx') > -1) {
            gulp.src('./deps/ffmpegsumo/osx/*')
                .pipe(gulp.dest(
                    './build/'+package.name+'/osx/node-webkit.app/Contents/Frameworks/node-webkit Framework.framework/Libraries'
                ))
        }

        // Handle ffmpeg for Linux32
        if (platforms.indexOf('linux32') > -1) {
            gulp.src('./deps/ffmpegsumo/linux32/*')
                .pipe(gulp.dest(
                    './build/'+package.name+'/linux32'
                ))
        }

        // Handle ffmpeg for Linux64
        if (platforms.indexOf('linux64') > -1) {
            gulp.src('./deps/ffmpegsumo/linux64/*')
                .pipe(gulp.dest(
                    './build/'+package.name+'/linux64'
                ))
        }

        cb(err);
    })
});


gulp.task('nwjs', function(cb){
    exec('nw .', function(err, out, outErr){
        console.log(out, outErr);
        cb(err);
    });
});

gulp.task('build:js', function(){
    gulp.src(jsPath)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat('app.js'))
        .pipe(ngAnnotate())
        .pipe(gulp.dest('frontend/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('frontend/js'))
        .pipe(livereload());
});

gulp.task('build:css', function(){
    gulp.src(sassPath)
        .pipe(sass({sourcemap: true, style: 'compact'}))
        .pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
        .pipe(cssmin())
        .pipe(gulp.dest('frontend/css'))
        .pipe(livereload());
});

gulp.task('build:html', function(){
    gulp.src(htmlPath)
        .pipe(livereload());
});

gulp.task('watch', function(){
    livereload.listen();
    gulp.watch(jsPath, ['build:js']);
    gulp.watch(sassPath, ['build:css']);
    gulp.watch(htmlPath, ['build:html']);
});




//just build the app for production
gulp.task('default', ['build:css', 'build:js']);

//run locally and develop
gulp.task('dev', ['build:css', 'build:js', 'nwjs', 'watch']);

gulp.task('build', ['build:css', 'build:js', 'build:binary']);