"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTestAnnotation = validateTestAnnotation;
exports.validateTestDetails = validateTestDetails;
const mcpBundle_1 = require("copilotbrowser-core/lib/mcpBundle");
const testAnnotationSchema = mcpBundle_1.z.object({
    type: mcpBundle_1.z.string(),
    description: mcpBundle_1.z.string().optional(),
});
const testDetailsSchema = mcpBundle_1.z.object({
    tag: mcpBundle_1.z.union([
        mcpBundle_1.z.string().optional(),
        mcpBundle_1.z.array(mcpBundle_1.z.string())
    ]).transform(val => Array.isArray(val) ? val : val !== undefined ? [val] : []).refine(val => val.every(v => v.startsWith('@')), {
        message: "Tag must start with '@'"
    }),
    annotation: mcpBundle_1.z.union([
        testAnnotationSchema,
        mcpBundle_1.z.array(testAnnotationSchema).optional()
    ]).transform(val => Array.isArray(val) ? val : val !== undefined ? [val] : []),
});
function validateTestAnnotation(annotation) {
    try {
        return testAnnotationSchema.parse(annotation);
    }
    catch (error) {
        throwZodError(error);
    }
}
function validateTestDetails(details, location) {
    try {
        const parsedDetails = testDetailsSchema.parse(details);
        return {
            annotations: parsedDetails.annotation.map(a => ({ ...a, location })),
            tags: parsedDetails.tag,
            location,
        };
    }
    catch (error) {
        throwZodError(error);
    }
}
function throwZodError(error) {
    throw new Error(error.issues.map(i => i.message).join('\n'));
}
