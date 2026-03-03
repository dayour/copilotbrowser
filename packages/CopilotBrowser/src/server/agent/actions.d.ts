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
import type * as z from 'zod';
declare const navigateActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"navigate">;
    url: z.ZodString;
}, z.core.$strip>;
export type NavigateAction = z.infer<typeof navigateActionSchema>;
declare const clickActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"click">;
    selector: z.ZodString;
    button: z.ZodOptional<z.ZodEnum<{
        left: "left";
        right: "right";
        middle: "middle";
    }>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        Alt: "Alt";
        Control: "Control";
        ControlOrMeta: "ControlOrMeta";
        Meta: "Meta";
        Shift: "Shift";
    }>>>;
}, z.core.$strip>;
export type ClickAction = z.infer<typeof clickActionSchema>;
declare const dragActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"drag">;
    sourceSelector: z.ZodString;
    targetSelector: z.ZodString;
}, z.core.$strip>;
export type DragAction = z.infer<typeof dragActionSchema>;
declare const hoverActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"hover">;
    selector: z.ZodString;
    modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        Alt: "Alt";
        Control: "Control";
        ControlOrMeta: "ControlOrMeta";
        Meta: "Meta";
        Shift: "Shift";
    }>>>;
}, z.core.$strip>;
export type HoverAction = z.infer<typeof hoverActionSchema>;
declare const selectOptionActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"selectOption">;
    selector: z.ZodString;
    labels: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SelectOptionAction = z.infer<typeof selectOptionActionSchema>;
declare const pressActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"pressKey">;
    key: z.ZodString;
}, z.core.$strip>;
export type PressAction = z.infer<typeof pressActionSchema>;
declare const pressSequentiallyActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"pressSequentially">;
    selector: z.ZodString;
    text: z.ZodString;
    submit: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type PressSequentiallyAction = z.infer<typeof pressSequentiallyActionSchema>;
declare const fillActionSchema: z.ZodObject<{
    method: z.ZodLiteral<"fill">;
    selector: z.ZodString;
    text: z.ZodString;
    submit: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type FillAction = z.infer<typeof fillActionSchema>;
declare const setCheckedSchema: z.ZodObject<{
    method: z.ZodLiteral<"setChecked">;
    selector: z.ZodString;
    checked: z.ZodBoolean;
}, z.core.$strip>;
export type SetChecked = z.infer<typeof setCheckedSchema>;
declare const expectVisibleSchema: z.ZodObject<{
    method: z.ZodLiteral<"expectVisible">;
    selector: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ExpectVisible = z.infer<typeof expectVisibleSchema>;
declare const expectValueSchema: z.ZodObject<{
    method: z.ZodLiteral<"expectValue">;
    selector: z.ZodString;
    type: z.ZodEnum<{
        checkbox: "checkbox";
        combobox: "combobox";
        radio: "radio";
        slider: "slider";
        textbox: "textbox";
    }>;
    value: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ExpectValue = z.infer<typeof expectValueSchema>;
declare const expectAriaSchema: z.ZodObject<{
    method: z.ZodLiteral<"expectAria">;
    template: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ExpectAria = z.infer<typeof expectAriaSchema>;
declare const expectURLSchema: z.ZodObject<{
    method: z.ZodLiteral<"expectURL">;
    value: z.ZodOptional<z.ZodString>;
    regex: z.ZodOptional<z.ZodString>;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ExpectURL = z.infer<typeof expectURLSchema>;
declare const expectTitleSchema: z.ZodObject<{
    method: z.ZodLiteral<"expectTitle">;
    value: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type ExpectTitle = z.infer<typeof expectTitleSchema>;
declare const actionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    method: z.ZodLiteral<"navigate">;
    url: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"click">;
    selector: z.ZodString;
    button: z.ZodOptional<z.ZodEnum<{
        left: "left";
        right: "right";
        middle: "middle";
    }>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        Alt: "Alt";
        Control: "Control";
        ControlOrMeta: "ControlOrMeta";
        Meta: "Meta";
        Shift: "Shift";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"drag">;
    sourceSelector: z.ZodString;
    targetSelector: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"hover">;
    selector: z.ZodString;
    modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        Alt: "Alt";
        Control: "Control";
        ControlOrMeta: "ControlOrMeta";
        Meta: "Meta";
        Shift: "Shift";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"selectOption">;
    selector: z.ZodString;
    labels: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"pressKey">;
    key: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"pressSequentially">;
    selector: z.ZodString;
    text: z.ZodString;
    submit: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"fill">;
    selector: z.ZodString;
    text: z.ZodString;
    submit: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"setChecked">;
    selector: z.ZodString;
    checked: z.ZodBoolean;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectVisible">;
    selector: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectValue">;
    selector: z.ZodString;
    type: z.ZodEnum<{
        checkbox: "checkbox";
        combobox: "combobox";
        radio: "radio";
        slider: "slider";
        textbox: "textbox";
    }>;
    value: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectAria">;
    template: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectURL">;
    value: z.ZodOptional<z.ZodString>;
    regex: z.ZodOptional<z.ZodString>;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectTitle">;
    value: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>], "method">;
export type Action = z.infer<typeof actionSchema>;
declare const actionWithCodeSchema: z.ZodIntersection<z.ZodDiscriminatedUnion<[z.ZodObject<{
    method: z.ZodLiteral<"navigate">;
    url: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"click">;
    selector: z.ZodString;
    button: z.ZodOptional<z.ZodEnum<{
        left: "left";
        right: "right";
        middle: "middle";
    }>>;
    clickCount: z.ZodOptional<z.ZodNumber>;
    modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        Alt: "Alt";
        Control: "Control";
        ControlOrMeta: "ControlOrMeta";
        Meta: "Meta";
        Shift: "Shift";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"drag">;
    sourceSelector: z.ZodString;
    targetSelector: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"hover">;
    selector: z.ZodString;
    modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        Alt: "Alt";
        Control: "Control";
        ControlOrMeta: "ControlOrMeta";
        Meta: "Meta";
        Shift: "Shift";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"selectOption">;
    selector: z.ZodString;
    labels: z.ZodArray<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"pressKey">;
    key: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"pressSequentially">;
    selector: z.ZodString;
    text: z.ZodString;
    submit: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"fill">;
    selector: z.ZodString;
    text: z.ZodString;
    submit: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"setChecked">;
    selector: z.ZodString;
    checked: z.ZodBoolean;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectVisible">;
    selector: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectValue">;
    selector: z.ZodString;
    type: z.ZodEnum<{
        checkbox: "checkbox";
        combobox: "combobox";
        radio: "radio";
        slider: "slider";
        textbox: "textbox";
    }>;
    value: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectAria">;
    template: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectURL">;
    value: z.ZodOptional<z.ZodString>;
    regex: z.ZodOptional<z.ZodString>;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    method: z.ZodLiteral<"expectTitle">;
    value: z.ZodString;
    isNot: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>], "method">, z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>>;
export type ActionWithCode = z.infer<typeof actionWithCodeSchema>;
export declare const cachedActionsSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    actions: z.ZodArray<z.ZodIntersection<z.ZodDiscriminatedUnion<[z.ZodObject<{
        method: z.ZodLiteral<"navigate">;
        url: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"click">;
        selector: z.ZodString;
        button: z.ZodOptional<z.ZodEnum<{
            left: "left";
            right: "right";
            middle: "middle";
        }>>;
        clickCount: z.ZodOptional<z.ZodNumber>;
        modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            Alt: "Alt";
            Control: "Control";
            ControlOrMeta: "ControlOrMeta";
            Meta: "Meta";
            Shift: "Shift";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"drag">;
        sourceSelector: z.ZodString;
        targetSelector: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"hover">;
        selector: z.ZodString;
        modifiers: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            Alt: "Alt";
            Control: "Control";
            ControlOrMeta: "ControlOrMeta";
            Meta: "Meta";
            Shift: "Shift";
        }>>>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"selectOption">;
        selector: z.ZodString;
        labels: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"pressKey">;
        key: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"pressSequentially">;
        selector: z.ZodString;
        text: z.ZodString;
        submit: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"fill">;
        selector: z.ZodString;
        text: z.ZodString;
        submit: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"setChecked">;
        selector: z.ZodString;
        checked: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"expectVisible">;
        selector: z.ZodString;
        isNot: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"expectValue">;
        selector: z.ZodString;
        type: z.ZodEnum<{
            checkbox: "checkbox";
            combobox: "combobox";
            radio: "radio";
            slider: "slider";
            textbox: "textbox";
        }>;
        value: z.ZodString;
        isNot: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"expectAria">;
        template: z.ZodString;
        isNot: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"expectURL">;
        value: z.ZodOptional<z.ZodString>;
        regex: z.ZodOptional<z.ZodString>;
        isNot: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        method: z.ZodLiteral<"expectTitle">;
        value: z.ZodString;
        isNot: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>], "method">, z.ZodObject<{
        code: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>>;
export type CachedActions = z.infer<typeof cachedActionsSchema>;
export {};
