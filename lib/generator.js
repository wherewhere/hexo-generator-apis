/* global hexo */
"use strict";

const pagination = require("hexo-pagination");
const _pick = require("object.pick");

//#region Typedefs

/**
 * @typedef {Object} hexoPage
 * @property {string} title
 * @property {Object} date
 * @property {Object} updated
 * @property {boolean} comments
 * @property {string} layout
 * @property {string} content
 * @property {string} excerpt
 * @property {string} more
 * @property {string} source
 * @property {string} full_source
 * @property {string} path
 * @property {string} permalink
 * @property {?Object} prev
 * @property {?Object} next
 * @property {string} raw
 * @property {Array} photos
 * @property {string} link
 */

/**
 * @typedef {Object} hexoPost
 * @property {string} title
 * @property {Object} date
 * @property {Object} updated
 * @property {boolean} comments
 * @property {string} layout
 * @property {string} content
 * @property {string} excerpt
 * @property {string} more
 * @property {string} source
 * @property {string} full_source
 * @property {string} path
 * @property {string} permalink
 * @property {?Object} prev
 * @property {?Object} next
 * @property {string} raw
 * @property {Array} photos
 * @property {string} link
 * @property {boolean} published
 * @property {{name: string}[]} categories
 * @property {{name: string}[]} tags
 * /

/**
 * @typedef {Object} hexoIndex
 * @property {number} per_page
 * @property {number} total
 * @property {number} current
 * @property {string} current_url
 * @property {object} posts
 * @property {number} prev
 * @property {string} prev_link
 * @property {number} next
 * @property {string} next_link
 * @property {string} path
 */

/**
 * @typedef {Object} hexoArchive
 * @property {number} per_page
 * @property {number} total
 * @property {number} current
 * @property {string} current_url
 * @property {object} posts
 * @property {number} prev
 * @property {string} prev_link
 * @property {number} next
 * @property {string} next_link
 * @property {string} path
 * @property {boolean} archive
 * @property {number} year
 * @property {number} month
 * /

/**
 * @typedef {Object} hexoCategory
 * @property {number} per_page
 * @property {number} total
 * @property {number} current
 * @property {string} current_url
 * @property {hexoPost[]} posts
 * @property {number} prev
 * @property {string} prev_link
 * @property {number} next
 * @property {string} next_link
 * @property {string} path
 * @property {string} category
 * /

/**
 * @typedef {Object} hexoTag
 * @property {number} per_page
 * @property {number} total
 * @property {number} current
 * @property {string} current_url
 * @property {object} posts
 * @property {number} prev
 * @property {string} prev_link
 * @property {number} next
 * @property {string} next_link
 * @property {string} path
 * @property {string} tag
 * /

/**
 * @typedef {Object} hexoSite
 * @property {hexoPost[]} posts
 * @property {hexoPage[]} pages
 * @property {hexoCategory[]} categories
 * @property {hexoTag[]} tags
 */

/**
 * @typedef {Object} hexo
 * @property {hexoSite} site
 * @property {hexoPage} page
 * @property {Object} config
 * @property {{config: Object}} theme
 * @property {string} path
 * @property {string} url
 * @property {Object} env
 */

/**
 * @typedef {Object} posts_props
 * @property {boolean} title
 * @property {boolean} date
 * @property {boolean} updated
 * @property {boolean} comments
 * @property {boolean} url
 * @property {boolean} excerpt
 * @property {boolean} keywords
 * @property {boolean} cover
 * @property {boolean} content
 * @property {boolean} raw
 * @property {boolean} categories
 * @property {boolean} tags
 */

/**
 * @typedef {Object} search_all
 * @property {boolean} enable
 * @property {string} path
 * @property {boolean} cover
 * @property {boolean} excerpt
 * @property {boolean} content
 */

/**
 * @typedef {Object} restful_xapi
 * @property {boolean} site
 * @property {number} posts_size
 * @property {Object} posts_props
 * @property {boolean} categories
 * @property {boolean} tags
 * @property {boolean} post
 * @property {boolean} pages
 * @property {string[]} swipers_list
 * @property {search_all} search_all
 */

//#endregion

/**
 * @param {string} str
 */
function filterHTMLTags(str) {
  return str ? str
    .replace(/\<(?!img|br).*?\>/g, '')
    .replace(/\r?\n|\r/g, '')
    .replace(/<img(.*)>/g, " [Figure] ") : null;
}

/**
 * @param {string} str
 */
function fetchImages(str) {
  const imgURLs = [], rex = /<img[^>]+src="?([^"\s]+)"(.*)>/g;
  var temp;
  while (temp = rex.exec(str)) {
    imgURLs.push(temp[1]);
  }
  return imgURLs.length > 0 ? imgURLs : null;
}

/**
 * @param {string} str
 */
function getJsonPath(str) {
  var index = str.lastIndexOf('/');
  if (index == -1 || index == 0) {
    if (index == 0) {
      str = str.substring(1);
    }
    index = str.lastIndexOf('.');
    if (index == -1 || index == 0) {
      return str + ".json";
    }
    else {
      return str.substring(0, index) + ".json";
    }
  }
  else {
    return str.substring(0, index) + ".json";
  }
}

/**
 * @param {string} path
 * @param {string} data
 */
function createFile(path, data) {
  if (typeof (data) !== "undefined") {
    return {
      path: path,
      data: data
    };
  }
}

/**
 * @param {hexo} hexo
 * @param {hexoSite} site
 */
module.exports = function (hexo, site) {
  /**
   * @type {{keywords: string[], root: string, restful_xapi: restful_xapi, index_generator: ?{per_page: number}}}
   */
  const config = Object.assign({}, hexo.config, hexo.theme.config);

  /**
   * @type {restful_xapi}
   */
  const restful = Object.assign({
    site: [
      "title",
      "subtitle",
      "description",
      "author",
      "language",
      "timezone",
      "url",
      "keywords"
    ],
    posts_size: config.index_generator.per_page ?? 10,
    posts_props: {
      title: true,
      date: true,
      updated: true,
      comments: true,
      url: true,
      excerpt: false,
      keywords: false,
      cover: true,
      content: false,
      raw: false,
      categories: true,
      tags: true
    },
    categories: true,
    tags: true,
    post: true,
    pages: true,
    swipers_list: [],
    search_all: {
      enable: true,
      path: 'api/search.json',
      cover: true,
      excerpt: false,
      content: true
    }
  }, config.restful_xapi);

  /**
   * @typedef {{path: string, data: string}} api
   */

  /**
   * @type {api[]}
   */
  var apiData = [];

  if (!restful) {
    return apiData;
  }

  if (restful.site) {
    apiData.push(createFile(
      "api/site.json",
      JSON.stringify(restful.site instanceof Array ? _pick(config, restful.site) : config)
    ));
  }

  const posts = site.posts.sort("-date").filter(post => post.published);

  /**
   * @typedef {{perPage: number, data: {name: string, postlist: postMap[], api: string}}} cate
   */

  /**
   * @param {cate} item
   */
  function catesMap(item) {
    return {
      name: item.data.name,
      count: item.data.postlist.length,
      api: item.data.api
    };
  }

  /**
   * @param {cate} item
   */
  function cateMap(item) {
    const itemData = item.data;
    return createFile(
      itemData.api,
      JSON.stringify({
        name: itemData.name,
        postlist: itemData.postlist
      })
    );
  }

  /**
   * @typedef {Object} postMap
   * @property {string} title
   * @property {string} date
   * @property {string} updated
   * @property {number} comments
   * @property {string} url
   * @property {string} excerpt
   * @property {string[]} keywords
   * @property {string} cover
   * @property {string} content
   * @property {string} raw
   * @property {{name: string, api: string}[]} categories
   * @property {{name: string, api: string}[]} tags
   * @property {string} api
   */

  /**
   * @param {hexoPost} post
   */
  function postMap(post) {
    /**
     * @type {postMap}
     */
    var result = {};
    if (!!restful.posts_props) {
      /**
       * @param {string} name 
       * @param {string | Function} val 
       */
      function posts_props(name, val) {
        if (restful.posts_props[name]) {
          result[name] = typeof (val) === "function" ? val() : val;
        }
      }

      posts_props("title", post.title);
      posts_props("date", post.date);
      posts_props("updated", post.updated);
      posts_props("comments", post.comments);
      posts_props("url", post.path);
      posts_props("excerpt", () => filterHTMLTags(post.excerpt));
      posts_props("keywords", config.keywords);
      posts_props("cover", () => post.cover ?? post.banner);
      posts_props("content", post.content);
      posts_props("raw", post.raw);
      posts_props("categories", () => {
        return post.categories.map(cat => {
          return {
            name: cat.name,
            api: "api/categories/" + (cat.slug ?? cat.name) + ".json"
          };
        });
      });
      posts_props("tags", () => {
        return post.tags.map(tag => {
          return {
            name: tag.name,
            api: "api/tags/" + (tag.slug ?? tag.name) + ".json"
          };
        });
      });
      if (restful.post) {
        posts_props("api", () => "api/archives/" + getJsonPath(post.path));
      }
    }
    return result;
  }

  /**
   * @param {hexoCategory[]} cates
   * @param {string} kind
   * @returns {cate[]}
   */
  function cateReduce(cates, kind) {
    return cates.reduce((result, item) => {
      if (!item.length) {
        return result;
      }
      return result.concat(pagination(item.path, posts, {
        perPage: 0,
        data: {
          name: item.name,
          postlist: item.posts.map(postMap),
          api: "api/" + kind + '/' + (item.slug ?? item.name) + ".json"
        }
      }));
    }, []);
  }

  if (restful.categories) {
    const cates = cateReduce(site.categories, "categories");
    if (!!cates.length) {
      apiData.push(createFile(
        "api/categories.json",
        JSON.stringify(cates.map(catesMap)),
      ));
      apiData = apiData.concat(cates.map(cateMap));
    }
  }

  if (restful.tags) {
    const tags = cateReduce(site.tags, "tags");
    if (!!tags.length) {
      apiData.push(createFile(
        "api/tags.json",
        JSON.stringify(tags.map(catesMap))
      ));
      apiData = apiData.concat(tags.map(cateMap));
    }
  }

  const postlist = posts.map(postMap);

  if (restful.posts_size > 0) {
    /**
     * @type {{api}[]}
     */
    const page_posts = [],
      /**
       * @type {{index: number, count: number, api: string}[]}
       */
      pages_data = [],
      length = postlist.length,
      page_size = restful.posts_size,
      page_count = Math.ceil(length / page_size);

    for (var i = 0; i < length; i += page_size) {
      const index = Math.ceil((i + 1) / page_size);
      const path = "api/posts/" + index + ".json";
      const data = postlist.slice(i, i + page_size);
      page_posts.push(createFile(
        path,
        JSON.stringify({
          index: index,
          total: page_count,
          data: data
        })
      ));
      pages_data.push({
        index: index,
        count: data.length,
        api: path
      })
    }

    apiData.push(createFile(
      "api/posts.json",
      JSON.stringify({
        total: pages_data.length,
        posts: length,
        data: pages_data,
        api: "api/posts.json"
      })
    ));

    apiData = apiData.concat(page_posts);
  }
  else {
    apiData.push(createFile(
      "api/posts.json",
      JSON.stringify(postlist)
    ));
  }

  if (restful.post) {
    apiData = apiData.concat(posts.map(post => {
      const path = "api/archives/" + getJsonPath(post.path);
      return createFile(
        path,
        JSON.stringify({
          title: post.title,
          date: post.date,
          updated: post.updated,
          comments: post.comments,
          url: post.url,
          excerpt: filterHTMLTags(post.excerpt),
          cover: post.cover ?? post.banner,
          images: fetchImages(post.content),
          content: post.content,
          more: post.more,
          categories: post.categories.map(cat => {
            return {
              name: cat.name,
              api: "api/categories/" + (cat.name ?? cat.slug) + ".json"
            };
          }),
          tags: post.tags.map(tag => {
            return {
              name: tag.name,
              api: "api/tags/" + (tag.name ?? tag.slug) + ".json"
            };
          }),
          api: path
        })
      );
    }));
  }

  if (restful.pages) {
    /**
     * @type {{title: string, url: string, api: string}[]}
     */
    const pages = [];
    site.pages.data.forEach(page => {
      const path = "api/pages/" + getJsonPath(page.path);
      apiData.push(createFile(
        path,
        JSON.stringify({
          title: page.title,
          date: page.date,
          updated: page.updated,
          comments: page.comments,
          url: page.path,
          excerpt: filterHTMLTags(page.excerpt),
          cover: page.cover ?? page.banner,
          images: fetchImages(page.content),
          content: page.content,
          api: path
        })
      ));
      pages.push({
        title: page.title,
        url: page.path,
        api: path
      });
    });
    apiData.push(createFile(
      "api/pages.json",
      JSON.stringify(pages)
    ));
  }

  if (!!restful.swipers_list?.length) {
    const swipier = restful.swipers_list
    /**
     * @type {postMap[]}
     */
    const res = [];
    swipier.forEach(i => res.push(...postlist.filter(v => v.cover && v.slug == i)));
    apiData = apiData.push(createFile(
      "api/swiper.json",
      JSON.stringify(res)
    ));
  }

  if (!!restful.search_all?.enable) {
    const searchConfig = restful.search_all
    const postList = site.posts.sort("-date");
    /**
     * @type {temp_post[]}
     */
    const resource = [];
    if (postList) {
      postList.forEach(post => {
        if (post.indexing != undefined && !post.indexing) {
          return;
        }
        const temp_post = {};
        if (post.title) {
          temp_post.title = post.title
        }
        if (post.slug) {
          temp_post.slug = post.slug
        }
        if (post.path) {
          temp_post.url = config.root + post.path
        }
        if (searchConfig.content && post.content) {
          temp_post.content = post.content
        }
        if (searchConfig.cover && post.cover) {
          temp_post.cover = post.cover
        }
        if (searchConfig.excerpt && post.excerpt) {
          temp_post.excerpt = post.excerpt
        }
        if (post.tags && post.tags.length > 0) {
          /**
           * @type {string[]}
           */
          const tags = [];
          post.tags.forEach(tag => tags.push(tag.name));
          temp_post.tags = tags
        }
        if (post.categories && post.categories.length > 0) {
          /**
           * @type {string[]}
           */
          const categories = [];
          post.categories.forEach(cate => categories.push(cate.name));
          temp_post.categories = categories
        }
        resource.push(temp_post);
      })
    }
    apiData = apiData.concat(createFile(
      searchConfig.path,
      resource));
  }

  return apiData;
};
