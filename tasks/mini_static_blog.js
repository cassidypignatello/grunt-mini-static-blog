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
    var langs = hljs.listLanguages();

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

    // Get matching files
    var posts = grunt.file.expand(options.src.posts + '*.md', options.src.posts + '*.markdown');
    var pages = grunt.file.expand(options.src.pages + '*.md', options.src.pages + '*.markdown');

    // Get Handlebars templates
    var postTemplate = Handlebars.compile(grunt.file.read(options.template.post));
    var pageTemplate = Handlebars.compile(grunt.file.read(options.template.page));
    var indexTemplate = Handlebars.compile(grunt.file.read(options.template.index));
    var notFoundTemplate = Handlebars.compile(grunt.file.read(options.template.notfound));

    // Generate posts
    var post_items = [];
    posts.forEach(function(file) {
      // Convert it to Markdown
      var content = grunt.file.read(file);
      var md = new MarkedMetadata(content);
      var mdcontent = md.html;
      var meta = md.meta;

      // Get path
      var permalink = '/blog/' + (file.replace(options.src.posts, '').replace(/(\d{4})-(\d{2})-(\d{2})-/, '$1/$2/$3').replace('.markdown', '').replace('.md', ''));
      var path = options.www.dest + permalink;

      // Render the Handlebars template with the content
      var data = {
        year: options.year,
        data: options.data,
        domain: options.domain,
        path: permalink + '/',
        meta: {
          title: meta.title.replace(/"/g, ''),
          date: meta.date,
          formattedDate: new Moment(new Date(meta.date)).format('Do MMMM YYYY h:mm a'),
          categories: meta.categories
        },
        post: {
          content: mdcontent,
          rawcontent: content
        }
      };
      post_items.push(data);
    });

    // Sort posts
    post_items = _.sortBy(post_items, function(item) {
      return item.meta.date;
    });

    // Get recent posts
    var recent_posts = post_items.slice(Math.max(post_items.length - 5, 1)).reverse();

    // Output them
    post_items.forEach(function(data, index, list) {
      // Get next and previous
      if (index < (list.length - 1)) {
        data.next = {
          title: list[index + 1].meta.title,
          path: list[index + 1].path
        };
      }

      // Get recent posts
      data.recent_posts = recent_posts;

      // Render template
      var output = postTemplate(data);

      // Write post to destination
      grunt.file.mkdir(options.www.dest + data.path);
      grunt.file.write(options.www.dest + data.path + '/index.html', output);
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
