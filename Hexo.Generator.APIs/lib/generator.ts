/* global hexo */
"use strict";

import Hexo from "hexo";
import htmlToText from "html-to-text";

interface Model<T> {
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    length: number;
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    toArray(): T[];
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    count(): number;
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    forEach(fn: (v: T, i: number) => void): void;
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    filter(fn: (v: T, i: number) => boolean): Model<T>;
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    map<U>(fn: (v: T, i: number) => U): U[];
    /**
     * Warehouse method
     * https://hexojs.github.io/warehouse/
     */
    sort(v: string): Model<T>;
}

interface Site {
    posts: Model<Hexo.Locals.Post>;
    pages: Model<Hexo.Locals.Page>;
    categories: Model<Hexo.Locals.Category>;
    tags: Model<Hexo.Locals.Tag>;
    data: { [key: string]: any };
}

declare namespace RestfulXApi {
    interface PostsProps {
        title: boolean;
        date: boolean;
        updated: boolean;
        comments: boolean;
        url: boolean;
        excerpt: boolean;
        keywords: boolean;
        cover: boolean;
        images: boolean;
        content: boolean;
        raw: boolean;
        categories: boolean;
        tags: boolean;
    }

    interface CateGenerator {
        per_page: number;
        order_by: string;
    }

    interface IndexGenerator {
        enable: boolean;
        per_page: number;
        order_by: string;
    }

    interface ArchiveGenerator {
        enable: boolean;
        per_page: number;
        monthly: boolean;
        daily: boolean;
        order_by: string;
    }

    interface SearchAll {
        enable: boolean;
        path: string;
        cover: boolean;
        excerpt: boolean;
        content: boolean;
    }

    namespace OpenApi {
        namespace Info {
            interface Contact {
                name: string;
                url?: string;
                email?: string;
            }

            interface License {
                name: string;
                url: string;
            }
        }

        interface Info {
            title: string;
            description: string;
            termsOfService?: string;
            contact: OpenApi.Info.Contact;
            version: string;
            license?: OpenApi.Info.License;
        }

        interface ExternalDocs {
            description: string;
            url: string;
        }

        interface Server {
            url: string;
            description: string;
        }
    }

    interface OpenApi {
        enable: boolean;
        path: string;
        info: OpenApi.Info;
        externalDocs?: OpenApi.ExternalDocs;
        servers: OpenApi.Server[];
    }
}

declare interface RestfulXApi {
    enable: boolean;
    site: boolean | string[];
    posts_props: RestfulXApi.PostsProps;
    categories: {
        enable: boolean;
        category_generator: RestfulXApi.CateGenerator;
    };
    tags: {
        enable: boolean;
        tag_generator: RestfulXApi.CateGenerator;
    };
    posts: {
        enable: boolean;
        index_generator: RestfulXApi.IndexGenerator;
        archive_generator: RestfulXApi.ArchiveGenerator;
    };
    pages: boolean;
    swipers_list: any[];
    search_all: RestfulXApi.SearchAll;
    openapi: RestfulXApi.OpenApi;
}

//#region Api

const initApi: string = "api/init.json";

const siteApi: string = "api/site.json";

const categoriesPath: string = "api/categories";

const categoriesApi: string = categoriesPath + ".json";

const tagsPath: string = "api/tags";

const tagsApi: string = tagsPath + ".json";

const postsPath: string = "api/posts";

const postsApi: string = postsPath + ".json";

const archivesPath: string = "api/archives";

const archivesApi: string = archivesPath + ".json";

const pageApi: string = "api/pages.json";

const swiperApi: string = "api/swiper.json";

const searchApi: string = "api/search.json";

const openApiApi: string = "api/openapi.json";

function getCatePath(kind: string, cate: { name: string, slug?: string }) {
    return "api/" + kind + '/' + (cate.slug ?? cate.name);
}

function getCateApi(kind: string, cate: { name: string, slug?: string }) {
    return getCatePath(kind, cate) + ".json";
}

function getTagApi(tag: { name: string, slug?: string }) {
    return getCateApi("tags", tag);
}

function getCategoryApi(category: { name: string, slug?: string }) {
    return getCateApi("categories", category);
}

function getPostApi(post: { path: string }) {
    return postsPath + '/' + getJsonPath(post.path);
}

function getPageApi(page: { path: string }) {
    return "api/pages/" + getJsonPath(page.path);
}

//#endregion

function fetchImages(str: string): (string[] | null) {
    const imgURLs: string[] = [], rex = /<img[^>]+src="?([^"\s]+)"(.*)>/g;
    var temp;
    while (temp = rex.exec(str)) {
        imgURLs.push(temp[1]);
    }
    return imgURLs.length > 0 ? imgURLs : null;
}

function getPath(str: string) {
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

function getJsonPath(str: string) {
    return getPath(str) + ".json";
}

function pick(obj, props: string[]) {
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

function createFile(path: string, data) {
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

module.exports = function (hexo: Hexo, site: Site): Hexo.extend.Generator.Return[] | undefined {
    const config = Object.assign({}, hexo.config, hexo.theme.config);

    const restful: RestfulXApi = {
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
                    description: config.subtitle ?? config.description
                }
            ]
        }
    };

    setSettings(restful, config.restful_xapi);

    if (!restful?.enable) {
        return;
    }

    function createApi(path: string, data, description = {}) {
        const api = createFile(path, data);
        if (typeof api !== "undefined") {
            if (restful.openapi?.enable) {
                generateOpenApi(api.path, api.data, description);
            }
            return api;
        }
    }

    const openApi: any = {};

    if (restful.openapi?.enable) {
        const config = restful.openapi;
        function setProperty(name: string) {
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

    function generateOpenApi(path: string, json: string, description: any = { summary: "Get" }) {
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

    const fileList: Hexo.extend.Generator.Return[] = [];

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

    function generate(path: string, posts: Model<Hexo.Locals.Post>, page_size: number, globalInfo: any = {}, baseInfo: any = {}) {
        const postlist = posts.map(postMap);
        if (page_size > 0) {
            const page_posts = [],
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
                Object.assign({
                    count: postlist.length,
                    posts: postlist
                },
                    { info: Object.assign({}, globalInfo, baseInfo) })
            ));
        }
    }

    interface CateModel {
        path: string;
        data: {
            name: string;
            slug: string;
            posts: Model<Hexo.Locals.Post>;
            api: string;
        };
    }

    function cateReduce(cates: Model<Hexo.Locals.Category | Hexo.Locals.Tag>, kind: string): CateModel[] {
        return cates.filter(cate => !!cate.length)
            .map(cate => {
                const path = getCatePath(kind, cate);
                return {
                    path: path,
                    data: {
                        name: cate.name,
                        slug: cate.slug ?? cate.name,
                        posts: cate.posts as Model<Hexo.Locals.Post>,
                        api: path
                    }
                };
            });
    }

    function catesMap(item: CateModel) {
        return {
            name: item.data.name,
            count: item.data.posts.length,
            api: item.data.api
        };
    }

    function convertToText(str: string): string {
        return htmlToText.convert(str, {
            selectors: [
                { selector: 'a', options: { baseUrl: config.url } },
            ]
        })
    }

    interface PostMap {
        title?: string;
        date?: Date;
        updated?: Date;
        comments?: boolean;
        url?: string;
        excerpt?: string;
        keywords?: string;
        cover?: string;
        images?: string[];
        content?: string;
        raw?: string;
        categories?: { name: string, api: string }[];
        tags?: { name: string, api: string }[];
        api?: string;
    }

    function postMap(post: Hexo.Locals.Post) {
        var result: PostMap = {};
        if (restful.posts_props) {
            function posts_props(name: string, val: string | boolean | object) {
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
            posts_props("cover", () => post.cover ?? post.banner);
            posts_props("images", () => fetchImages(post.content))
            posts_props("content", post.content);
            posts_props("raw", post.raw);
            posts_props("categories", () => {
                return post.categories.map(cate => {
                    return {
                        name: (cate as any).name,
                        api: getCategoryApi(cate as any)
                    };
                });
            });
            posts_props("tags", () => {
                return post.tags.map(tag => {
                    return {
                        name: (tag as any).name,
                        api: getTagApi(tag as any)
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
                name: item.data.name
            }));

            if (restful.openapi?.enable) {
                generateOpenApi(categoriesPath + "/{slug}.json", fileList.find(item =>
                    item.path.startsWith(categoriesPath) && !item.path.includes("/page.")).data, {
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
                    generateOpenApi(categoriesPath + "/{slug}/page.{index}.json", fileList.find(item =>
                        item.path.startsWith(categoriesPath) && item.path.includes("/page.")).data, {
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
                name: item.data.name
            }));

            if (restful.openapi?.enable) {
                generateOpenApi(tagsPath + "/{slug}.json", fileList.find(item =>
                    item.path.startsWith(tagsPath) && !item.path.includes("/page.")).data, {
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
                    generateOpenApi(tagsPath + "/{slug}/page.{index}.json", fileList.find(item =>
                        item.path.startsWith(tagsPath) && item.path.includes("/page.")).data, {
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
        var simple: { path: string, data: string };

        fileList.push(...posts.map(post => {
            const path = getPostApi(post);
            simple = createFile(
                path,
                {
                    title: post.title,
                    date: post.date,
                    updated: post.updated,
                    comments: post.comments,
                    url: post.url,
                    cover: post.cover ?? post.banner ?? null,
                    images: fetchImages(post.content),
                    content: post.content,
                    raw: post.raw,
                    categories: post.categories.map(cate => {
                        return {
                            name: (cate as any).name,
                            api: getCategoryApi(cate as any)
                        };
                    }),
                    tags: post.tags.map(tag => {
                        return {
                            name: (tag as any).name,
                            api: getTagApi(tag as any)
                        };
                    }),
                    api: path
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
                            examples: posts.length > 5 ? (posts as any as Hexo.Locals.Post).slice(0, 5).map(item => getPath(item.path)) : undefined
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
                generateOpenApi(postsApi, fileList.find(item =>
                    item.path.startsWith(postsPath) && !item.path.includes("/page.")).data, {
                    tags: ["post"],
                    summary: "Get posts information",
                    description: "Get the list of posts",
                    operationId: "getPosts"
                });

                if (index_generator.per_page > 0) {
                    generateOpenApi(postsPath + "/page.{index}.json", fileList.find(item =>
                        item.path.startsWith(postsPath) && item.path.includes("/page.")).data, {
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

            function fmtNum(num: number) {
                return num.toString().padStart(2, '0');
            }

            const archives = [];

            // Yearly
            for (var i = 0, len = years.length; i < len; i++) {
                const year = +years[i];
                const data = posts[year];
                if (!data[0].length) continue;

                const yearUrl = archivesPath + '/' + year;
                const months = [];
                const yearApi: any = {
                    year: year,
                    api: yearUrl + ".json"
                };

                if (archive_generator.monthly || archive_generator.daily) {
                    // Monthly
                    for (var month = 1; month <= 12; month++) {
                        const monthData = data[month];
                        if (!monthData.length) continue;

                        const monthUrl = yearUrl + '/' + fmtNum(month);
                        const days = [];
                        const monthApi: any = {
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
                generateOpenApi(archivesPath + "/{year}.json", fileList.find(item =>
                    item.path.startsWith(archivesPath)
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
                    generateOpenApi(archivesPath + "/{year}/page.{index}.json", fileList.find(item =>
                        item.path.startsWith(archivesPath)
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
                    generateOpenApi(archivesPath + "/{year}/{month}.json", fileList.find(item =>
                        item.path.startsWith(archivesPath)
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
                        generateOpenApi(archivesPath + "/{year}/{month}/page.{index}.json", fileList.find(item =>
                            item.path.startsWith(archivesPath)
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
                    generateOpenApi(archivesPath + "/{year}/{month}/{day}.json", fileList.find(item =>
                        item.path.startsWith(archivesPath)
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
                        generateOpenApi(archivesPath + "/{year}/{month}/{day}/page.{index}.json", fileList.find(item =>
                            item.path.startsWith(archivesPath)
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
        const pages: { title: string, url: string, api: string }[] = [];

        var simple: { path: string, data: string };

        fileList.push(...((site.pages as any).data as Model<Hexo.Locals.Page>).map(page => {
            const path = getPageApi(page);
            simple = createFile(
                path,
                {
                    title: page.title,
                    date: page.date,
                    updated: page.updated,
                    comments: page.comments,
                    url: page.path,
                    excerpt: convertToText(page.excerpt),
                    cover: page.cover ?? page.banner,
                    images: fetchImages(page.content),
                    content: page.content,
                    raw: page.raw
                }
            );

            pages.push({
                title: page.title,
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
        const resources = [];

        swipier.forEach(i => resources.push(...(posts.filter(v => v.cover && v.slug == i) as any as Hexo.Locals.Post[])));

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
        const resource = [];

        if (postList) {
            postList.forEach(post => {
                if (post.indexing != undefined && !post.indexing) {
                    return;
                }
                const temp_post: any = {};
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
                    const tags = [];
                    post.tags.forEach(tag => tags.push((tag as any).name));
                    temp_post.tags = tags
                }
                if (post.categories && post.categories.length > 0) {
                    const categories = [];
                    post.categories.forEach(cate => categories.push((cate as any).name));
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
