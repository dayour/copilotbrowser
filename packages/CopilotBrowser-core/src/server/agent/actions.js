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
exports.cachedActionsSchema = void 0;
const mcpBundle_1 = require("../../mcpBundle");
const modifiersSchema = mcpBundle_1.z.array(mcpBundle_1.z.enum(['Alt', 'Control', 'ControlOrMeta', 'Meta', 'Shift']));
const navigateActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('navigate'),
    url: mcpBundle_1.z.string(),
});
const clickActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('click'),
    selector: mcpBundle_1.z.string(),
    button: mcpBundle_1.z.enum(['left', 'right', 'middle']).optional(),
    clickCount: mcpBundle_1.z.number().optional(),
    modifiers: modifiersSchema.optional(),
});
const dragActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('drag'),
    sourceSelector: mcpBundle_1.z.string(),
    targetSelector: mcpBundle_1.z.string(),
});
const hoverActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('hover'),
    selector: mcpBundle_1.z.string(),
    modifiers: modifiersSchema.optional(),
});
const selectOptionActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('selectOption'),
    selector: mcpBundle_1.z.string(),
    labels: mcpBundle_1.z.array(mcpBundle_1.z.string()),
});
const pressActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('pressKey'),
    key: mcpBundle_1.z.string(),
});
const pressSequentiallyActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('pressSequentially'),
    selector: mcpBundle_1.z.string(),
    text: mcpBundle_1.z.string(),
    submit: mcpBundle_1.z.boolean().optional(),
});
const fillActionSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('fill'),
    selector: mcpBundle_1.z.string(),
    text: mcpBundle_1.z.string(),
    submit: mcpBundle_1.z.boolean().optional(),
});
const setCheckedSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('setChecked'),
    selector: mcpBundle_1.z.string(),
    checked: mcpBundle_1.z.boolean(),
});
const expectVisibleSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('expectVisible'),
    selector: mcpBundle_1.z.string(),
    isNot: mcpBundle_1.z.boolean().optional(),
});
const expectValueSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('expectValue'),
    selector: mcpBundle_1.z.string(),
    type: mcpBundle_1.z.enum(['textbox', 'checkbox', 'radio', 'combobox', 'slider']),
    value: mcpBundle_1.z.string(),
    isNot: mcpBundle_1.z.boolean().optional(),
});
const expectAriaSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('expectAria'),
    template: mcpBundle_1.z.string(),
    isNot: mcpBundle_1.z.boolean().optional(),
});
const expectURLSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('expectURL'),
    value: mcpBundle_1.z.string().optional(),
    regex: mcpBundle_1.z.string().optional(),
    isNot: mcpBundle_1.z.boolean().optional(),
});
const expectTitleSchema = mcpBundle_1.z.object({
    method: mcpBundle_1.z.literal('expectTitle'),
    value: mcpBundle_1.z.string(),
    isNot: mcpBundle_1.z.boolean().optional(),
});
const actionSchema = mcpBundle_1.z.discriminatedUnion('method', [
    navigateActionSchema,
    clickActionSchema,
    dragActionSchema,
    hoverActionSchema,
    selectOptionActionSchema,
    pressActionSchema,
    pressSequentiallyActionSchema,
    fillActionSchema,
    setCheckedSchema,
    expectVisibleSchema,
    expectValueSchema,
    expectAriaSchema,
    expectURLSchema,
    expectTitleSchema,
]);
const actionWithCodeSchema = actionSchema.and(mcpBundle_1.z.object({
    code: mcpBundle_1.z.string(),
}));
exports.cachedActionsSchema = mcpBundle_1.z.record(mcpBundle_1.z.string(), mcpBundle_1.z.object({
    actions: mcpBundle_1.z.array(actionWithCodeSchema),
}));
