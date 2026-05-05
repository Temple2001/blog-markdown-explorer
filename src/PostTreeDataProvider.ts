import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import matter from 'gray-matter';

export class PostTreeDataProvider implements vscode.TreeDataProvider<PostNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<PostNode | undefined | void> = new vscode.EventEmitter<PostNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<PostNode | undefined | void> = this._onDidChangeTreeData.event;

  private posts: Post[] = [];

  constructor(
    private workspaceRoot: string | undefined,
    private viewType: 'recent' | 'category'
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PostNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PostNode): Thenable<PostNode[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No workspace folder open');
      return Promise.resolve([]);
    }

    // loadPosts() on root element to ensure fresh data
    if (!element) {
      const pathExists = this.loadPosts();
      
      if (!pathExists) {
        const config = vscode.workspace.getConfiguration('astro-blog-viewer');
        const postsPathRelative = config.get<string>('postsPath') || 'public/post';
        return Promise.resolve([
          new PostNode(
            `Directory '${postsPathRelative}' not found`,
            vscode.TreeItemCollapsibleState.None,
            'info'
          )
        ]);
      }

      if (this.posts.length === 0) {
        return Promise.resolve([
          new PostNode(
            'No markdown posts found',
            vscode.TreeItemCollapsibleState.None,
            'info'
          )
        ]);
      }
    }

    if (this.viewType === 'recent') {
      if (element) return Promise.resolve([]); // Recent view is flat

      const sortedPosts = [...this.posts].sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
      });

      const config = vscode.workspace.getConfiguration('astro-blog-viewer');
      const count = config.get<number>('recentPostsCount') || 10;
      const recentPosts = sortedPosts.slice(0, count);

      const nodes = recentPosts.map(p => this.createPostNode(p, true));
      return Promise.resolve(nodes);
    }

    if (this.viewType === 'category') {
      if (element) {
        if (element.contextValue === 'category') {
          const categoryPosts = this.posts.filter(p => p.category === element.label);
          categoryPosts.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA;
          });

          const postNodes = categoryPosts.map(p => this.createPostNode(p, false));
          return Promise.resolve(postNodes);
        }
        return Promise.resolve([]);
      } else {
        const categories = new Set<string>();
        this.posts.forEach(p => {
          if (p.category) {
            categories.add(p.category);
          }
        });

        const categoryNodes = Array.from(categories).sort().map(cat => {
          return new PostNode(
            cat,
            vscode.TreeItemCollapsibleState.Collapsed,
            'category'
          );
        });

        return Promise.resolve(categoryNodes);
      }
    }

    return Promise.resolve([]);
  }

  private createPostNode(p: Post, showTagsInDescription: boolean): PostNode {
    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**${p.title}**

`);
    if (p.pubDate) tooltip.appendMarkdown(`*Date:* ${new Date(p.pubDate).toLocaleDateString()}

`);
    if (p.tags.length > 0) tooltip.appendMarkdown(`*Tags:* ${p.tags.join(', ')}

`);
    if (p.description) tooltip.appendMarkdown(`*Description:* ${p.description}

`);
    if (p.contentSnippet) {
      // Clean up the snippet to remove excessive newlines or headings from preview
      let cleanSnippet = p.contentSnippet.replace(/#/g, '').trim();
      tooltip.appendMarkdown(`---

${cleanSnippet}`);
    }

    const node = new PostNode(
      p.title,
      vscode.TreeItemCollapsibleState.None,
      'post',
      p.filePath,
      tooltip
    );
    
    // Recent list shows description/tags next to the label
    if (showTagsInDescription) {
      node.description = p.tags.join(', ');
    } else if (p.pubDate) {
      node.description = new Date(p.pubDate).toLocaleDateString();
    }
    
    return node;
  }

  private loadPosts(): boolean {
    this.posts = [];
    if (!this.workspaceRoot) return false;

    const config = vscode.workspace.getConfiguration('astro-blog-viewer');
    const postsPathRelative = config.get<string>('postsPath') || 'public/post';
    const postsPath = path.join(this.workspaceRoot, postsPathRelative);

    if (fs.existsSync(postsPath)) {
      this.walkDirectory(postsPath);
      return true;
    }
    return false;
  }

  private walkDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.walkDirectory(filePath);
      } else if (file.endsWith('.md')) {
        this.parsePost(filePath);
      }
    }
  }

  private parsePost(filePath: string) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);

      let category = 'Uncategorized';
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        category = data.tags[0];
      }

      this.posts.push({
        title: data.title || path.basename(filePath, '.md'),
        filePath: filePath,
        category: category,
        pubDate: data.pubDate,
        tags: data.tags || [],
        description: data.description,
        contentSnippet: content.slice(0, 200).trim() + (content.length > 200 ? '...' : '')
      });
    } catch (err) {
      console.error(`Failed to parse markdown file ${filePath}:`, err);
    }
  }

  public async searchPosts() {
    if (!this.workspaceRoot) return;

    this.loadPosts(); // ensure loaded
    
    const items: vscode.QuickPickItem[] = this.posts.map(post => {
      const tagsStr = post.tags.join(', ');
      return {
        label: post.title,
        description: post.category,
        detail: `Date: ${post.pubDate ? new Date(post.pubDate).toLocaleDateString() : 'N/A'} | Tags: ${tagsStr}`,
        filePath: post.filePath 
      } as vscode.QuickPickItem & { filePath: string };
    });

    const selected = await vscode.window.showQuickPick(items, {
      matchOnDescription: true,
      matchOnDetail: true,
      placeHolder: 'Search posts by title or tags...'
    });

    if (selected && 'filePath' in selected) {
      const uri = vscode.Uri.file((selected as any).filePath);
      vscode.window.showTextDocument(uri);
    }
  }
}

interface Post {
  title: string;
  filePath: string;
  category: string;
  pubDate: string | Date;
  tags: string[];
  description?: string;
  contentSnippet?: string;
}

export class PostNode extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly filePath?: string,
    public readonly tooltip?: string | vscode.MarkdownString
  ) {
    super(label, collapsibleState);
    
    this.contextValue = contextValue;

    if (contextValue === 'category') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (contextValue === 'post') {
      this.iconPath = new vscode.ThemeIcon('markdown');
      if (filePath) {
        this.command = {
          command: 'astro-blog-viewer.openFile',
          title: 'Open File',
          arguments: [filePath]
        };
      }
    } else if (contextValue === 'info') {
      this.iconPath = new vscode.ThemeIcon('info');
    }
  }
}
