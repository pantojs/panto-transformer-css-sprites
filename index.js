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

        let {
            generateSpriteFilename
        } = this.options;

        if (!panto.util.isFunction(generateSpriteFilename)) {
            generateSpriteFilename = file => {
                return `sprite-${path.basename(file.filename)}.png`; 
            };
        }

        const urlReg = '\\burl\\(\\s*([\'"])?(.+?)\\1?\\s*\\)';

        const absResPath = res => {
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
            const rulesHaveUrl = [];
            let dpr = 1;
            ast.stylesheet.rules.forEach(rule => {
                if ('rule' === rule.type) {
                    let findUrlInRule = false;
                    rule.declarations.forEach(declaration => {
                        if (/^background(-image)?/i.test(declaration.property)) {
                            let result;
                            const ur = new RegExp(urlReg, 'g');
                            while ((result = ur.exec(declaration.value))) {
                                let originUrl = result[2];
                                let parsedUrl = url.parse(originUrl, true);
                                if ('__sprite' in parsedUrl.query) {
                                    findUrlInRule = true;
                                    imageUrls.push(path.join(path.dirname(
                                        filename), parsedUrl.pathname));
                                }
                                if ('dpr' in parsedUrl.query) {
                                    let d = parseInt(parsedUrl.query.dpr, 10);
                                    if (!isNaN(d) && d > 0) {
                                        dpr = Math.max(dpr, d);
                                    }
                                }
                            }
                        }
                    });
                    if (findUrlInRule) {
                        rulesHaveUrl.push(rule);
                    }
                }
            });
            return {
                ast,
                dpr,
                rulesHaveUrl,
                imageUrls
            };
        }).then(({
            ast,
            dpr,
            rulesHaveUrl,
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
                        dpr,
                        rulesHaveUrl,
                        ast
                    });
                });
            });
        }).then(({
            result,
            rulesHaveUrl,
            dpr,
            ast
        }) => {
            const spriteUrl = generateSpriteFilename.call(file, file);
            const ur = new RegExp(urlReg);
            // Merge sprites to css

            for (let rule of rulesHaveUrl) {
                for (let declaration of rule.declarations) {
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

                                if (dpr > 1) {
                                    let bss = rule.declarations.filter(d => (d.property ===
                                        'background-size'));
                                    if (bss[0]) {
                                        bss[0].value = `${result.properties.width/dpr}px auto`;
                                    } else {
                                        rule.declarations.push({
                                            type: 'declaration',
                                            property: 'background-size',
                                            value: `${result.properties.width/dpr}px auto`
                                        });
                                    }
                                }

                                if ('background' === declaration.property) {
                                    return `url(${spriteUrl}) -${cood.x/dpr}px -${cood.y/dpr}px no-repeat`;
                                } else {
                                    /*
                                     * Add background-repeat & background-position if not exist
                                     */
                                    let bps = rule.declarations.filter(d => (d.property ===
                                        'background-position'));
                                    // Only fix the first
                                    if (bps[0]) {
                                        bps[0].value = `-${cood.x/dpr}px -${cood.y/dpr}px`;
                                    } else {
                                        rule.declarations.push({
                                            type: 'declaration',
                                            property: 'background-position',
                                            value: `-${cood.x/dpr}px -${cood.y/dpr}px`
                                        });
                                    }

                                    let brs = rule.declarations.filter(d => (d.property ===
                                        'background-repeat'));
                                    // Only fix the first
                                    if (brs[0]) {
                                        brs[0].value = `no-repeat`;
                                    } else {
                                        rule.declarations.push({
                                            type: 'declaration',
                                            property: 'background-repeat',
                                            value: `no-repeat`
                                        });
                                    }
                                    return `url(${spriteUrl})`;
                                }

                            } else {
                                return cover;
                            }
                        }).join(', ');
                    }
                }
            }

            if (rulesHaveUrl.length) {
                return [panto.util.extend(file, {
                    content: css.stringify(ast)
                }), {
                    filename: spriteUrl,
                    content: result.image
                }];
            } else {
                return file;
            }


        });
    }
}

module.exports = CssSpritesTransformer;