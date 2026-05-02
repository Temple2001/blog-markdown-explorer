# Blog Markdown Explorer

블로그 마크다운 파일을 한 번에 조회하고 빠르게 검색할 수 있는 VS Code 확장 프로그램입니다.

## 기능

- **Tree View**: 지정된 폴더(`public/post` 기본값) 내의 `.md` 파일들을 읽어 Frontmatter의 `tags[0]`(대분류) 기준으로 그룹화하여 보여줍니다.
- **빠른 검색**: 커맨드 팔레트 또는 사이드바 탭의 검색 버튼을 통해 제목과 태그 기반으로 포스트를 쉽게 검색할 수 있습니다.
- **자동 갱신**: 포스트 파일의 추가, 수정, 삭제를 감지하여 사이드바 리스트를 자동으로 새로고침합니다.

## 설치 방법 (GitHub에서 설치)

현재 이 확장 프로그램은 VS Code 마켓플레이스에 등록되어 있지 않으며, GitHub 릴리즈를 통해 직접 설치할 수 있습니다.

1. 이 저장소의 Releases 페이지(GitHub 저장소 상단 탭)로 이동합니다.
2. 최신 릴리즈의 `Assets`에서 `astro-blog-viewer-x.x.x.vsix` 파일을 다운로드합니다.
3. VS Code를 열고 좌측 탭에서 **확장(Extensions)** 아이콘을 클릭합니다.
4. 확장 탭의 우측 상단 `...` (Views and More Actions) 버튼을 클릭합니다.
5. **Install from VSIX...** 를 선택하고 다운로드한 `.vsix` 파일을 선택하여 설치합니다.

## 설정

VS Code 설정(Settings)에서 기준 경로를 변경할 수 있습니다.
- `astro-blog-viewer.postsPath`: 포스트가 위치한 기준 경로 (기본값: `public/post`)
