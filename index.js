/* global hexo */
'use strict';
const generator = require('./lib/generator');
hexo.extend.generator.register('restful_api', site => generator(hexo, site));
