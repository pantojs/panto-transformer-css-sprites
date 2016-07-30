# panto-transformer-css-sprites
[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency status][david-dm-image]][david-dm-url] [![Dev Dependency status][david-dm-dev-image]][david-dm-dev-url]

CSS Sprites transformer for panto.

```js
panto.loadTransformer('css-sprites');

panto.pick('**/*.less').read().cssSprites({
    generateSpriteFilename: file => `sprite-${path.basename(file.filename)}.png`
});
```

## options
 - generateSpriteFilename: function

[npm-url]: https://npmjs.org/package/panto-transformer-css-sprites
[downloads-image]: http://img.shields.io/npm/dm/panto-transformer-css-sprites.svg
[npm-image]: http://img.shields.io/npm/v/panto-transformer-css-sprites.svg
[travis-url]: https://travis-ci.org/pantojs/panto-transformer-css-sprites
[travis-image]: http://img.shields.io/travis/pantojs/panto-transformer-css-sprites.svg
[david-dm-url]:https://david-dm.org/pantojs/panto-transformer-css-sprites
[david-dm-image]:https://david-dm.org/pantojs/panto-transformer-css-sprites.svg
[david-dm-dev-url]:https://david-dm.org/pantojs/panto-transformer-css-sprites#info=devDependencies
[david-dm-dev-image]:https://david-dm.org/pantojs/panto-transformer-css-sprites/dev-status.svg