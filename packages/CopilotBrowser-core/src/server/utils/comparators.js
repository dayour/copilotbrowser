"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComparator = getComparator;
exports.compareBuffersOrStrings = compareBuffersOrStrings;
const compare_1 = require("./image_tools/compare");
// @ts-ignore
const pixelmatch_1 = __importDefault(require("../../third_party/pixelmatch"));
const utilsBundle_1 = require("../../utilsBundle");
const utilsBundle_2 = require("../../utilsBundle");
const utilsBundle_3 = require("../../utilsBundle");
const imageUtils_1 = require("./imageUtils");
function getComparator(mimeType) {
    if (mimeType === 'image/png')
        return compareImages.bind(null, 'image/png');
    if (mimeType === 'image/jpeg')
        return compareImages.bind(null, 'image/jpeg');
    if (mimeType === 'text/plain')
        return compareText;
    return compareBuffersOrStrings;
}
const JPEG_JS_MAX_BUFFER_SIZE_IN_MB = 5 * 1024; // ~5 GB
function compareBuffersOrStrings(actualBuffer, expectedBuffer) {
    if (typeof actualBuffer === 'string')
        return compareText(actualBuffer, expectedBuffer);
    if (!actualBuffer || !(actualBuffer instanceof Buffer))
        return { errorMessage: 'Actual result should be a Buffer or a string.' };
    if (Buffer.compare(actualBuffer, expectedBuffer))
        return { errorMessage: 'Buffers differ' };
    return null;
}
function compareImages(mimeType, actualBuffer, expectedBuffer, options = {}) {
    if (!actualBuffer || !(actualBuffer instanceof Buffer))
        return { errorMessage: 'Actual result should be a Buffer.' };
    validateBuffer(expectedBuffer, mimeType);
    let actual = mimeType === 'image/png' ? utilsBundle_3.PNG.sync.read(actualBuffer) : utilsBundle_1.jpegjs.decode(actualBuffer, { maxMemoryUsageInMB: JPEG_JS_MAX_BUFFER_SIZE_IN_MB });
    let expected = mimeType === 'image/png' ? utilsBundle_3.PNG.sync.read(expectedBuffer) : utilsBundle_1.jpegjs.decode(expectedBuffer, { maxMemoryUsageInMB: JPEG_JS_MAX_BUFFER_SIZE_IN_MB });
    const size = { width: Math.max(expected.width, actual.width), height: Math.max(expected.height, actual.height) };
    let sizesMismatchError = '';
    if (expected.width !== actual.width || expected.height !== actual.height) {
        sizesMismatchError = `Expected an image ${expected.width}px by ${expected.height}px, received ${actual.width}px by ${actual.height}px. `;
        actual = (0, imageUtils_1.padImageToSize)(actual, size);
        expected = (0, imageUtils_1.padImageToSize)(expected, size);
    }
    const diff = new utilsBundle_3.PNG({ width: size.width, height: size.height });
    let count;
    if (options.comparator === 'ssim-cie94') {
        count = (0, compare_1.compare)(expected.data, actual.data, diff.data, size.width, size.height, {
            // All ΔE* formulae are originally designed to have the difference of 1.0 stand for a "just noticeable difference" (JND).
            // See https://en.wikipedia.org/wiki/Color_difference#CIELAB_%CE%94E*
            maxColorDeltaE94: 1.0,
        });
    }
    else if ((options.comparator ?? 'pixelmatch') === 'pixelmatch') {
        count = (0, pixelmatch_1.default)(expected.data, actual.data, diff.data, size.width, size.height, {
            threshold: options.threshold ?? 0.2,
        });
    }
    else {
        throw new Error(`Configuration specifies unknown comparator "${options.comparator}"`);
    }
    const maxDiffPixels1 = options.maxDiffPixels;
    const maxDiffPixels2 = options.maxDiffPixelRatio !== undefined ? expected.width * expected.height * options.maxDiffPixelRatio : undefined;
    let maxDiffPixels;
    if (maxDiffPixels1 !== undefined && maxDiffPixels2 !== undefined)
        maxDiffPixels = Math.min(maxDiffPixels1, maxDiffPixels2);
    else
        maxDiffPixels = maxDiffPixels1 ?? maxDiffPixels2 ?? 0;
    const ratio = Math.ceil(count / (expected.width * expected.height) * 100) / 100;
    const pixelsMismatchError = count > maxDiffPixels ? `${count} pixels (ratio ${ratio.toFixed(2)} of all image pixels) are different.` : '';
    if (pixelsMismatchError || sizesMismatchError)
        return { errorMessage: sizesMismatchError + pixelsMismatchError, diff: utilsBundle_3.PNG.sync.write(diff) };
    return null;
}
function validateBuffer(buffer, mimeType) {
    if (mimeType === 'image/png') {
        const pngMagicNumber = [137, 80, 78, 71, 13, 10, 26, 10];
        if (buffer.length < pngMagicNumber.length || !pngMagicNumber.every((byte, index) => buffer[index] === byte))
            throw new Error('Could not decode expected image as PNG.');
    }
    else if (mimeType === 'image/jpeg') {
        const jpegMagicNumber = [255, 216];
        if (buffer.length < jpegMagicNumber.length || !jpegMagicNumber.every((byte, index) => buffer[index] === byte))
            throw new Error('Could not decode expected image as JPEG.');
    }
}
function compareText(actual, expectedBuffer) {
    if (typeof actual !== 'string')
        return { errorMessage: 'Actual result should be a string' };
    let expected = expectedBuffer.toString('utf-8');
    if (expected === actual)
        return null;
    // Eliminate '\\ No newline at end of file'
    if (!actual.endsWith('\n'))
        actual += '\n';
    if (!expected.endsWith('\n'))
        expected += '\n';
    const lines = utilsBundle_2.diff.createPatch('file', expected, actual, undefined, undefined, { context: 5 }).split('\n');
    const coloredLines = lines.slice(4).map(line => {
        if (line.startsWith('-'))
            return utilsBundle_2.colors.green(line);
        if (line.startsWith('+'))
            return utilsBundle_2.colors.red(line);
        if (line.startsWith('@@'))
            return utilsBundle_2.colors.dim(line);
        return line;
    });
    const errorMessage = coloredLines.join('\n');
    return { errorMessage };
}
