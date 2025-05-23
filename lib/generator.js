/* global hexo */
"use strict";

const { escapeHTML, stripHTML } = require("hexo-util");

//#region Typedefs

/**
 * @template T
 * @template U
 * @typedef {(fn: (v: T, i: number) => U) => U[]} mapFunc
 */

/**
 * @typedef Site
 * @property {import("@types/hexo").Locals.Post[]} posts
 * @property {import("@types/hexo").Locals.Page[]} pages
 * @property {import("@types/hexo").Locals.Category[]} categories
 * @property {import("@types/hexo").Locals.Tag[]} tags
 * @property {Object<string, any>} data
 */

/**
 * @typedef posts_props
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
 * @typedef cate_generator
 * @property {number} per_page
 * @property {string} order_by
 */

/**
 * @typedef index_generator
 * @property {boolean} enable
 * @property {number} per_page
 * @property {string} order_by
 */

/**
 * @typedef archive_generator
 * @property {boolean} enable
 * @property {number} per_page
 * @property {boolean} yearly
 * @property {boolean} monthly
 * @property {boolean} daily
 * @property {string} order_by
 */

/**
 * @typedef search_all
 * @property {boolean} enable
 * @property {string} path
 * @property {boolean} cover
 * @property {boolean} excerpt
 * @property {boolean} content
 */

/**
 * @typedef openapi_info_contact
 * @property {string} name
 * @property {string} url
 * @property {string} email
 */

/**
 * @typedef openapi_info_license
 * @property {string} name
 * @property {string} url
 */

/**
 * @typedef openapi_info
 * @property {string} title
 * @property {string} description
 * @property {string} termsOfService
 * @property {openapi_info_contact} contact
 * @property {string} version
 * @property {openapi_info_license} license
 */

/**
 * @typedef openapi_externalDocs
 * @property {string} description
 * @property {string} url
 */

/**
 * @typedef openapi_server
 * @property {string} url
 * @property {string} description
 */

/**
 * @typedef openapi
 * @property {boolean} enable
 * @property {string} path
 * @property {openapi_info} info
 * @property {openapi_externalDocs} externalDocs
 * @property {openapi_server[]} servers
 */

/**
 * @typedef restful_xapi
 * @property {boolean} enable
 * @property {boolean | string[]} site
 * @property {Object<string, boolean>} posts_props
 * @property {{enable: boolean, category_generator: cate_generator}} categories
 * @property {{enable: boolean, tag_generator: cate_generator}} tags
 * @property {{enable: boolean, index_generator: index_generator, archive_generator: archive_generator}} posts
 * @property {boolean} pages
 * @property {string[]} swipers_list
 * @property {search_all} search_all
 * @property {openapi} openapi
 */

//#endregion

//#region Api

const initApi = "api/init.json";
const siteApi = "api/site.json";
const categoriesPath = "api/categories";
const categoriesApi = `${categoriesPath}.json`;
const tagsPath = "api/tags";
const tagsApi = `${tagsPath}.json`;
const postsPath = "api/posts";
const postsApi = `${postsPath}.json`;
const archivesPath = "api/archives";
const archivesApi = `${archivesPath}.json`;
const pagePath = "api/pages";
const pageApi = `${pagePath}.json`;
const swiperApi = "api/swiper.json";
const searchApi = "api/search.json";
const openApiApi = "api/openapi.json";

/**
 * @param {string} kind
 * @param {{name: string, slug: string}} cate
 */
function getCatePath(kind, cate) {
    return `api/${kind}/${cate.slug ?? cate.name}`;
}

/**
 * @param {string} kind
 * @param {{name: string, slug: string}} cate
 */
function getCateApi(kind, cate) {
    return `${getCatePath(kind, cate)}.json`;
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
    return `${postsPath}/${getJsonPath(post.path)}`;
}

/**
 * @param {{path: string}} page
 */
function getPageApi(page) {
    return `${pagePath}/${getJsonPath(page.path)}`;
}

//#endregion

/**
 * @param {string} str
 */
function fetchImages(str) {
    const imgURLs = [], rex = /<img[^>]+src="?([^"\s]+)"(.*)>/g;
    let temp;
    while (temp = rex.exec(str)) {
        const src = temp[1];
        if (imgURLs.indexOf(src) === -1) {
            imgURLs.push(temp[1]);
        }
    }
    return imgURLs;
}

/**
 * @param {string} str
 */
function stripDescription(str) {
    return escapeHTML(stripHTML(str).substring(0, 200)
        .trim() // Remove prefixing/trailing spaces
    ).replace(/\n/g, ' '); // Replace new lines by spaces
}

/**
 * @param {string} str
 */
function getPath(str) {
    let result = str;
    let index = result.lastIndexOf('/');
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
        if (str.endsWith("index.html") || str.endsWith('/')) {
            return result.substring(0, index);
        }
        else {
            index = result.lastIndexOf('.');
            if (index == -1 || index == 0) {
                return result;
            }
            else {
                return result.substring(0, index);
            }
        }
    }
}

/**
 * @param {string} str
 */
function getJsonPath(str) {
    return `${getPath(str)}.json`;
}

/**
 * @param {string[]} props
 */
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

/**
 * @param {string} path
 */
function createFile(path, data) {
    if (typeof data !== "undefined") {
        return {
            path: path,
            data: JSON.stringify({
                data: data,
                api: path
            },
                (_, value) => typeof value === "undefined" ? null : value)
        };
    }
}

/**
 * @param {import("@types/hexo")} hexo
 * @param {Site} site
 */
module.exports = function (hexo, site) {
    /** @type {{keywords: string[], root: string, restful_xapi: restful_xapi, category_generator: cate_generator, tag_generator: cate_generator, index_generator: index_generator, archive_generator: archive_generator}} */
    const config = { ...hexo.config, ...hexo.theme.config };

    /** @type {restful_xapi} */
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
            comments: true,
            excerpt: true,
            description: false,
            language: true,
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
            category_generator: {
                per_page: 10,
                order_by: "-date",
                ...config.category_generator
            }
        },
        tags: {
            enable: true,
            tag_generator: {
                per_page: 10,
                order_by: "-date",
                ...config.tag_generator
            }
        },
        posts: {
            enable: true,
            index_generator: {
                enable: !!config.index_generator,
                per_page: 10,
                order_by: "-date",
                ...config.index_generator
            },
            archive_generator: {
                enable: !!config.archive_generator,
                per_page: 10,
                monthly: true,
                daily: false,
                order_by: "-date",
                ...config.archive_generator
            }
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
                    description: config.subtitle ?? config.description
                }
            ]
        }
    };

    setSettings(restful, config.restful_xapi);

    if (!restful?.enable) {
        return;
    }

    /**
     * @param {string} path
     */
    function createApi(path, data, description = {}) {
        const api = createFile(path, data);
        if (typeof api !== "undefined") {
            if (restful.openapi?.enable) {
                generateOpenApi(api.path, api.data, description);
            }
            return api;
        }
    }

    const openApi = {};

    if (restful.openapi?.enable) {
        const config = restful.openapi;
        /**
         * @param {string} name 
         * @param {string | Function} val 
         */
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

    /**
     * @param {string} path
     * @param {string} json
     */
    function generateOpenApi(path, json, description = { summary: "Get" }) {
        if (!restful.openapi?.enable) {
            return;
        }

        const data = JSON.parse(json);
        const properties = {};

        function readKey(data, key, properties) {
            const obj = data[key] ?? '';
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
            else if (isArray) {
                properties.type = typeof obj;
            }
            else {
                properties[key] = {
                    type: typeof obj
                };
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

        openApi.paths[`/${path}`] = {
            get: { ...description, ...get }
        };
    }

    /** @type {import("@types/hexo").extend.Generator.Return[]} */
    const fileList = [];

    const apiList = [{
        name: "init",
        api: initApi
    }];

    if (restful.site) {
        fileList.push(createApi(
            siteApi,
            restful.site instanceof Array ? pick(config, restful.site) : config,
            {
                tags: ["site"],
                summary: "Get site information",
                description: "Get the configuration information of the site",
                operationId: "getSite"
            }
        ));

        if (restful.openapi?.enable) {
            openApi.tags.push({
                name: "site",
                description: "Site Information"
            });
        }

        apiList.push({
            name: "site",
            api: siteApi
        })
    }

    const posts = site.posts.sort("-date").filter(post => post.published);

    /**
     * @param {string} path
     * @param {import("@types/hexo").Locals.Post[]} posts
     * @param {number} page_size
     */
    function generate(path, posts, page_size, globalInfo = {}, baseInfo = {}) {
        const postlist = posts.map(postMap);
        if (page_size > 0) {
            /** @type {{import("@types/hexo").extend.Generator.Return}[]} */
            const page_posts = [],
                /** @type {{index: number, count: number, api: string}[]} */
                pages_data = [],
                length = postlist.length,
                page_count = Math.ceil(length / page_size);

            for (let i = 0; i < length; i += page_size) {
                const index = Math.ceil((i + 1) / page_size);
                const indexPath = `${path}/page.${index}.json`;
                const data = postlist.slice(i, i + page_size);
                page_posts.push(createFile(
                    indexPath,
                    {
                        index: index,
                        total: page_count,
                        posts: data,
                        info: globalInfo
                    }
                ));
                pages_data.push({
                    index: index,
                    count: data.length,
                    api: indexPath,
                    info: globalInfo
                });
            }

            fileList.push(createFile(
                `${path}.json`,
                {
                    total: pages_data.length,
                    count: length,
                    pages: pages_data,
                    info: { ...globalInfo, ...baseInfo }
                }
            ));

            fileList.push(...page_posts);
        }
        else {
            fileList.push(createFile(
                `${path}.json`,
                {
                    count: postlist.length,
                    posts: postlist,
                    info: { ...globalInfo, ...baseInfo }
                }
            ));
        }
    }

    /**
     * @typedef {{path: string, data: {name: string, slug: string, posts: import("@types/hexo").Locals.Post[], api: string}}} cate
     */

    /**
     * @param {import("@types/hexo").Locals.Category[] | import("@types/hexo").Locals.Tag[]} cates
     * @param {string} kind
     * @returns {cate[]}
     */
    function cateReduce(cates, kind) {
        return cates.filter(cate => !!cate.length)
            .map(cate => {
                const path = getCatePath(kind, cate);
                return {
                    path: path,
                    data: {
                        name: cate.name,
                        slug: cate.slug ?? cate.name,
                        posts: cate.posts,
                        api: `${path}.json`
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
            slug: item.data.slug,
            count: item.data.posts.length,
            api: item.data.api
        };
    }

    /**
     * @param {import("@types/hexo").Locals.Post} post
     */
    function postMap(post) {
        /** @type {import("@types/hexo").Locals.Post} */
        const result = {
            title: post.title,
            slug: post.slug ?? post.title,
            date: post.date,
            updated: post.updated
        };

        if (restful.posts_props) {
            /**
             * @param {keyof import("@types/hexo").Locals.Post} name 
             * @param {string | Function} val 
             */
            function posts_props(name, val) {
                if (restful.posts_props[name]) {
                    result[name] = typeof val === "function" ? val() : val;
                }
            }

            posts_props("comments", post.comments);
            result.url = post.path;
            posts_props("excerpt", () => post.excerpt?.length ? post.excerpt : post.content);
            posts_props("description", () => stripDescription(post.description));
            posts_props("language", post.lang ?? post.language ?? config.language);
            posts_props("keywords", post.keywords);
            posts_props("cover", () => post.cover ?? post.banner);
            posts_props("images", () => fetchImages(post.content))
            posts_props("content", post.content);
            posts_props("raw", post.raw);
            posts_props("categories", () => {
                return post.categories.map((/** @type {{name: string, slug: string}} */ cate) => {
                    return {
                        name: cate.name,
                        slug: cate.slug ?? cate.name,
                        api: getCategoryApi(cate)
                    };
                });
            });
            posts_props("tags", () => {
                return post.tags.map(/** @type {{name: string, slug: string}} */ tag => {
                    return {
                        name: tag.name,
                        slug: tag.slug ?? tag.name,
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

    if (restful.categories?.enable) {
        const category_generator = restful.categories.category_generator;
        const cates = cateReduce(site.categories, "categories");
        if (cates.length) {
            fileList.push(createApi(
                categoriesApi,
                cates.map(catesMap),
                {
                    tags: ["category"],
                    summary: "Get categories information",
                    description: "Get the list of categories",
                    operationId: "getCategories"
                }
            ));

            if (restful.openapi?.enable) {
                openApi.tags.push({
                    name: "category",
                    description: "Category Information"
                });
            }

            cates.forEach(item => generate(
                item.path,
                item.data.posts.sort(category_generator?.order_by ?? "-date"),
                category_generator?.per_page, {
                type: "category",
                name: item.data.name,
                slug: item.data.slug
            }));

            if (restful.openapi?.enable) {
                generateOpenApi(`${categoriesPath}/{slug}.json`, fileList.find(item =>
                    item.path.startsWith(`${categoriesPath}/`) && !item.path.includes("/page.")).data, {
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
                    generateOpenApi(`${categoriesPath}/{slug}/page.{index}.json`, fileList.find(item =>
                        item.path.startsWith(`${categoriesPath}/`) && item.path.includes("/page.")).data, {
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

    if (restful.tags?.enable) {
        const tag_generator = restful.tags.tag_generator;
        const tags = cateReduce(site.tags, "tags");
        if (tags.length) {
            fileList.push(createApi(
                tagsApi,
                tags.map(catesMap),
                {
                    tags: ["tag"],
                    summary: "Get tags information",
                    description: "Get the list of tags",
                    operationId: "getTags"
                }
            ));

            if (restful.openapi?.enable) {
                openApi.tags.push({
                    name: "tag",
                    description: "Tag Information"
                });
            }

            tags.forEach(item => generate(
                item.path,
                item.data.posts.sort(tag_generator?.order_by ?? "-date"),
                tag_generator?.per_page, {
                type: "tag",
                name: item.data.name,
                slug: item.data.slug
            }));

            if (restful.openapi?.enable) {
                generateOpenApi(`${tagsPath}/{slug}.json`, fileList.find(item =>
                    item.path.startsWith(`${tagsPath}/`) && !item.path.includes("/page.")).data, {
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
                    generateOpenApi(`${tagsPath}/{slug}/page.{index}.json`, fileList.find(item =>
                        item.path.startsWith(`${tagsPath}/`) && item.path.includes("/page.")).data, {
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

    if (restful.posts?.enable) {
        let simple;

        fileList.push(...posts.map(post => {
            const path = getPostApi(post);
            simple = createFile(
                path,
                {
                    title: post.title,
                    slug: post.slug ?? post.title,
                    description: stripDescription(post.description ?? post.excerpt ?? post.content ?? config.description),
                    date: post.date,
                    updated: post.updated,
                    language: post.lang ?? post.language ?? config.language,
                    comments: post.comments,
                    url: post.path,
                    cover: post.cover ?? post.banner,
                    images: post.photos ?? fetchImages(post.content),
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
                    })
                });

            return simple;
        }));

        if (restful.openapi?.enable) {
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

        if (restful.posts.index_generator?.enable) {
            const index_generator = restful.posts.index_generator;

            generate(postsPath, posts, index_generator.per_page, { type: "index" });

            if (restful.openapi?.enable) {
                generateOpenApi(postsApi, fileList.find(item => item.path === postsApi).data, {
                    tags: ["post"],
                    summary: "Get posts information",
                    description: "Get the list of posts",
                    operationId: "getPosts"
                });



                if (index_generator.per_page > 0) {
                    generateOpenApi(`${postsPath}/page.{index}.json`, fileList.find(item =>
                        item.path.startsWith(`${postsPath}/`) && item.path.includes("/page.")).data, {
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

        if (restful.posts.archive_generator?.enable) {
            const archive_generator = restful.posts.archive_generator;
            const postlist = site.posts.sort(archive_generator.order_by ?? "-date")
                .filter(post => post.published);
            /** @type {Object<number, (import("@types/hexo").Locals.Post[] & { day: Object<number, import("@types/hexo").Locals.Post[]> })[]>} */
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
            /** @type {number[]} */
            const years = Object.keys(posts);

            /**
             * @param {number} num
             */
            function fmtNum(num) {
                return num.toString().padStart(2, '0');
            }

            const archives = [];

            // Yearly
            for (let i = 0, len = years.length; i < len; i++) {
                const year = +years[i];
                const data = posts[year];
                if (!data[0].length) { continue; }

                const yearUrl = `${archivesPath}/${year}`;
                /** @type {{month: number, api: string, data: {month: number, api: string}[]}[]} */
                const months = [];
                const yearApi = {
                    year: year,
                    api: `${yearUrl}.json`
                };

                if (archive_generator.monthly || archive_generator.daily) {
                    // Monthly
                    for (let month = 1; month <= 12; month++) {
                        const monthData = data[month];
                        if (!monthData.length) { continue; }

                        const monthUrl = `${yearUrl}/${fmtNum(month)}`;
                        /** @type {{day: number, api: string, data: {day: number, api: string}[]}[]} */
                        const days = [];
                        const monthApi = {
                            month: month,
                            api: `${monthUrl}.json`
                        };

                        if (archive_generator.daily) {
                            // Daily
                            for (let day = 1; day <= 31; day++) {
                                const dayData = monthData.day[day];
                                if (!dayData || !dayData.length) { continue; }

                                const dayUrl = `${monthUrl}/${fmtNum(day)}`;
                                const dayApi = {
                                    day: day,
                                    api: `${dayUrl}.json`
                                };

                                generate(dayUrl, dayData, archive_generator.per_page, {
                                    type: "archive",
                                    year: year,
                                    month: month,
                                    day: day
                                });
                                days.push({
                                    day: day,
                                    api: `${dayUrl}.json`
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
                                api: `${monthUrl}.json`
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

            fileList.push(createApi(
                archivesApi,
                archives,
                {
                    tags: ["archive"],
                    summary: "Get archives information",
                    description: "Get the list of archives",
                    operationId: "getArchives"
                }
            ));

            if (restful.openapi?.enable) {
                openApi.tags.push({
                    name: "archive",
                    description: "Archive Information"
                });
            }

            if (restful.openapi?.enable) {
                const isSplit = archive_generator.per_page > 0;
                generateOpenApi(`${archivesPath}/{year}.json`, fileList.find(item =>
                    item.path.startsWith(`${archivesPath}/`)
                    && (item.path.substring(archivesPath.length).match(/\//g) || []).length == 1
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
                    generateOpenApi(`${archivesPath}/{year}/page.{index}.json`, fileList.find(item =>
                        item.path.startsWith(`${archivesPath}/`)
                        && (item.path.substring(archivesPath.length).match(/\//g) || []).length == 2
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
                    generateOpenApi(`${archivesPath}/{year}/{month}.json`, fileList.find(item =>
                        item.path.startsWith(`${archivesPath}/`)
                        && (item.path.substring(archivesPath.length).match(/\//g) || []).length == 2
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
                                    enum: Array.from({ length: 12 }, (_, i) => fmtNum(i + 1))
                                }
                            }
                        ]
                    });
                    if (isSplit) {
                        generateOpenApi(`${archivesPath}/{year}/{month}/page.{index}.json`, fileList.find(item =>
                            item.path.startsWith(`${archivesPath}/`)
                            && (item.path.substring(archivesPath.length).match(/\//g) || []).length == 3
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
                                        enum: Array.from({ length: 12 }, (_, i) => fmtNum(i + 1))
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
                    generateOpenApi(`${archivesPath}/{year}/{month}/{day}.json`, fileList.find(item =>
                        item.path.startsWith(`${archivesPath}/`)
                        && (item.path.substring(archivesPath.length).match(/\//g) || []).length == 3
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
                                    enum: Array.from({ length: 12 }, (_, i) => fmtNum(i + 1))
                                }
                            },
                            {
                                name: "day",
                                in: "path",
                                description: "The day of the archive",
                                required: true,
                                schema: {
                                    type: "number",
                                    enum: Array.from({ length: 31 }, (_, i) => fmtNum(i + 1))
                                }
                            }
                        ]
                    });
                    if (isSplit) {
                        generateOpenApi(`${archivesPath}/{year}/{month}/{day}/page.{index}.json`, fileList.find(item =>
                            item.path.startsWith(`${archivesPath}/`)
                            && (item.path.substring(archivesPath.length).match(/\//g) || []).length == 4
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
                                        enum: Array.from({ length: 12 }, (_, i) => fmtNum(i + 1))
                                    }
                                },
                                {
                                    name: "day",
                                    in: "path",
                                    description: "The day of the archive",
                                    required: true,
                                    schema: {
                                        type: "number",
                                        enum: Array.from({ length: 31 }, (_, i) => fmtNum(i + 1))
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
        /** @type {{title: string, url: string, api: string}[]} */
        const pages = [];

        /** @type {import("@types/hexo").extend.Generator.Return} */
        let simple;

        fileList.push(...site.pages.map(page => {
            const path = getPageApi(page);
            const description = stripDescription(page.description ?? page.excerpt ?? page.content ?? config.description);

            simple = createFile(
                path,
                {
                    title: page.title,
                    description: description,
                    date: page.date,
                    updated: page.updated,
                    language: page.lang ?? page.language ?? config.language,
                    comments: page.comments,
                    url: page.path,
                    cover: page.cover ?? page.banner,
                    images: page.photos ?? fetchImages(page.content),
                    content: page.content,
                    raw: page.raw
                }
            );

            pages.push({
                title: page.title,
                description: description,
                language: page.lang ?? page.language ?? config.language,
                url: page.path,
                api: path
            });

            return simple;
        }));

        fileList.push(createApi(
            pageApi,
            pages,
            {
                tags: ["page"],
                summary: "Get pages information",
                description: "Get the list of pages",
                operationId: "getPages"
            }
        ));

        if (restful.openapi?.enable) {
            openApi.tags.push({
                name: "page",
                description: "Page Information"
            });
        }

        if (restful.openapi?.enable) {
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

    if (restful.swipers_list?.length) {
        const swipier = restful.swipers_list
        /** @type {import("@types/hexo").Locals.Post[]} */
        const resources = [];

        swipier.forEach(i => resources.push(...posts.filter(v => v.cover && v.slug == i)));

        fileList.push(createApi(
            swiperApi,
            resources,
            {
                tags: ["swiper"],
                summary: "Get swiper information",
                description: "Get the swiper information",
                operationId: "getSwiper"
            }
        ));

        if (restful.openapi?.enable) {
            openApi.tags.push({
                name: "swiper",
                description: "Swiper Information"
            });
        }
    }

    if (restful.search_all?.enable) {
        const searchConfig = restful.search_all
        const postList = site.posts.sort("-date");
        /** @type {import("@types/hexo").Locals.Post[]} */
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
                    temp_post.slug = post.slug ?? post.title
                }
                if (post.path) {
                    temp_post.url = `${config.root}${post.path}`
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
                    /** @type {string[]} */
                    const tags = [];
                    post.tags.forEach(tag => tags.push(tag.name));
                    temp_post.tags = tags
                }
                if (post.categories && post.categories.length > 0) {
                    /** @type {string[]} */
                    const categories = [];
                    post.categories.forEach(cate => categories.push(cate.name));
                    temp_post.categories = categories
                }
                resource.push(temp_post);
            })
        }

        const path = searchConfig.path ?? searchApi;

        fileList.push(createApi(
            path,
            resource,
            {
                tags: ["search"],
                summary: "Get search information",
                description: "Get the information for search",
                operationId: "getSearch"
            }
        ));

        if (restful.openapi?.enable) {
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

    const openApiPath = restful.openapi.path ?? openApiApi;

    if (restful.openapi?.enable) {
        apiList.push({
            name: "openapi",
            api: openApiPath
        });
    }

    fileList.push(createApi(
        initApi,
        apiList,
        {
            tags: ["init"],
            summary: "Get available APIs",
            description: "Get the list of available APIs",
            operationId: "getInit"
        }
    ));

    if (restful.openapi?.enable) {
        openApi.tags.push({
            name: "init",
            description: "Init Information"
        });
    }

    if (restful.openapi?.enable) {
        fileList.push({
            path: openApiPath,
            data: JSON.stringify(openApi),
        });
    }

    return fileList;
};
