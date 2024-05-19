/* global hexo */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_to_text_1 = __importDefault(require("html-to-text"));
//#region Api
const initApi = "api/init.json";
const siteApi = "api/site.json";
const categoriesPath = "api/categories";
const categoriesApi = categoriesPath + ".json";
const tagsPath = "api/tags";
const tagsApi = tagsPath + ".json";
const postsPath = "api/posts";
const postsApi = postsPath + ".json";
const archivesPath = "api/archives";
const archivesApi = archivesPath + ".json";
const pageApi = "api/pages.json";
const swiperApi = "api/swiper.json";
const searchApi = "api/search.json";
const openApiApi = "api/openapi.json";
function getCatePath(kind, cate) {
    var _a;
    return "api/" + kind + '/' + ((_a = cate.slug) !== null && _a !== void 0 ? _a : cate.name);
}
function getCateApi(kind, cate) {
    return getCatePath(kind, cate) + ".json";
}
function getTagApi(tag) {
    return getCateApi("tags", tag);
}
function getCategoryApi(category) {
    return getCateApi("categories", category);
}
function getPostApi(post) {
    return postsPath + '/' + getJsonPath(post.path);
}
function getPageApi(page) {
    return "api/pages/" + getJsonPath(page.path);
}
//#endregion
function fetchImages(str) {
    const imgURLs = [], rex = /<img[^>]+src="?([^"\s]+)"(.*)>/g;
    var temp;
    while (temp = rex.exec(str)) {
        imgURLs.push(temp[1]);
    }
    return imgURLs.length > 0 ? imgURLs : null;
}
function getPath(str) {
    var result = str;
    var index = result.lastIndexOf('/');
    if (index == -1 || index == 0) {
        if (index == 0) {
            result = result.substring(1);
        }
        index = result.lastIndexOf('.');
        if (index == -1 || index == 0) {
            return result;
        }
        else {
            return result.substring(0, index);
        }
    }
    else {
        return result.substring(0, index);
    }
}
function getJsonPath(str) {
    return getPath(str) + ".json";
}
function pick(obj, props) {
    return props.reduce((iter, val) => (val in obj && (iter[val] = obj[val]), iter), {});
}
function setSettings(obj, set) {
    if (typeof set === "undefined") {
        return;
    }
    else if (set === null) {
        return;
    }
    else if (typeof obj !== "object" || obj instanceof Array) {
        obj = set;
        return;
    }
    const keys = Object.keys(set);
    if (!keys.length) {
        return;
    }
    function setKey(obj, set) {
        if (typeof set === "undefined") {
            return false;
        }
        else if (set === null) {
            return false;
        }
        else if (typeof obj !== "object" || obj instanceof Array) {
            return true;
        }
        const keys = Object.keys(set);
        if (!keys.length) {
            return true;
        }
        keys.forEach(key => {
            if (setKey(obj[key], set[key])) {
                if (typeof set[key] !== "undefined") {
                    obj[key] = set[key];
                }
            }
        });
        return false;
    }
    keys.forEach(key => {
        if (setKey(obj[key], set[key])) {
            if (typeof set[key] !== "undefined") {
                obj[key] = set[key];
            }
        }
    });
}
function createFile(path, data) {
    if (typeof data !== "undefined") {
        return {
            path: path,
            data: JSON.stringify({
                data: data,
                api: path
            })
        };
    }
}
module.exports = function (hexo, site) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    const config = Object.assign({}, hexo.config, hexo.theme.config);
    const restful = {
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
            excerpt: true,
            keywords: false,
            cover: true,
            images: true,
            content: false,
            raw: false,
            categories: true,
            tags: true
        },
        categories: {
            enable: true,
            category_generator: Object.assign({
                per_page: 10,
                order_by: "-date"
            }, config.category_generator)
        },
        tags: {
            enable: true,
            tag_generator: Object.assign({
                per_page: 10,
                order_by: "-date"
            }, config.tag_generator)
        },
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
        },
        openapi: {
            enable: true,
            path: openApiApi,
            info: {
                title: config.title,
                description: config.description,
                contact: {
                    name: config.author
                },
                version: "1.0.0"
            },
            servers: [
                {
                    url: config.url,
                    description: (_a = config.subtitle) !== null && _a !== void 0 ? _a : config.description
                }
            ]
        }
    };
    setSettings(restful, config.restful_xapi);
    if (!(restful === null || restful === void 0 ? void 0 : restful.enable)) {
        return;
    }
    function createApi(path, data, description = {}) {
        var _a;
        const api = createFile(path, data);
        if (typeof api !== "undefined") {
            if ((_a = restful.openapi) === null || _a === void 0 ? void 0 : _a.enable) {
                generateOpenApi(api.path, api.data, description);
            }
            return api;
        }
    }
    const openApi = {};
    if ((_b = restful.openapi) === null || _b === void 0 ? void 0 : _b.enable) {
        const config = restful.openapi;
        function setProperty(name) {
            const value = config[name];
            if (typeof value !== "undefined") {
                openApi[name] = value;
            }
        }
        openApi.openapi = "3.1.0";
        setProperty("info");
        setProperty("externalDocs");
        setProperty("servers");
        openApi.tags = [];
        openApi.paths = {};
    }
    function generateOpenApi(path, json, description = { summary: "Get" }) {
        var _a;
        if (!((_a = restful.openapi) === null || _a === void 0 ? void 0 : _a.enable)) {
            return;
        }
        const data = JSON.parse(json);
        const properties = {};
        function readKey(data, key, properties) {
            var _a;
            const obj = (_a = data[key]) !== null && _a !== void 0 ? _a : '';
            const isArray = key === 0;
            if (obj instanceof Array) {
                const prop = {};
                if (obj.length) {
                    readKey(obj, 0, prop);
                }
                if (isArray) {
                    properties.type = "array";
                    properties.items = prop;
                }
                else {
                    properties[key] = {
                        type: "array",
                        items: prop
                    };
                }
            }
            else if (typeof obj === "object") {
                const prop = {};
                readKeys(obj, prop);
                if (isArray) {
                    properties.type = "object";
                    properties.properties = prop;
                }
                else {
                    properties[key] = {
                        type: "object",
                        properties: prop
                    };
                }
            }
            else {
                if (isArray) {
                    properties.type = typeof obj;
                }
                else {
                    properties[key] = {
                        type: typeof obj
                    };
                }
            }
        }
        function readKeys(obj, properties) {
            Object.keys(obj).forEach(key => readKey(obj, key, properties));
        }
        readKeys(data, properties);
        const get = {
            responses: {
                200: {
                    description: "Successful operation",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: properties
                            }
                        }
                    }
                }
            }
        };
        openApi.paths['/' + path] = {
            get: Object.assign(description, get)
        };
    }
    const fileList = [];
    const apiList = [{
            name: "init",
            api: initApi
        }];
    if (restful.site) {
        fileList.push(createApi(siteApi, restful.site instanceof Array ? pick(config, restful.site) : config, {
            tags: ["site"],
            summary: "Get site information",
            description: "Get the configuration information of the site",
            operationId: "getSite"
        }));
        if ((_c = restful.openapi) === null || _c === void 0 ? void 0 : _c.enable) {
            openApi.tags.push({
                name: "site",
                description: "Site Information"
            });
        }
        apiList.push({
            name: "site",
            api: siteApi
        });
    }
    const posts = site.posts.sort("-date").filter(post => post.published);
    function generate(path, posts, page_size, globalInfo = {}, baseInfo = {}) {
        const postlist = posts.map(postMap);
        if (page_size > 0) {
            const page_posts = [], pages_data = [], length = postlist.length, page_count = Math.ceil(length / page_size);
            for (var i = 0; i < length; i += page_size) {
                const index = Math.ceil((i + 1) / page_size);
                const indexPath = path + '/page.' + index + ".json";
                const data = postlist.slice(i, i + page_size);
                page_posts.push(createFile(indexPath, Object.assign({
                    index: index,
                    total: page_count,
                    posts: data
                }, { info: globalInfo })));
                pages_data.push(Object.assign({
                    index: index,
                    count: data.length,
                    api: indexPath
                }, { info: globalInfo }));
            }
            fileList.push(createFile(path + ".json", Object.assign({
                total: pages_data.length,
                count: length,
                pages: pages_data
            }, { info: Object.assign({}, globalInfo, baseInfo) })));
            fileList.push(...page_posts);
        }
        else {
            fileList.push(createFile(path + ".json", Object.assign({
                count: postlist.length,
                posts: postlist
            }, { info: Object.assign({}, globalInfo, baseInfo) })));
        }
    }
    function cateReduce(cates, kind) {
        return cates.filter(cate => !!cate.length)
            .map(cate => {
            var _a;
            const path = getCatePath(kind, cate);
            return {
                path: path,
                data: {
                    name: cate.name,
                    slug: (_a = cate.slug) !== null && _a !== void 0 ? _a : cate.name,
                    posts: cate.posts,
                    api: path
                }
            };
        });
    }
    function catesMap(item) {
        return {
            name: item.data.name,
            count: item.data.posts.length,
            api: item.data.api
        };
    }
    function convertToText(str) {
        return html_to_text_1.default.convert(str, {
            selectors: [
                { selector: 'a', options: { baseUrl: config.url } },
            ]
        });
    }
    function postMap(post) {
        var _a;
        var result = {};
        if (restful.posts_props) {
            function posts_props(name, val) {
                if (restful.posts_props[name]) {
                    result[name] = typeof val === "function" ? val() : val;
                }
            }
            posts_props("title", post.title);
            posts_props("date", post.date);
            posts_props("updated", post.updated);
            posts_props("comments", post.comments);
            posts_props("url", post.path);
            posts_props("excerpt", () => convertToText(post.excerpt));
            posts_props("keywords", config.keywords);
            posts_props("cover", () => { var _a; return (_a = post.cover) !== null && _a !== void 0 ? _a : post.banner; });
            posts_props("images", () => fetchImages(post.content));
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
            if ((_a = restful.posts) === null || _a === void 0 ? void 0 : _a.enable) {
                result.api = getPostApi(post);
            }
        }
        return result;
    }
    if ((_d = restful.categories) === null || _d === void 0 ? void 0 : _d.enable) {
        const category_generator = restful.categories.category_generator;
        const cates = cateReduce(site.categories, "categories");
        if (cates.length) {
            fileList.push(createApi(categoriesApi, cates.map(catesMap), {
                tags: ["category"],
                summary: "Get categories information",
                description: "Get the list of categories",
                operationId: "getCategories"
            }));
            if ((_e = restful.openapi) === null || _e === void 0 ? void 0 : _e.enable) {
                openApi.tags.push({
                    name: "category",
                    description: "Category Information"
                });
            }
            cates.forEach(item => {
                var _a;
                return generate(item.path, item.data.posts.sort((_a = category_generator === null || category_generator === void 0 ? void 0 : category_generator.order_by) !== null && _a !== void 0 ? _a : "-date"), category_generator === null || category_generator === void 0 ? void 0 : category_generator.per_page, {
                    type: "category",
                    name: item.data.name
                });
            });
            if ((_f = restful.openapi) === null || _f === void 0 ? void 0 : _f.enable) {
                generateOpenApi(categoriesPath + "/{slug}.json", fileList.find(item => item.path.startsWith(categoriesPath) && !item.path.includes("/page.")).data, {
                    tags: ["category"],
                    summary: "Get category information by slug",
                    description: "Get the information of current category by slug",
                    operationId: "getCategoryBySlug",
                    parameters: [
                        {
                            name: "slug",
                            in: "path",
                            description: "The slug of the tag",
                            required: true,
                            schema: {
                                type: "string",
                                enum: cates.length > 10 ? undefined : cates.map(item => item.data.slug),
                                examples: cates.length > 10 ? cates.slice(0, 10).map(item => item.data.slug) : undefined
                            }
                        }
                    ]
                });
                if (category_generator.per_page > 0) {
                    generateOpenApi(categoriesPath + "/{slug}/page.{index}.json", fileList.find(item => item.path.startsWith(categoriesPath) && item.path.includes("/page.")).data, {
                        tags: ["category"],
                        summary: "Get category information by slug with index",
                        description: "Get the information of current category by slug with page index",
                        operationId: "getCategoryBySlugWithIndex",
                        parameters: [
                            {
                                name: "slug",
                                in: "path",
                                description: "The slug of the category",
                                required: true,
                                schema: {
                                    type: "string",
                                    enum: cates.length > 10 ? undefined : cates.map(item => item.data.slug),
                                    examples: cates.length > 10 ? cates.slice(0, 10).map(item => item.data.slug) : undefined
                                }
                            },
                            {
                                name: "index",
                                in: "path",
                                description: "The index of the page",
                                required: true,
                                schema: {
                                    type: "number",
                                    examples: [1]
                                }
                            }
                        ]
                    });
                }
            }
        }
        apiList.push({
            name: "categories",
            api: categoriesApi
        });
    }
    if ((_g = restful.tags) === null || _g === void 0 ? void 0 : _g.enable) {
        const tag_generator = restful.tags.tag_generator;
        const tags = cateReduce(site.tags, "tags");
        if (tags.length) {
            fileList.push(createApi(tagsApi, tags.map(catesMap), {
                tags: ["tag"],
                summary: "Get tags information",
                description: "Get the list of tags",
                operationId: "getTags"
            }));
            if ((_h = restful.openapi) === null || _h === void 0 ? void 0 : _h.enable) {
                openApi.tags.push({
                    name: "tag",
                    description: "Tag Information"
                });
            }
            tags.forEach(item => {
                var _a;
                return generate(item.path, item.data.posts.sort((_a = tag_generator === null || tag_generator === void 0 ? void 0 : tag_generator.order_by) !== null && _a !== void 0 ? _a : "-date"), tag_generator === null || tag_generator === void 0 ? void 0 : tag_generator.per_page, {
                    type: "tag",
                    name: item.data.name
                });
            });
            if ((_j = restful.openapi) === null || _j === void 0 ? void 0 : _j.enable) {
                generateOpenApi(tagsPath + "/{slug}.json", fileList.find(item => item.path.startsWith(tagsPath) && !item.path.includes("/page.")).data, {
                    tags: ["tag"],
                    summary: "Get tag information by slug",
                    description: "Get the information of current tag by slug",
                    operationId: "getTagBySlug",
                    parameters: [
                        {
                            name: "slug",
                            in: "path",
                            description: "The slug of the tag",
                            required: true,
                            schema: {
                                type: "string",
                                enum: tags.length > 10 ? undefined : tags.map(item => item.data.slug),
                                examples: tags.length > 10 ? tags.slice(0, 10).map(item => item.data.slug) : undefined
                            }
                        }
                    ]
                });
                if (tag_generator.per_page > 0) {
                    generateOpenApi(tagsPath + "/{slug}/page.{index}.json", fileList.find(item => item.path.startsWith(tagsPath) && item.path.includes("/page.")).data, {
                        tags: ["tag"],
                        summary: "Get tag information by slug with index",
                        description: "Get the information of current tag by slug with page index",
                        operationId: "getTagBySlugWithIndex",
                        parameters: [
                            {
                                name: "slug",
                                in: "path",
                                description: "The slug of the tag",
                                required: true,
                                schema: {
                                    type: "string",
                                    enum: tags.length > 10 ? undefined : tags.map(item => item.data.slug),
                                    examples: tags.length > 10 ? tags.slice(0, 10).map(item => item.data.slug) : undefined
                                }
                            },
                            {
                                name: "index",
                                in: "path",
                                description: "The index of the page",
                                required: true,
                                schema: {
                                    type: "number",
                                    examples: [1]
                                }
                            }
                        ]
                    });
                }
            }
        }
        apiList.push({
            name: "tags",
            api: tagsApi
        });
    }
    if ((_k = restful.posts) === null || _k === void 0 ? void 0 : _k.enable) {
        var simple;
        fileList.push(...posts.map(post => {
            var _a, _b;
            const path = getPostApi(post);
            simple = createFile(path, {
                title: post.title,
                date: post.date,
                updated: post.updated,
                comments: post.comments,
                url: post.url,
                cover: (_b = (_a = post.cover) !== null && _a !== void 0 ? _a : post.banner) !== null && _b !== void 0 ? _b : null,
                images: fetchImages(post.content),
                content: post.content,
                raw: post.raw,
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
            });
            return simple;
        }));
        if ((_l = restful.openapi) === null || _l === void 0 ? void 0 : _l.enable) {
            generateOpenApi(getPostApi({ path: "{path}" }), simple.data, {
                tags: ["post"],
                summary: "Get post information by path",
                description: "Get the information of current post by path",
                operationId: "getPostByPath",
                parameters: [
                    {
                        name: "path",
                        in: "path",
                        description: "The path of the post",
                        required: true,
                        schema: {
                            type: "string",
                            enum: posts.length > 5 ? undefined : posts.map(item => getPath(item.path)),
                            examples: posts.length > 5 ? posts.slice(0, 5).map(item => getPath(item.path)) : undefined
                        }
                    }
                ]
            });
            openApi.tags.push({
                name: "post",
                description: "Post Information"
            });
        }
        if ((_m = restful.posts.index_generator) === null || _m === void 0 ? void 0 : _m.enable) {
            const index_generator = restful.posts.index_generator;
            generate(postsPath, posts, index_generator.per_page, { type: "index" });
            if ((_o = restful.openapi) === null || _o === void 0 ? void 0 : _o.enable) {
                generateOpenApi(postsApi, fileList.find(item => item.path.startsWith(postsPath) && !item.path.includes("/page.")).data, {
                    tags: ["post"],
                    summary: "Get posts information",
                    description: "Get the list of posts",
                    operationId: "getPosts"
                });
                if (index_generator.per_page > 0) {
                    generateOpenApi(postsPath + "/page.{index}.json", fileList.find(item => item.path.startsWith(postsPath) && item.path.includes("/page.")).data, {
                        tags: ["post"],
                        summary: "Get posts information by index",
                        description: "Get the list of posts by page index",
                        operationId: "getPostsByIndex",
                        parameters: [
                            {
                                name: "index",
                                in: "path",
                                description: "The index of the page",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: Array.from({ length: Math.ceil(posts.length / index_generator.per_page) }, (_, i) => i + 1)
                                }
                            }
                        ]
                    });
                }
            }
            apiList.push({
                name: "posts",
                api: postsApi
            });
        }
        if ((_p = restful.posts.archive_generator) === null || _p === void 0 ? void 0 : _p.enable) {
            const archive_generator = restful.posts.archive_generator;
            const postlist = site.posts.sort((_q = archive_generator.order_by) !== null && _q !== void 0 ? _q : "-date")
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
                if (archive_generator.daily) {
                    const day = date.date();
                    if (!Object.prototype.hasOwnProperty.call(posts[year][month], 'day')) {
                        posts[year][month].day = {};
                    }
                    (posts[year][month].day[day] || (posts[year][month].day[day] = [])).push(post);
                }
            });
            const years = Object.keys(posts);
            function fmtNum(num) {
                return num.toString().padStart(2, '0');
            }
            const archives = [];
            // Yearly
            for (var i = 0, len = years.length; i < len; i++) {
                const year = +years[i];
                const data = posts[year];
                if (!data[0].length)
                    continue;
                const yearUrl = archivesPath + '/' + year;
                const months = [];
                const yearApi = {
                    year: year,
                    api: yearUrl + ".json"
                };
                if (archive_generator.monthly || archive_generator.daily) {
                    // Monthly
                    for (var month = 1; month <= 12; month++) {
                        const monthData = data[month];
                        if (!monthData.length)
                            continue;
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
                                if (!dayData || !dayData.length)
                                    continue;
                                const dayUrl = monthUrl + '/' + fmtNum(day);
                                const dayApi = {
                                    day: day,
                                    api: dayUrl + ".json"
                                };
                                generate(dayUrl, dayData, archive_generator.per_page, {
                                    type: "archive",
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
                                type: "archive",
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
                generate(yearUrl, data[0], archive_generator.per_page, {
                    type: "archive",
                    year: year
                }, months.length ? { months: months } : {});
                archives.push(yearApi);
            }
            fileList.push(createApi(archivesApi, archives, {
                tags: ["archive"],
                summary: "Get archives information",
                description: "Get the list of archives",
                operationId: "getArchives"
            }));
            if ((_r = restful.openapi) === null || _r === void 0 ? void 0 : _r.enable) {
                openApi.tags.push({
                    name: "archive",
                    description: "Archive Information"
                });
            }
            if ((_s = restful.openapi) === null || _s === void 0 ? void 0 : _s.enable) {
                const isSplit = archive_generator.per_page > 0;
                generateOpenApi(archivesPath + "/{year}.json", fileList.find(item => item.path.startsWith(archivesPath)
                    && (item.path.substring(archivesPath.length).match(new RegExp('/', 'g')) || []).length == 1
                    && !item.path.includes("/page.")).data, {
                    tags: ["archive"],
                    summary: "Get archive information by year",
                    description: "Get the archive information of current year",
                    operationId: "getArchiveByYear",
                    parameters: [
                        {
                            name: "year",
                            in: "path",
                            description: "The year of the archive",
                            required: true,
                            schema: {
                                type: "number",
                                enum: years.map(year => +year)
                            }
                        }
                    ]
                });
                if (isSplit) {
                    generateOpenApi(archivesPath + "/{year}/page.{index}.json", fileList.find(item => item.path.startsWith(archivesPath)
                        && (item.path.substring(archivesPath.length).match(new RegExp('/', 'g')) || []).length == 1
                        && item.path.includes("/page.")).data, {
                        tags: ["archive"],
                        summary: "Get archive information by year with index",
                        description: "Get the archive information of current year with page index",
                        operationId: "getArchiveByYearWithIndex",
                        parameters: [
                            {
                                name: "year",
                                in: "path",
                                description: "The year of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: years.map(year => +year)
                                }
                            },
                            {
                                name: "index",
                                in: "path",
                                description: "The index of the page",
                                required: true,
                                schema: {
                                    type: "number",
                                    examples: [1]
                                }
                            }
                        ]
                    });
                }
                if (archive_generator.monthly) {
                    generateOpenApi(archivesPath + "/{year}/{month}.json", fileList.find(item => item.path.startsWith(archivesPath)
                        && (item.path.substring(archivesPath.length).match(new RegExp('/', 'g')) || []).length == 2
                        && !item.path.includes("/page.")).data, {
                        tags: ["archive"],
                        summary: "Get archive information by month",
                        description: "Get the archive information of current month of the year",
                        operationId: "getArchiveByMonth",
                        parameters: [
                            {
                                name: "year",
                                in: "path",
                                description: "The year of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: years.map(year => +year)
                                }
                            },
                            {
                                name: "month",
                                in: "path",
                                description: "The month of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: Array.from({ length: 12 }, (_, i) => i + 1)
                                }
                            }
                        ]
                    });
                    if (isSplit) {
                        generateOpenApi(archivesPath + "/{year}/{month}/page.{index}.json", fileList.find(item => item.path.startsWith(archivesPath)
                            && (item.path.substring(archivesPath.length).match(new RegExp('/', 'g')) || []).length == 2
                            && item.path.includes("/page.")).data, {
                            tags: ["archive"],
                            summary: "Get archive information by month with index",
                            description: "Get the archive information of current month of the year with page index",
                            operationId: "getArchiveByMonthWithIndex",
                            parameters: [
                                {
                                    name: "year",
                                    in: "path",
                                    description: "The year of the archive",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        enum: years.map(year => +year)
                                    }
                                },
                                {
                                    name: "month",
                                    in: "path",
                                    description: "The month of the archive",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        enum: Array.from({ length: 12 }, (_, i) => i + 1)
                                    }
                                },
                                {
                                    name: "index",
                                    in: "path",
                                    description: "The index of the page",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        examples: [1]
                                    }
                                }
                            ]
                        });
                    }
                }
                if (archive_generator.daily) {
                    generateOpenApi(archivesPath + "/{year}/{month}/{day}.json", fileList.find(item => item.path.startsWith(archivesPath)
                        && (item.path.substring(archivesPath.length).match(new RegExp('/', 'g')) || []).length == 3
                        && !item.path.includes("/page.")).data, {
                        tags: ["archive"],
                        summary: "Get archive information by day",
                        description: "Get the archive information of current day of the month and year",
                        operationId: "getArchiveByDay",
                        parameters: [
                            {
                                name: "year",
                                in: "path",
                                description: "The year of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: years.map(year => +year)
                                }
                            },
                            {
                                name: "month",
                                in: "path",
                                description: "The month of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: Array.from({ length: 12 }, (_, i) => i + 1)
                                }
                            },
                            {
                                name: "day",
                                in: "path",
                                description: "The day of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: Array.from({ length: 31 }, (_, i) => i + 1)
                                }
                            }
                        ]
                    });
                    if (isSplit) {
                        generateOpenApi(archivesPath + "/{year}/{month}/{day}/page.{index}.json", fileList.find(item => item.path.startsWith(archivesPath)
                            && (item.path.substring(archivesPath.length).match(new RegExp('/', 'g')) || []).length == 3
                            && item.path.includes("/page.")).data, {
                            tags: ["archive"],
                            summary: "Get archive information by day with index",
                            description: "Get the archive information of current day of the month and year with page index",
                            operationId: "getArchiveByDayWithIndex",
                            parameters: [
                                {
                                    name: "year",
                                    in: "path",
                                    description: "The year of the archive",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        enum: years.map(year => +year),
                                    }
                                },
                                {
                                    name: "month",
                                    in: "path",
                                    description: "The month of the archive",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        enum: Array.from({ length: 12 }, (_, i) => i + 1)
                                    }
                                },
                                {
                                    name: "day",
                                    in: "path",
                                    description: "The day of the archive",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        enum: Array.from({ length: 31 }, (_, i) => i + 1)
                                    }
                                },
                                {
                                    name: "index",
                                    in: "path",
                                    description: "The index of the page",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        examples: [1]
                                    }
                                }
                            ]
                        });
                    }
                }
            }
        }
    }
    if (restful.pages) {
        const pages = [];
        var simple;
        fileList.push(...site.pages.data.map(page => {
            var _a;
            const path = getPageApi(page);
            simple = createFile(path, {
                title: page.title,
                date: page.date,
                updated: page.updated,
                comments: page.comments,
                url: page.path,
                excerpt: convertToText(page.excerpt),
                cover: (_a = page.cover) !== null && _a !== void 0 ? _a : page.banner,
                images: fetchImages(page.content),
                content: page.content,
                raw: page.raw
            });
            pages.push({
                title: page.title,
                url: page.path,
                api: path
            });
            return simple;
        }));
        fileList.push(createApi(pageApi, pages, {
            tags: ["page"],
            summary: "Get pages information",
            description: "Get the list of pages",
            operationId: "getPages"
        }));
        if ((_t = restful.openapi) === null || _t === void 0 ? void 0 : _t.enable) {
            openApi.tags.push({
                name: "page",
                description: "Page Information"
            });
        }
        if ((_u = restful.openapi) === null || _u === void 0 ? void 0 : _u.enable) {
            generateOpenApi(getPageApi({ path: "{path}" }), simple.data, {
                tags: ["page"],
                summary: "Get page information by path",
                description: "Get the information of current page by path",
                operationId: "getPageByPath",
                parameters: [
                    {
                        name: "path",
                        in: "path",
                        description: "The path of the page",
                        required: true,
                        schema: {
                            type: "string",
                            enum: pages.length > 10 ? undefined : pages.map(item => getPath(item.url)),
                            examples: pages.length > 10 ? pages.slice(0, 10).map(item => getPath(item.url)) : undefined
                        }
                    }
                ]
            });
        }
        apiList.push({
            name: "pages",
            api: pageApi
        });
    }
    if ((_v = restful.swipers_list) === null || _v === void 0 ? void 0 : _v.length) {
        const swipier = restful.swipers_list;
        const resources = [];
        swipier.forEach(i => resources.push(...posts.filter(v => v.cover && v.slug == i)));
        fileList.push(createApi(swiperApi, resources, {
            tags: ["swiper"],
            summary: "Get swiper information",
            description: "Get the swiper information",
            operationId: "getSwiper"
        }));
        if ((_w = restful.openapi) === null || _w === void 0 ? void 0 : _w.enable) {
            openApi.tags.push({
                name: "swiper",
                description: "Swiper Information"
            });
        }
    }
    if ((_x = restful.search_all) === null || _x === void 0 ? void 0 : _x.enable) {
        const searchConfig = restful.search_all;
        const postList = site.posts.sort("-date");
        const resource = [];
        if (postList) {
            postList.forEach(post => {
                if (post.indexing != undefined && !post.indexing) {
                    return;
                }
                const temp_post = {};
                if (post.title) {
                    temp_post.title = post.title;
                }
                if (post.slug) {
                    temp_post.slug = post.slug;
                }
                if (post.path) {
                    temp_post.url = config.root + post.path;
                }
                if (searchConfig.content && post.content) {
                    temp_post.content = post.content;
                }
                if (searchConfig.cover && post.cover) {
                    temp_post.cover = post.cover;
                }
                if (searchConfig.excerpt && post.excerpt) {
                    temp_post.excerpt = post.excerpt;
                }
                if (post.tags && post.tags.length > 0) {
                    const tags = [];
                    post.tags.forEach(tag => tags.push(tag.name));
                    temp_post.tags = tags;
                }
                if (post.categories && post.categories.length > 0) {
                    const categories = [];
                    post.categories.forEach(cate => categories.push(cate.name));
                    temp_post.categories = categories;
                }
                resource.push(temp_post);
            });
        }
        const path = (_y = searchConfig.path) !== null && _y !== void 0 ? _y : searchApi;
        fileList.push(createApi(path, resource, {
            tags: ["search"],
            summary: "Get search information",
            description: "Get the information for search",
            operationId: "getSearch"
        }));
        if ((_z = restful.openapi) === null || _z === void 0 ? void 0 : _z.enable) {
            openApi.tags.push({
                name: "search",
                description: "Search Information"
            });
        }
        apiList.push({
            name: "search",
            api: path
        });
    }
    const openApiPath = (_0 = restful.openapi.path) !== null && _0 !== void 0 ? _0 : openApiApi;
    if ((_1 = restful.openapi) === null || _1 === void 0 ? void 0 : _1.enable) {
        apiList.push({
            name: "openapi",
            api: openApiPath
        });
    }
    fileList.push(createApi(initApi, apiList, {
        tags: ["init"],
        summary: "Get available APIs",
        description: "Get the list of available APIs",
        operationId: "getInit"
    }));
    if ((_2 = restful.openapi) === null || _2 === void 0 ? void 0 : _2.enable) {
        openApi.tags.push({
            name: "init",
            description: "Init Information"
        });
    }
    if ((_3 = restful.openapi) === null || _3 === void 0 ? void 0 : _3.enable) {
        fileList.push({
            path: openApiPath,
            data: JSON.stringify(openApi),
        });
    }
    return fileList;
};
//# sourceMappingURL=generator.js.map