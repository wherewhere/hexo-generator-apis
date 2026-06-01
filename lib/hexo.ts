import type Hexo from "hexo";
export type { Hexo };

export type {
    BaseGeneratorReturn,
    CategorySchema,
    PostSchema,
    PageSchema,
    SiteLocals,
    TagSchema
} from "hexo/dist/types";

import type { SiteLocals as _SiteLocals } from "hexo/dist/types";
export namespace SiteLocals {
    declare const _instance: _SiteLocals;
    export type Categories = typeof _instance.categories;
    export type Pages = typeof _instance.pages;
    export type Posts = typeof _instance.posts;
    export type Tags = typeof _instance.tags;
}
