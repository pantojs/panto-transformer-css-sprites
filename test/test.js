/**
 * Copyright (C) 2016 pantojs.xyz
 * test.js
 *
 * changelog
 * 2016-06-30[17:12:49]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const panto = require('panto');
const CssSpritesTransformer = require('../');

rimraf.sync(__dirname + '/fixtures/output', {
    force: true
});

describe('panto-transformer-css-sprites', () => {
    describe('#transform', () => {
        it('TODO', done => {
            panto.setOptions({
                cwd: __dirname + '/fixtures'
            })

            const cst = new CssSpritesTransformer();

            cst.transform({
                content: fs.readFileSync(__dirname + '/fixtures/test.css', 'utf8'),
                filename: 'test.css'
            }).then(files => {
                return files.map(file => {
                    return panto.file.write(path.basename(file.filename), file.content)
                });
            }).then(() => {
                done();
            });
        });

    });
});