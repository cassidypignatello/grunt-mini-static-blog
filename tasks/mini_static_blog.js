/*
 * grunt-mini-static-blog
 * https://github.com/cassidypignatello/grunt-mini-static-blog
 *
 * Copyright (c) 2015 Cassidy Pignatello
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('mini_static_blog', 'The best Grunt plugin ever.', function() {
    // Import external libraries
    var Handlebars = require('handlebars'),
      Moment = require('moment'),
      RSS = require('rss'),
      hljs = require('highlight.js'),
      MarkedMetadata = require('meta-marked'),
      _ = require('lodash'),
      parseUrl = require('url');

    // Declare variables
    var output, path;

    // Import options
    var options = this.options({
      year: new Date().getFullYear(),
      size: 5
    });
    options.domain = parseUrl.parse(options.data.url).hostname;

    // Register partials
    Handlebars.registerPartial({
      header: grunt.file.read(options.template.header),
      footer: grunt.file.read(options.template.footer)
    });

    // Get languages
    var langs = htljs.listLanguages();

    // Get Marked Metadata
    MarkedMetadata.setOptions({
      gfm: true,
      tables: true,
      smartLists: true,
      smartypants: true,
      langPrefix: 'hljs lang-',
      highlight: function (code, lang) {
        if (typeof lang !== "undefined" && langs.indexOf(lang) > 0) {
          return hljs.highlight(lang, code).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      }
    });

    /* Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', '
    }); */

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

};
