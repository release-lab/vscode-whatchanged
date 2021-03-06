"use strict";
import * as vscode from "vscode";
import * as path from "path";
import execa from "execa";
import { init, localize } from 'vscode-nls-i18n'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  init(context.extensionPath);
  const whatchangedFilepath = path.join(
    context.extensionPath,
    "vendor",
    "whatchanged" + (process.platform === "win32" ? ".exe" : "")
  );

  async function generate(project?: string, version?: string) {
    if (!project) {
      const workspaceFolder = await vscode.window.showWorkspaceFolderPick();

      if (!workspaceFolder) return;

      project = workspaceFolder.uri.fsPath;
    }

    // FUCK windows
    project = project.replace(/^(\/|\\)?([a-z]):/, ($0, $1, $2) => $2.toUpperCase() + ":");

    if (version === undefined) {
      version = await vscode.window.showInputBox({
        value: "",
        prompt: localize('cmd.generate.prompt'),
        placeHolder: localize('cmd.generate.placeholder'),
      });

      if (version === undefined) return;
    }

    const message = await execa(whatchangedFilepath, [`--project=${project}`, version ? version : ""])
      .then((ps) => {
        return Promise.resolve(ps.exitCode === 0 ? ps.stdout : ps.stderr);
      })
      .catch((err) => {
        return Promise.resolve(err.message);
      });

    const document = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: message,
    });

    await vscode.window.showTextDocument(document);
  }

  context.subscriptions.push(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vscode.commands.registerCommand("whatchanged.generate", async (item: any) => {
      const project = item?._rootUri?.path ?? undefined;
      return generate(project);
    })
  );

  context.subscriptions.push(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vscode.commands.registerCommand("whatchanged.generateAll", async (item: any) => {
      const project = item?._rootUri?.path ?? undefined;
      return generate(project, "HEAD~");
    })
  );
}

// this method is called when your extension is deactivated
export async function deactivate(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: vscode.ExtensionContext
): Promise<void> {
  // ignore
}
