import * as vscode from 'vscode';
import * as path from 'path';
import { PostTreeDataProvider } from './PostTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
    ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

  const postTreeDataProvider = new PostTreeDataProvider(workspaceRoot);
  
  vscode.window.registerTreeDataProvider('astroPostView', postTreeDataProvider);

  // Register Refresh Command
  context.subscriptions.push(vscode.commands.registerCommand('astro-blog-viewer.refreshEntry', () =>
    postTreeDataProvider.refresh()
  ));

  // Register Search Command
  context.subscriptions.push(vscode.commands.registerCommand('astro-blog-viewer.search', () =>
    postTreeDataProvider.searchPosts()
  ));

  // Register Open File Command
  context.subscriptions.push(vscode.commands.registerCommand('astro-blog-viewer.openFile', (filePath: string) => {
    const uri = vscode.Uri.file(filePath);
    vscode.window.showTextDocument(uri);
  }));

  // Set up FileSystemWatcher for public/post folder
  if (workspaceRoot) {
    const config = vscode.workspace.getConfiguration('astro-blog-viewer');
    const postsPathRelative = config.get<string>('postsPath') || 'public/post';
    const postsPattern = new vscode.RelativePattern(workspaceRoot, path.join(postsPathRelative, '**/*.md'));
    
    const fileWatcher = vscode.workspace.createFileSystemWatcher(postsPattern);
    
    fileWatcher.onDidChange(() => postTreeDataProvider.refresh());
    fileWatcher.onDidCreate(() => postTreeDataProvider.refresh());
    fileWatcher.onDidDelete(() => postTreeDataProvider.refresh());

    context.subscriptions.push(fileWatcher);
  }
}

export function deactivate() {}
