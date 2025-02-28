| Issues | License |  NPM  |
|--------|---------|-------|
[![Github Issues](https://img.shields.io/github/issues/wherewhere/hexo-generator-apis)](https://github.com/wherewhere/hexo-generator-apis/issues)|[![License](https://img.shields.io/github/license/wherewhere/hexo-generator-apis)](https://github.com/wherewhere/hexo-generator-apis/blob/main/LICENSE)|[![NPM Status](https://img.shields.io/npm/dt/hexo-generator-apis.svg?style=flat)](https://www.npmjs.com/package/hexo-generator-apis)

# hexo-generator-apis
Generate restful json data for Hexo plugins. Based on [hexo-generator-xapi](https://github.com/bmqy/hexo-generator-xapi)

## Example
魔法薇ㄦ的书馆 OpenAPI 描述文件 [openapi.json](https://wherewhere.github.io/api/openapi.json)，或前往 [Swagger UI](https://wherewhere.github.io/api) 查看 API 文档

## Install
```sh
npm install hexo-generator-apis --save
```

## Configuration
**加入以下默认配置, 属性值为 `false` 表示不生成**

```yml
# API Generator
restful_xapi:           # RESTful API 配置 
  enable: true            # 默认开启
  site: [                 # hexo.config mix theme.config
      "title",            # site 可配置为数组选择性生成某些属性
      "subtitle",         # site: ['title', 'subtitle', 'description', 'author', 'since', email', 'favicon', 'avatar']
      "description",      # site: true
      "author",
      "language",
      "timezone",
      "url",
      "keywords"
    ]
  posts_props:            # 文章列表项的需要生成的属性
    comments: true          # 是否允许评论
    excerpt: true           # 文章摘要
    description: false      # 文章描述
    language: false         # 文章语言
    keywords: false         # 关键字
    cover: true             # 封面图
    content: false          # 文章内容
    raw: false              # 原始内容
    categories: true        # 分类
    tags: true              # 标签
  categories:             # 分类数据
    enable: true            # 默认开启
    category_generator:     # 默认为 hexo-generator-category 设置
      per_page: 10            # 每页显示的文章数量
      order_by: -date         # 排序方式
  tags: true              # 标签数据
    enable: true            # 默认开启
    tag_generator:          # 默认为 hexo-generator-tag 设置
      per_page: 10            # 每页显示的文章数量
      order_by: -date         # 排序方式
  posts:                  # 文章数据
    enable: true            # 默认开启
    index_generator:        # 默认为 hexo-generator-index 设置
      enable: true            # hexo-generator-index 安装则开启
      per_page: 10            # 每页显示的文章数量
      order_by: "-date"       # 排序方式
    archive_generator:      # 默认为 hexo-generator-archive 设置
      enable: true            # hexo-generator-archive 安装则开启
      per_page: 10            # 每页显示的文章数量
      monthly: true           # 是否生成月归档
      daily: false            # 是否生成日归档
      order_by: -date         # 排序方式
  pages: true             # 额外的 Hexo 页面数据, 如 About
  swipers_list: []        # 生成指定的页面信息,填写你文章文件夹名称比如['css','js']，不加后缀名,主要用于轮播图api
  search_all:             # 全局搜索
    enable: true            # 默认开启
    path: api/search.json   # 默认路径
    cover: true             # 是否生成封面图
    excerpt: false          # 是否生成摘要
    content: true           # 是否生成内容
  openapi:                # OpenAPI 3.0 描述文件
    enable: true            # 默认开启
    path: api/openapi.json  # 默认路径
    info:                   # OpenAPI 3.0 信息
      title:                  # API 标题
      description:            # API 描述
      termsOfService:         # 服务条款
      contact:                # 联系方式
        name:                   # 联系人
        url:                    # 联系地址
        email:                  # 联系邮箱
      license:                # 许可证
        name:                   # 许可证名称
        url:                    # 许可证地址
      version: "1.0.0"        # API 版本
    externalDocs:           # OpenAPI 3.0 外部文档
      description:            # 外部文档描述
      url:                    # 外部文档地址
    servers:                # OpenAPI 3.0 服务器
      - url:                  # API 服务器地址
        description:          # API 服务器描述
```

## Document
| 请求方式 | 请求地址 | 请求详情 |
|---------|---------|---------|
Get | `/api/init.json` | 获取所有可用的 API
Get | `/api/site.json` | 获取所有的 Hexo 配置 (站点的配置和主题的配置)
Get | `/api/posts.json` | 获取文章分页列表，如果配置 `posts.index_generator.per_page: 0` 则不分页，获取全部文章
Get | `/api/posts/page.{index}.json` | 获取分页数据, 设置列表分类后, `index` 为动态变量 (页数), eg: `/api/posts/page.1.json`
Get | `/api/tags.json` | 获取所有的文章标签，无标签则不生成
Get | `/api/tags/{slug}.json` | 获取指定的标签文章列表, `slug` 为标签的别名, eg: `/api/tags/web.json`
Get | `/api/tags/{slug}/page.{index}.json` | 获取指定的标签文章列表分页数据
Get | `/api/categories.json` | 获取所有的文章分类
Get | `/api/categories/{slug}.json` | 获取指定分类的文章列表
Get | `/api/categories/{slug}/page.{index}.json` | 获取指定分类的文章列表分页数据
Get | `/api/posts/{path}.json` | 根据文章的别名获取文章的详细的数据，`path` 为文章路径
Get | `/api/pages.json` | 获取 Hexo 隐式页面的列表
Get | `/api/pages/{path}.json` | 获取 Hexo 隐式页面的内容, `path` 为页面路径
Get | `/api/archives.json` | 获取所有的文章归档
Get | `/api/archives/{year}.json` | 获取指定年份的文章列表
Get | `/api/archives/{year}/page.{index}.json` | 获取指定年份的文章列表分页数据
Get | `/api/archives/{year}/{month}.json` | 获取指定年份和月份的文章列表
Get | `/api/archives/{year}/{month}/page.{index}.json` | 获取指定年份和月份的文章列表分页数据
Get | `/api/archives/{year}/{month}/{day}.json` | 获取指定年份、月份和日期的文章列表
Get | `/api/archives/{year}/{month}/{day}/page.{index}.json` | 获取指定年份、月份和日期的文章列表分页数据
Get | `/api/swiper.json` | 获取指定的列表别名的文章列表, eg: `['web', 'hexo', 'java']` 数组中的字符为指定文章的别名，功能主要用于微信小程序轮播图文章的指定动态配置
Get | `/api/search.json` | 获取全部文档，用于本地全局搜索
Get | `/api/openapi.json` | 获取 OpenAPI 3.0 描述文件
