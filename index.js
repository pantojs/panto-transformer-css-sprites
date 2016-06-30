/**
 * Copyright (C) 2016 pantojs.xyz
 * index.js
 *
 * changelog
 * 2016-06-30[17:11:56]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */

'use strict';

const Transformer = require('panto-transformer');
const spritesmith = require('spritesmith');
const path = require('path');
const url = require('url');
const css = require('css');

class CssSpritesTransformer extends Transformer {
    _transform(file) {

        const {
            content,
            filename
        } = file;

        const urlReg = '\\burl\\(\\s*([\'"])?(.+?)\\1?\\s*\\)';

        const absResPath = (res) => {
            return panto.file.locate(path.join(path.dirname(
                filename), res));
        };

        return new Promise(resolve => {
            const ast = css.parse(content, {
                source: filename
            });
            resolve(ast);
        }).then(ast => {
            const imageUrls = [];

            ast.stylesheet.rules.forEach(rule => {
                if ('rule' === rule.type) {
                    rule.declarations.forEach(declaration => {
                        if (/^background(-image)?/i.test(declaration.property)) {
                            let result;
                            const ur = new RegExp(urlReg, 'g');
                            while ((result = ur.exec(declaration.value))) {
                                let originUrl = result[2];
                                let parsedUrl = url.parse(originUrl, true);
                                if ('__sprite' in parsedUrl.query) {
                                    imageUrls.push(path.join(path.dirname(
                                        filename), parsedUrl.pathname));
                                }
                            }
                        }
                    });
                }
            });
            return {
                ast,
                imageUrls
            };
        }).then(({
            ast,
            imageUrls
        }) => {
            return new Promise((resolve, reject) => {
                spritesmith.run({
                    src: imageUrls.map(panto.file.locate)
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve({
                        result,
                        ast
                    });
                    // result.image; // Buffer representation of image 
                    // result.coordinates; // Object mapping filename to {x, y, width, height} of image 
                    // result.properties; // Object with metadata about spritesheet {width, height} 
                });
            });
        }).then(({
            result,
            ast
        }) => {
            const spriteUrl = path.dirname(filename) + `/sprite-${Date.now()}.png`;
            const ur = new RegExp(urlReg);
            // Merge sprites to css
            ast.stylesheet.rules.forEach(rule => {
                if ('rule' === rule.type) {
                    rule.declarations.forEach(declaration => {
                        if (/^background(\-image)?/i.test(declaration.property)) {
                            // Support CSS3 multiple backgrounds
                            let covers = (declaration.value || '').split(',');
                            declaration.value = covers.map(cover => {
                                const matches = cover.match(ur);

                                if (matches && matches[2]) {
                                    let parsedUrl = url.parse(matches[2], true);
                                    let cood;
                                    if (!(cood = result.coordinates[absResPath(parsedUrl.pathname)])) {
                                        return cover;
                                    }

                                    if ('background' === declaration.property) {
                                        return `url(${spriteUrl}) ${cood.x}px ${cood.y}px no-repeat`;
                                    } else {
                                        return `url(${spriteUrl})`;
                                    }
                                } else {
                                    return cover;
                                }
                            }).join(', ');
                        }
                    });
                }
            });

            console.log(css.stringify(ast));

        });
    }
}

module.exports = CssSpritesTransformer;