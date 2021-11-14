import * as vscode from "vscode";

import Config from "#/Model/Config";
import ConfigProvider, { OnConfigDirtyListener } from "./ConfigProvider";

export default class VscodeConfigProvider implements ConfigProvider {
    private onConfigDirtyListener: OnConfigDirtyListener = () => {};
    private config: vscode.WorkspaceConfiguration;
    private configKey = "shouldAutoRestoreOnBranchSwitches";

    constructor(context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration(
            "git-branch-wise-session"
        );
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(() => {
                this.onConfigDirtyListener(this.provide());
            })
        );
    }

    provide(): Config {
        const shouldAutoRestoreOnBranchSwitches = this.config.get<boolean>(
            this.configKey,
            false
        );

        return {
            shouldAutoRestoreOnBranchSwitches,
        };
    }

    setOnConfigDirtyListener(listener: OnConfigDirtyListener) {
        this.onConfigDirtyListener = listener;
    }
}
