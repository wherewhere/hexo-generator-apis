import type { PostSchema, SiteLocals } from "./hexo";

export type Config = typeof hexo.config
    & {
        restful_xapi: RestfulXApi,
        category_generator: CategoryGenerator,
        tag_generator: CategoryGenerator,
        index_generator: IndexGenerator,
        archive_generator: ArchiveGenerator
    }

export type PostsProps = {
    [key in keyof PostSchema]?: boolean;
};

export type CategoryGenerator = {
    per_page: number;
    order_by: string;
};

export type IndexGenerator = {
    enable: boolean;
    per_page: number;
    order_by: string;
};

export type ArchiveGenerator = {
    enable: boolean;
    per_page: number;
    yearly?: boolean;
    monthly: boolean;
    daily: boolean;
    order_by: string;
};

export type SearchAll = {
    enable: boolean;
    path: string;
    cover: boolean;
    excerpt: boolean;
    content: boolean;
};

export type OpenApiInfoContact = {
    name?: string;
    url?: string;
    email?: string;
};

export type OpenApiInfoLicense = {
    name?: string;
    url?: string;
};

export type OpenApiInfo = {
    title?: string;
    description?: string;
    termsOfService?: string;
    contact?: OpenApiInfoContact;
    version?: string;
    license?: OpenApiInfoLicense;
};

export type OpenApiExternalDocs = {
    description?: string;
    url?: string;
};

export type OpenApiServer = {
    url: string;
    description?: string;
};

export type OpenApi = {
    enable: boolean;
    path: string;
    info: OpenApiInfo;
    externalDocs?: OpenApiExternalDocs;
    servers?: OpenApiServer[];
};

export type RestfulXApi = {
    enable: boolean;
    site: boolean | string[];
    posts_props: PostsProps;
    categories: { enable: boolean; category_generator: CategoryGenerator };
    tags: { enable: boolean; tag_generator: CategoryGenerator };
    posts: {
        enable: boolean;
        index_generator: IndexGenerator;
        archive_generator: ArchiveGenerator;
    };
    pages: boolean;
    swipers_list: string[];
    search_all: SearchAll;
    openapi: OpenApi;
};

export type Cate = {
    path: string;
    data: {
        name: string;
        slug: string;
        posts: SiteLocals.Posts;
        api: string;
    };
};
