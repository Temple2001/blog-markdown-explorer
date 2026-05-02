# 개발 일지 (Astro Blog Viewer)

## 2026-05-02 (현재 시각)

### 1. 프로젝트 초기화 및 패키지 설정
- `git init`을 통해 로컬 Git 레포지토리 초기화.
- Markdown 파일의 Frontmatter를 파싱하기 위해 `gray-matter` 패키지 설치.
- `package.json` 설정 변경:
  - `contributes.viewsContainers`와 `contributes.views`를 통해 사이드바(Activity Bar)에 "Astro Blog" 아이콘과 "Posts" 뷰(Tree View)를 추가.
  - 관련 커맨드 (`astro-blog-viewer.refreshEntry`, `astro-blog-viewer.search`, `astro-blog-viewer.openFile`) 등록.
  - 사용자가 포스트의 기준 경로를 설정할 수 있도록 `astro-blog-viewer.postsPath` 설정 노출 (기본값: `public/post`).

### 2. 트리 뷰 데이터 제공자 구현 (`PostTreeDataProvider.ts`)
- `vscode.TreeDataProvider` 인터페이스를 구현하는 `PostTreeDataProvider` 작성.
- 설정된 폴더 내의 `.md` 파일들을 재귀적으로 검색.
- `gray-matter`를 활용해 파싱 후 `tags[0]`(대분류)를 기준으로 노드를 그룹화.
- 하위 포스트 노드는 `pubDate`를 기준으로 최신순(내림차순)으로 정렬하여 표시.
- 검색 기능을 위해 `searchPosts` 메서드를 구현하여, `vscode.window.showQuickPick`을 통해 포스트의 제목이나 태그로 검색 및 열기가 가능하도록 함.

### 3. 확장 프로그램 진입점 구현 (`extension.ts`)
- `PostTreeDataProvider` 인스턴스 생성 및 뷰(`astroPostView`)에 등록.
- 등록한 커맨드(`Refresh`, `Search`, `Open File`)들에 대한 실제 동작 바인딩.
- `vscode.workspace.createFileSystemWatcher`를 사용하여 `public/post/**/*.md` 패턴에 대한 파일 변경, 생성, 삭제 이벤트를 감지하고 트리 뷰를 자동으로 새로고침하도록 연동.

### 4. 다음 계획 (필요 시)
- 실제 환경(Astro 블로그)에서 정상적으로 포스트가 파싱되는지 검증.
- 추가적인 정렬 기준이나 필터 기능(태그별 필터링 등) 검토.
