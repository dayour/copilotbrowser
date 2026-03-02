import type { CRPage } from './crPage';
import type * as types from '../types';
import type { Progress } from '../progress';
declare global {
    interface Window {
        __cleanupDrag?: () => Promise<boolean>;
    }
}
export declare class DragManager {
    private _crPage;
    private _dragState;
    private _lastPosition;
    constructor(page: CRPage);
    cancelDrag(): Promise<boolean>;
    interceptDragCausedByMove(progress: Progress, x: number, y: number, button: types.MouseButton | 'none', buttons: Set<types.MouseButton>, modifiers: Set<types.KeyboardModifier>, moveCallback: () => Promise<void>): Promise<void>;
    isDragging(): boolean;
    drop(progress: Progress, x: number, y: number, modifiers: Set<types.KeyboardModifier>): Promise<void>;
}
