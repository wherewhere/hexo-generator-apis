/* global hexo */
"use strict";
/** @typedef {import("@types/hexo")} */
const generator = require("./lib/generator");
hexo.extend.generator.register("restful_api", site => generator(hexo, site));
