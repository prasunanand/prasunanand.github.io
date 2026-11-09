# prasunanand.github.io

Source for Prasun Anand's blog, published at <https://prasunanand.github.io>.

## Run locally

Requires Ruby (tested with 3.4) and Bundler.

```bash
bundle install
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000>.

## Deployment

GitHub Pages builds and publishes the site from the `master` branch on every push.
There is no separate deploy step.

Note that GitHub Pages builds with its own pinned Jekyll (3.10) and an allowlist of
plugins, not with this repo's `Gemfile`. Only use plugins that GitHub Pages supports.

## Writing a post

Add a file to `_posts/` named `YYYY-MM-DD-slug.markdown` with front matter like:

```yaml
---
layout: post
title:  "Post title"
date:   2018-02-24 12:10:41 +0530
categories: ruby cuda
author: Prasun Anand
banner: /images/banner.png
---
```

`categories` become the post's tags and are part of its URL.
