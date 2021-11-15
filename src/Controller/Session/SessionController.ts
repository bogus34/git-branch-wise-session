import Session from '#/Model/Session';
import Config from '#/Model/Config';

import WindowDelegate from '#/Delegate/Window/WindowDelegate';
import SessionManagerDelegate from '#/Delegate/SessionManager/SessionManagerDelegate';

import SessionRepository from '#/Repository/Session/SessionRepository';
import ConfigProvider from '#/Provider/Config/ConfigProvider';

export default class SessionController {
    private config: Config;

    constructor(
        private repo: SessionRepository,
        private sessionManagerDelegate: SessionManagerDelegate,
        private windowDelegate: WindowDelegate,
        configProvider: ConfigProvider,
    ) {
        this.config = configProvider.provide();
        configProvider.setOnConfigDirtyListener((config: Config) => { this.config = config; });
        sessionManagerDelegate.setOnSessionSaveRequestedListener((session) => this.onSessionUpdated(session));
        sessionManagerDelegate.setOnSessionRestoreRequestedListener((nameOfSession) => this.onSessionRestoreRequested(nameOfSession));
        sessionManagerDelegate.setOnSessionSwitchedListener((nameOfSession: string) => this.onSessionSwitched(nameOfSession));
        sessionManagerDelegate.setOnSessionAllClearRequestedListener(() => this.onSessionAllClearRequested());
    }

    async onSessionUpdated(session: Session) {
        this.repo.set(session);
        await this.windowDelegate.showMessage(`Session "${session.name}" has been saved.`);
    }

    async onSessionSwitched(nameOfSession: string) {
        if (!this.config.shouldAutoRestoreOnBranchSwitches) {
            return;
        }
        try {
            await this.restore(nameOfSession);
            await this.windowDelegate.showMessage(`You have switched to session "${nameOfSession}".`);
        } catch (exception) {
            await this.windowDelegate.showMessage(`Session restoration error: ${exception}`);
        }
    }

    async onSessionRestoreRequested(nameOfSession: string) {
        try {
            const result = await this.restore(nameOfSession);
            if (result) {
                await this.windowDelegate.showMessage(`Session "${nameOfSession}" has been restored.`);
            } else {
                await this.windowDelegate.showMessage(`Session "${nameOfSession}" is not yet saved.`);    
            }
        } catch (exception) {
            await this.windowDelegate.showMessage(`Session restoration error: ${exception}`);
        }
    }

    async onSessionClearRequested(nameOfSession: string) {
        this.repo.remove(nameOfSession);
        await this.windowDelegate.showMessage(`Saved session "${nameOfSession}" is now cleared.`);
    }

    async onSessionAllClearRequested() {
        this.repo.removeAll();
        await this.windowDelegate.showMessage(`All saved sessions are now cleared.`);
    }

    private async restore(nameOfSession: string): Promise<Boolean> {
        const session = this.repo.get(nameOfSession);
        if (!session) {
            return false;
        }
        await this.sessionManagerDelegate.clear();
        await this.sessionManagerDelegate.restore(session);
        return true;
    }
}
