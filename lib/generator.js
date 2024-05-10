/* global hexo */
"use strict";

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
 * @property {{name: string, slug: string}[]} categories
 * @property {{name: string, slug: string}[]} tags
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
 * @typedef {Object} index_generator
 * @property {boolean} enable
 * @property {number} per_page
 * @property {string} order_by
 */

/**
 * @typedef {Object} archive_generator
 * @property {boolean} enable
 * @property {number} per_page
 * @property {boolean} yearly
 * @property {boolean} monthly
 * @property {boolean} daily
 * @property {string} order_by
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
 * @property {boolean} enable
 * @property {boolean} site
 * @property {Object} posts_props
 * @property {boolean} categories
 * @property {boolean} tags
 * @property {{enable: boolean, index_generator: index_generator, archive_generator: archive_generator}} posts
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
 * @param {Object} data
 */
function createFile(path, data) {
  if (typeof (data) !== "undefined") {
    return {
      path: path,
      data: JSON.stringify({
        data: data,
        api: path
      })
    };
  }
}

/**
 * @param {Object} obj
 * @param {string[]} props
 */
function pick(obj, props) {
  return props.reduce((iter, val) => (val in obj && (iter[val] = obj[val]), iter), {});
}

//#region Api

/**
 * @type {string}
 */
const initApi = "api/init.json";

/**
 * @type {string}
 */
const siteApi = "api/site.json";

/**
 * @type {string}
 */
const categoriesApi = "api/categories.json";

/**
 * @type {string}
 */
const tagsApi = "api/tags.json";

/**
 * @type {string}
 */
const postsPath = "api/posts";

/**
 * @type {string}
 */
const postsApi = postsPath + ".json";

/**
 * @type {string}
 */
const archivesPath = "api/archives";

/**
 * @type {string}
 */
const archivesApi = archivesPath + ".json";

/**
 * @type {string}
 */
const pageApi = "api/pages.json";

/**
 * @type {string}
 */
const swiperApi = "api/swiper.json";

/**
 * @type {string}
 */
const searchApi = "api/search.json";

/**
 * @param {string} kind
 * @param {{name: string, slug: string}} cate
 */
function getCateApi(kind, cate) {
  return "api/" + kind + '/' + (cate.slug ?? cate.name) + ".json";
}

/**
 * @param {{name: string, slug: string}} tag
 */
function getTagApi(tag) {
  return getCateApi("tags", tag);
}

/**
 * @param {{name: string, slug: string}} category
 */
function getCategoryApi(category) {
  return getCateApi("categories", category);
}

/**
 * @param {{path: string}} post
 */
function getPostApi(post) {
  return postsPath + '/' + getJsonPath(post.path);
}

/**
 * @param {{path: string}} page
 */
function getPageApi(page) {
  return "api/pages/" + getJsonPath(page.path);
}

//#endregion

/**
 * @param {hexo} hexo
 * @param {hexoSite} site
 */
module.exports = function (hexo, site) {
  /**
   * @type {{keywords: string[], root: string, restful_xapi: restful_xapi, index_generator: index_generator, archive_generator: archive_generator}}
   */
  const config = Object.assign({}, hexo.config, hexo.theme.config);

  /**
   * @type {restful_xapi}
   */
  const restful = Object.assign({
    enable: true,
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
    posts_props: {
      title: true,
      date: true,
      updated: true,
      comments: true,
      url: true,
      excerpt: false,
      keywords: false,
      cover: true,
      images: true,
      content: false,
      raw: false,
      categories: true,
      tags: true
    },
    categories: true,
    tags: true,
    posts: {
      enable: true,
      index_generator: Object.assign({
        enable: !!config.index_generator,
        per_page: 10,
        order_by: "-date"
      }, config.index_generator),
      archive_generator: Object.assign({
        enable: !!config.archive_generator,
        per_page: 10,
        yearly: true,
        monthly: true,
        daily: false,
        order_by: "-date"
      }, config.archive_generator)
    },
    pages: true,
    swipers_list: [],
    search_all: {
      enable: true,
      path: searchApi,
      cover: true,
      excerpt: false,
      content: true
    }
  }, config.restful_xapi);

  if (!restful.enable) {
    return fileList;
  }

  /**
   * @typedef {{path: string, data: string}} file
   */

  /**
   * @type {file[]}
   */
  const fileList = [];

  const apiList = [{
    name: "init",
    path: initApi
  }];

  if (!restful) {
    return fileList;
  }

  if (restful.site) {
    fileList.push(createFile(
      siteApi,
      restful.site instanceof Array ? pick(config, restful.site) : config
    ));
    apiList.push({
      name: "site",
      api: siteApi
    })
  }

  const posts = site.posts.sort("-date").filter(post => post.published);

  /**
   * @typedef {{path: string, data: {name: string, posts: postMap[], api: string}}} cate
   */

  /**
   * @param {hexoCategory[]} cates
   * @param {string} kind
   */
  function cateReduce(cates, kind) {
    return cates.filter(cate => !!cate.length)
      .map(cate => {
        const path = getCateApi(kind, cate);
        return {
          path: path,
          data: {
            name: cate.name,
            posts: cate.posts.map(postMap),
            api: path
          }
        };
      });
  }

  /**
   * @param {cate} item
   */
  function catesMap(item) {
    return {
      name: item.data.name,
      count: item.data.posts.length,
      api: item.data.api
    };
  }

  /**
   * @param {cate} item
   */
  function cateMap(item) {
    return createFile(
      item.path,
      {
        name: item.data,
        posts: item.data
      }
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
    if (restful.posts_props) {
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
      posts_props("images", () => fetchImages(post.content))
      posts_props("content", post.content);
      posts_props("raw", post.raw);
      posts_props("categories", () => {
        return post.categories.map(cate => {
          return {
            name: cate.name,
            api: getCategoryApi(cate)
          };
        });
      });
      posts_props("tags", () => {
        return post.tags.map(tag => {
          return {
            name: tag.name,
            api: getTagApi(tag)
          };
        });
      });
      if (restful.posts?.enable) {
        result.api = getPostApi(post);
      }
    }
    return result;
  }

  if (restful.categories) {
    const cates = cateReduce(site.categories, "categories");
    if (cates.length) {
      fileList.push(createFile(
        categoriesApi,
        cates.map(catesMap),
      ));
      fileList.push(...cates.map(cateMap));
    }
    apiList.push({
      name: "categories",
      api: categoriesApi
    });
  }

  if (restful.tags) {
    const tags = cateReduce(site.tags, "tags");
    if (tags.length) {
      fileList.push(createFile(
        tagsApi,
        tags.map(catesMap)
      ));
      fileList.push(...tags.map(cateMap));
    }
    apiList.push({
      name: "tags",
      api: tagsApi
    });
  }

  if (restful.posts?.enable) {
    fileList.push(...posts.map(post => {
      const path = getPostApi(post);
      return createFile(
        path,
        {
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
          categories: post.categories.map(cate => {
            return {
              name: cate.name,
              api: getCategoryApi(cate)
            };
          }),
          tags: post.tags.map(tag => {
            return {
              name: tag.name,
              api: getTagApi(tag)
            };
          }),
          api: path
        }
      );
    }));

    function generate(path, posts, page_size, globalInfo = {}, baseInfo = {}) {
      const postlist = posts.map(postMap);
      if (page_size > 0) {
        /**
         * @type {{api}[]}
         */
        const page_posts = [],
          /**
           * @type {{index: number, count: number, api: string}[]}
           */
          pages_data = [],
          length = postlist.length,
          page_count = Math.ceil(length / page_size);

        for (var i = 0; i < length; i += page_size) {
          const index = Math.ceil((i + 1) / page_size);
          const indexPath = path + '/page.' + index + ".json";
          const data = postlist.slice(i, i + page_size);
          page_posts.push(createFile(
            indexPath,
            Object.assign({
              index: index,
              total: page_count,
              posts: data
            }, { info: globalInfo })
          ));
          pages_data.push(Object.assign({
            index: index,
            count: data.length,
            api: indexPath
          }, { info: globalInfo }));
        }

        fileList.push(createFile(
          path + ".json",
          Object.assign({
            total: pages_data.length,
            count: length,
            pages: pages_data
          },
            { info: Object.assign({}, globalInfo, baseInfo) })
        ));

        fileList.push(...page_posts);
      }
      else {
        fileList.push(createFile(
          path + ".json",
          postlist
        ));
      }
    }

    if (restful.posts.index_generator?.enable) {
      generate(postsPath, posts, restful.posts.index_generator.per_page);
      apiList.push({
        name: "posts",
        api: postsApi
      });
    }

    if (restful.posts.archive_generator?.enable) {
      const archive_generator = restful.posts.archive_generator;
      const postlist = site.posts.sort(archive_generator.order_by ?? "-date")
        .filter(post => post.published);
      const posts = {};

      // Organize posts by date
      postlist.forEach(post => {
        const date = post.date;
        const year = date.year();
        const month = date.month() + 1; // month is started from 0

        if (!Object.prototype.hasOwnProperty.call(posts, year)) {
          // 13 arrays. The first array is for posts in this year
          // and the other arrays is for posts in this month
          posts[year] = [[], [], [], [], [], [], [], [], [], [], [], [], []];
        }

        posts[year][0].push(post);
        posts[year][month].push(post);
        // Daily
        if (config.archive_generator.daily) {
          const day = date.date();
          if (!Object.prototype.hasOwnProperty.call(posts[year][month], 'day')) {
            posts[year][month].day = {};
          }

          (posts[year][month].day[day] || (posts[year][month].day[day] = [])).push(post);
        }
      });

      const years = Object.keys(posts);
      var year, data, month, monthData, yearUrl;

      function fmtNum(num) {
        return num.toString().padStart(2, '0');
      }

      const archives = [];

      // Yearly
      for (var i = 0, len = years.length; i < len; i++) {
        year = +years[i];
        data = posts[year];
        if (!data[0].length) continue;
        const yearUrl = archivesPath + '/' + year;
        const months = [];
        const yearApi = {
          year: year,
          api: yearUrl + ".json"
        };

        if (archive_generator.monthly || archive_generator.daily) {
          // Monthly
          for (month = 1; month <= 12; month++) {
            monthData = data[month];
            if (!monthData.length) continue;
            const monthUrl = yearUrl + '/' + fmtNum(month);
            const days = [];
            const monthApi = {
              month: month,
              api: monthUrl + ".json"
            };

            if (archive_generator.daily) {
              // Daily
              for (let day = 1; day <= 31; day++) {
                const dayData = monthData.day[day];
                if (!dayData || !dayData.length) continue;
                const dayUrl = monthUrl + '/' + fmtNum(day);
                const dayApi = {
                  day: day,
                  api: dayUrl + ".json"
                };
                generate(dayUrl, dayData, archive_generator.per_page, {
                  year: year,
                  month: month,
                  day: day
                });
                days.push({
                  day: day,
                  api: dayUrl + ".json"
                });
                (monthApi.data || (monthApi.data = [])).push(dayApi);
              }
            }

            if (archive_generator.monthly) {
              generate(monthUrl, monthData, archive_generator.per_page, {
                year: year,
                month: month
              }, days.length ? { days: days } : {});
              months.push({
                month: month,
                api: monthUrl + ".json"
              });
              (yearApi.data || (yearApi.data = [])).push(monthApi);
            }
          }
        }

        generate(yearUrl, data[0], archive_generator.per_page, { year: year }, months.length ? { months: months } : {});
        archives.push(yearApi);
      }

      fileList.push(createFile(
        archivesApi,
        archives
      ));
    }
  }

  if (restful.pages) {
    /**
     * @type {{title: string, url: string, api: string}[]}
     */
    const pages = [];
    site.pages.data.forEach(page => {
      const path = getPageApi(page);
      fileList.push(createFile(
        path,
        {
          title: page.title,
          date: page.date,
          updated: page.updated,
          comments: page.comments,
          url: page.path,
          excerpt: filterHTMLTags(page.excerpt),
          cover: page.cover ?? page.banner,
          images: fetchImages(page.content),
          content: page.content,
        }
      ));
      pages.push({
        title: page.title,
        url: page.path,
        api: path
      });
    });
    fileList.push(createFile(
      pageApi,
      pages
    ));
    apiList.push({
      name: "pages",
      api: pageApi
    });
  }

  if (restful.swipers_list?.length) {
    const swipier = restful.swipers_list
    /**
     * @type {postMap[]}
     */
    const resources = [];
    swipier.forEach(i => resources.push(...postlist.filter(v => v.cover && v.slug == i)));
    fileList.push(createFile(
      swiperApi,
      resources
    ));
  }

  if (restful.search_all?.enable) {
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
    const path = searchConfig.path ?? searchApi;
    fileList.push(createFile(
      path,
      resource));
    apiList.push({
      name: "search",
      api: path
    });
  }

  fileList.push(createFile(
    initApi,
    apiList
  ));

  return fileList;
};
