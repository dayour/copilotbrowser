import type { TestRunnerPlugin } from '.';
import type { FullConfig } from '../../types/testReporter';
import type { FullConfigInternal } from '../common/config';
import type { ReporterV2 } from '../reporters/reporterV2';
export type WebServerPluginOptions = {
    command: string;
    url?: string;
    wait?: {
        stdout?: RegExp;
        stderr?: RegExp;
    };
    ignoreHTTPSErrors?: boolean;
    timeout?: number;
    gracefulShutdown?: {
        signal: 'SIGINT' | 'SIGTERM';
        timeout?: number;
    };
    reuseExistingServer?: boolean;
    cwd?: string;
    env?: {
        [key: string]: string;
    };
    stdout?: 'pipe' | 'ignore';
    stderr?: 'pipe' | 'ignore';
    name?: string;
};
export declare class WebServerPlugin implements TestRunnerPlugin {
    private _isAvailableCallback?;
    private _killProcess?;
    private _processExitedPromise;
    private _options;
    private _checkPortOnly;
    private _reporter?;
    private _waitForStdioPromise;
    name: string;
    constructor(options: WebServerPluginOptions, checkPortOnly: boolean);
    setup(config: FullConfig, configDir: string, reporter: ReporterV2): Promise<void>;
    teardown(): Promise<void>;
    private _startProcess;
    private _waitForProcess;
}
export declare const webServer: (options: WebServerPluginOptions) => TestRunnerPlugin;
export declare const webServerPluginsForConfig: (config: FullConfigInternal) => TestRunnerPlugin[];
