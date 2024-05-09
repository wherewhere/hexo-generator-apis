/* global hexo */
"use strict";

const pagination = require("hexo-pagination");
const _pick = require("object.pick");

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
  const index = str.lastIndexOf('/');
  const dir = str.substring(0, index);
  return dir + ".json";
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
 * @param {any} hexo
 * @param {{posts: []}} site
 */
module.exports = function (hexo, site) {
  const deffig = {
    site: false,
    posts_size: config.index_generator.per_page ?? 10,
    posts_props: {
      title: true,
      date: true,
      updated: true,
      comments: true,
      path: true,
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
  };

  /**
   * @type {{restful_xapi: any}}
   */
  const config = Object.assign({}, hexo.config, hexo.theme.config);

  /**
   * @type {deffig}
   */
  const restful = Object.assign(deffig, config.restful_xapi);

  /**
   * @type {Array<{path: string, data: string}>}
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

  function catesMap(item) {
    return {
      name: item.data.name,
      path: item.data.path,
      count: item.data.postlist.length
    };
  }

  function cateMap(item) {
    const itemData = item.data;
    return createFile(
      itemData.path,
      JSON.stringify({
        name: itemData.name,
        postlist: itemData.postlist
      })
    );
  }

  function postMap(post) {
    /**
     * @type {{title: string, date: string, updated: string, comments: number, path: string, excerpt: string, keywords: string, cover: string, content: string, raw: string, categories: {name: string, path: string}[], tags: {name: string, path: string}[]}}
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
      posts_props("path", () => "api/archives/" + getJsonPath(post.path));
      posts_props("excerpt", () => filterHTMLTags(post.excerpt));
      posts_props("keywords", config.keywords);
      posts_props("cover", () => post.cover ?? post.banner);
      posts_props("content", post.content);
      posts_props("raw", post.raw);
      posts_props("categories", () => {
        return post.categories.map(cat => {
          return {
            name: cat.name,
            path: "api/categories/" + (cat.slug ?? cat.name) + ".json"
          };
        });
      });
      posts_props("tags", () => {
        return post.tags.map(tag => {
          return {
            name: tag.name,
            path: "api/tags/" + (tag.slug ?? tag.name) + ".json"
          };
        });
      });
    }
    return result;
  }

  function cateReduce(cates, kind) {
    return cates.reduce((result, item) => {
      if (!item.length) {
        return result;
      }
      return result.concat(pagination(item.path, posts, {
        perPage: 0,
        data: {
          name: item.name,
          path: "api/" + kind + "/" + (item.slug ?? item.name) + ".json",
          postlist: item.posts.map(postMap)
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
    const page_posts = [],
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
        path: path,
        count: data.length
      })
    }

    apiData.push(createFile(
      "api/posts.json",
      JSON.stringify({
        total: pages_data.length,
        posts: length,
        data: pages_data
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
          path: path,
          excerpt: filterHTMLTags(post.excerpt),
          cover: post.cover ?? post.banner,
          images: fetchImages(post.content),
          content: post.content,
          more: post.more,
          categories: post.categories.map(cat => {
            return {
              name: cat.name,
              path: "api/categories/" + (cat.name ?? cat.slug) + ".json"
            };
          }),
          tags: post.tags.map(tag => {
            return {
              name: tag.name,
              path: "api/tags/" + (tag.name ?? tag.slug) + ".json"
            };
          })
        })
      );
    }));
  }

  if (restful.pages) {
    apiData = apiData.concat(site.pages.data.map(page => {
      const path = "api/pages/" + getJsonPath(page.path);
      return {
        path: path,
        data: JSON.stringify({
          title: page.title,
          date: page.date,
          updated: page.updated,
          comments: page.comments,
          path: path,
          excerpt: filterHTMLTags(page.excerpt),
          cover: page.cover ?? page.banner,
          images: fetchImages(page.content),
          content: page.content
        })
      };
    }));
  }

  if (!!restful.swipers_list?.length) {
    const swipier = restful.swipers_list
    const res = {
      path: "api/swiper.json",
      data: []
    }
    swipier.forEach(i => {
      res["data"].push(...postlist.filter(v => v.cover && v.slug == i))
    })
    apiData = apiData.concat(res)
  }

  if (!!restful.search_all?.enable) {
    const searchConfig = restful.search_all
    const postList = site.posts.sort("-date");
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
          temp_post.url = hexo.config.root + post.path
        }
        if (searchConfig.content && post._content) {
          temp_post.content = post._content
        }
        if (searchConfig.cover && post.cover) {
          temp_post.cover = post.cover
        }
        if (searchConfig.excerpt && post.excerpt) {
          temp_post.excerpt = post.excerpt
        }
        if (post.tags && post.tags.length > 0) {
          const tags = [];
          post.tags.forEach(tag => tags.push(tag.name));
          temp_post.tags = tags
        }
        if (post.categories && post.categories.length > 0) {
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
