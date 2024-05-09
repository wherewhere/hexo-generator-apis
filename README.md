# hexo-generator-apis
* 基于[hexo-generator-xapi](https://github.com/bmqy/hexo-generator-xapi)

## Install

```bash
npm install hexo-generator-apis --save
```

## 配置hexo文件下的 `_config.yml`

* 加入以下默认配置, 属性值为 `false` 表示不生成.

```yml
restful_xapi:
  # site 可配置为数组选择性生成某些属性
  # site: ['title', 'subtitle', 'description', 'author', 'since', email', 'favicon', 'avatar']
  # site: true        # hexo.config mix theme.config
  posts_size: 10    # 文章列表分页，0 表示不分页
  posts_props:      # 文章列表项的需要生成的属性
    title: true
    slug: true
    date: true
    updated: true
    comments: true
    path: true
    excerpt: false
    cover: true      # 封面图，取文章第一张图片
    content: false
    keywords: false
    categories: true
    tags: true
  categories: true         # 分类数据
  use_category_slug: false # Use slug for filename of category data
  tags: true               # 标签数据
  use_tag_slug: false      # Use slug for filename of tag data
  post: true               # 文章数据
  pages: false             # 额外的 Hexo 页面数据, 如 About
  swipers_list: []          # 生成指定的页面信息,填写你文章文件夹名称比如['css','js']，不加后缀名,主要用于轮播图api
  search_all:
    enable: true   # 默认开启
    path: api/search.json
    cover: true
    excerpt: false
    content: true
```

## Document

请求方式|请求地址|请求详情
-----|-----|-----
Get|`/api/site.json` |获取所有的Hexo配置(站点的配置和主题的配置)
Get|`/api/posts.json` | 如果配置 `posts_size: 0` 则不分页, 获取全部文章
Get|`/api/posts/:PageNum.json` | 获取分页数据, 设置列表分类后, `:PageNum` 为动态变量(页数), eg: `/api/1.json` .
Get|`/api/tags.json` | 获取所有的文章标签, 无标签则不生成
Get|`/api/tags/:TagName.json` | 获取指定的标签文章列表, `:TagName` 为你文章的自定义标签名, eg: `/api/tags/web.json` .
Get|`/api/categories.json` | 获取所有的文章的分类
Get|`/api/categories/:CateName` | 获取指定分类的文章列表
Get|`/api/articles/:Slug.json` | 根据文章的别名获取文章的详细的数据, `:Slug` 为文章的别名.
Get|`/api/swiper.json` | 获取指定的列表别名的文章列表, eg: `['web', 'hexo', 'java']` 数组中的字符为指定文章的别名, 功能主要用于微信小程序轮播图文章的指定动态配置
Get|`/api/search.json` | 获取全部文档, 用于本地全局搜索

### Get Implecit Pages

获取来自主题的 Hexo 隐式页面内容, 如 About 等. 因隐式页面(除 About 等导航栏入口页外)一般在 Hexo 不提供直接访问入口, 调用此 API 的开发者需要了解其完整路径, 此接口默认关闭.

eg: 

###### Request

```
GET /api/pages/about.json
```
