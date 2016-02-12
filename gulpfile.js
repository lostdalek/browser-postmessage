var gulp = require('gulp'),
    tasks = require('./gulp/tasks');

tasks(gulp, {
  pkg: require('./package.json'),
  jsMain: './src/bpm.js'
});



