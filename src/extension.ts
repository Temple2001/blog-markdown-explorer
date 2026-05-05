import * as vscode from 'vscode';
import * as path from 'path';
import { PostTreeDataProvider } from './PostTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
    ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

  const categoryTreeDataProvider = new PostTreeDataProvider(workspaceRoot, 'category');
  const recentTreeDataProvider = new PostTreeDataProvider(workspaceRoot, 'recent');
  
  vscode.window.registerTreeDataProvider('astroPostView', categoryTreeDataProvider);
  vscode.window.registerTreeDataProvider('astroRecentView', recentTreeDataProvider);

  const refreshAll = () => {
    categoryTreeDataProvider.refresh();
    recentTreeDataProvider.refresh();
  };

  // Register Refresh Command
  context.subscriptions.push(vscode.commands.registerCommand('astro-blog-viewer.refreshEntry', () =>
    refreshAll()
  ));

  // Register Search Command
  context.subscriptions.push(vscode.commands.registerCommand('astro-blog-viewer.search', () =>
    categoryTreeDataProvider.searchPosts() // Use one of the providers to handle search
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
    
    fileWatcher.onDidChange(() => refreshAll());
    fileWatcher.onDidCreate(() => refreshAll());
    fileWatcher.onDidDelete(() => refreshAll());

    context.subscriptions.push(fileWatcher);
  }
}

export function deactivate() {}
