
'use strict';

// Utilities
var  _ = require('lodash'),
    parseArgs = require('minimist'),
    gutil = require('gulp-util'),
    es = require('event-stream'),
    watch = require('gulp-watch'),
    fs = require('fs'),
    path = require('path'),
    del = require('del'),
    glob = require('glob'),
    source = require('vinyl-source-stream');

// Gulp Plugins
var sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint'),
    beautify = require('js-beautify'),
    connect = require('gulp-connect');

// Components without existing gulp plugins
var  browserify = require('browserify'),
    jsStylish = require('jshint-stylish');

module.exports = function(gulp, options){
    //***************//
    // Configuration //
    //***************//

    options = options || {};

    var pkg = {};
    if(options.pkg !== undefined) pkg = options.pkg;

    // This will be used to name the generated files (<name>.js and <name>.css)
    var name = pkg.name;
    if(options.name !== undefined) name = options.name;

    // SOURCE DIRECTORIES
    // JavaScript source code and unit tests.
    var jsSrc = './src/**/*.js';
    if(options.jsSrc !== undefined) jsSrc = options.jsSrc;

    // ENTRY POINTS
    var jsMain = './src/bpm.js';
    var name = 'app';
    if(options.jsMain !== undefined){
        jsMain = options.jsMain;
        name = path.basename(jsMain, '.js');
    }

    if(options.name !== undefined) name = options.name;

    var cssMain;
    if(options.cssMain !== undefined) cssMain = options.cssMain;

    var cssDisabled = false;
    if(cssMain === undefined) cssDisabled = true;

    // GENERATED DIRECTORIES
    var buildDir = './build';
    if(options.buildDir !== undefined) buildDir = options.buildDir;

    var distDir = './dist';
    if(options.distDir !== undefined) distDir = options.distDir;

    // DEFAULT COMPONENT CONFIGURATIONS
    var jsBeautifyConfig = _.merge(require('./config/defaultJSBeautifyConfig'), options.jsBeautifyConfig);
    var jsHintConfig = _.merge(require('./config/defaultJSHintConfig'), options.jsHintConfig);
    var connectConfig = _.merge(require('./config/defaultConnectConfig'), options.connectConfig);


    //*****************//
    // Local Variables //
    //*****************//
    var continuous = (process.argv.indexOf('dev') !== -1);
    var args = parseArgs(process.argv.slice(2));

    //*******************//
    // Convenience Tasks //
    //*******************//

    // The default task will run dist, which includes build, optimizations, tests,
    // lints, and generates coverage reports.
    gulp.task('default', ['dist']);

    // Builds an uniminfied version of the CSS and JavaScript files with embedded
    // source maps.
    var buildTasks = ['js'];
    if(!cssDisabled) buildTasks.push('css');
    gulp.task('build', buildTasks);

    // Builds minified versions of the CSS and JavaScript files with external
    // source maps.
    var buildMinTasks = ['js-min'];
    if(!cssDisabled) buildMinTasks.push('css-min');

    gulp.task('build-min', buildMinTasks);


    //*******************//
    // Development Tasks //
    //*******************//
    // Wipe out all generated files which are generated via build tasks.
    gulp.task('clean', ['clean-dist', 'clean-build']);

    gulp.task('clean-dist', function(done){
        del([distDir], done);
    });

    gulp.task('clean-build', function(done){
        del([buildDir], done);
    });

    // Incrementally build JavaScript and CSS files as they're modified and then
    // execute testing and linting tasks. Also starts a connect server which
    // reloads connected browsers whenever example or build dir changes contents.
    gulp.task('dev', ['example'], function() {
        gulp.watch([
            jsSrc
        ], ['js']);

        gulp.watch([
            jsSrc,
            'gulpfile.js'
        ], ['js-lint']);

        var config = _.assign({},
            {
                singleRun: false,
                autoWatch: true,
            });

        if(!config.files) config.files = [];

        config.files = config.files.concat([
            jsSrc
        ]);
    });

    gulp.task('server', ['build'], function(){
        if(continuous){
            connectConfig.livereload = true;
        } else {
            connectConfig.port = 3001;
        }

        if(args.port){
            connectConfig.port = args.port;
            connectConfig.livereload = { port: parseInt(args.port, 10) + 1 };
        }

        connect.server(connectConfig);
    });

    gulp.task('example', ['server'], function() {
        watch({
            glob: connectConfig.root.map(function(dir){ return dir + '/**/*'; })
        }).pipe(connect.reload());
    });


    // Creates a clean, full build with testing, linting, reporting and
    // minification then copies the results to the dist folder.
    gulp.task('dist', ['lint', 'build-min'],
        function() {
            return gulp.src([
                buildDir + '/**/*',
            ])
                .pipe(gulp.dest(distDir));
        });

    //*************************//
    // JavaScript Bundler Tasks //
    //*************************//

    // Deletes generated JS files (and source maps) from the build directory.
    gulp.task('clean-js', function(cb) {
        del([buildDir + '/**/*.js{,map}'], cb);
    });

    // Generates a JavaScript bundle of jsMain and its dependencies using
    // browserify in the build directory with an embedded sourcemap.
    gulp.task('js-scripts', ['clean-js'], function(){
        return browserify(jsMain)
            .bundle({
                debug: true,
                standalone: name
            })
            .pipe(source(path.basename(jsMain))) // gulpifies the browserify stream
            .pipe(rename(name + '.js'))
            .pipe(gulp.dest(buildDir));
    });

    gulp.task('js', ['js-scripts'], function() {
        return gulp.src([buildDir + '/' + name + '.js'])
            .pipe(sourcemaps.init())
            .pipe(concat(name + '.js'))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(buildDir));
    });

    // Generates a minified JavaScript bundle in the build directory with an
    // accompanying source map file.
    gulp.task('js-min', ['js', 'clean-dist'], function() {
        return gulp.src(buildDir + '/' + name + '.js')
            .pipe(sourcemaps.init())
            .pipe(uglify())
            .pipe(rename(name + '.min.js'))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(buildDir));
    });

    // Runs the JavaScript sources files through JSHint according to the options
    // set in jsHintConfig.
    var lintTasks = ['js-lint'];
    gulp.task('lint', lintTasks);

    // Runs the JavaScript source files via JSHint according to the options set in
    // jsHintConfig.
    gulp.task('js-lint', function() {
        var config = jsHintConfig;

        var pipe = gulp.src([
            jsSrc,
            'gulpfile.js'
        ])
            .pipe(jshint(jsHintConfig))
            .pipe(jshint.reporter(jsStylish));

        if (!continuous){
            pipe = pipe.pipe(jshint.reporter('fail'));
        }

        return pipe;
    });
};
