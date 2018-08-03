
# npm run-script run
- npmはpackage.json を読み、runエントリーのelectron . を実行
- electron　次のどちらか不明
  - electronが規約でindex.htmlを表示
  - electronがなんらかのjsを実行し、そのjsがindex.htmlをロードしているのか？loadUrlでindex.htmlを指定するらしいが、その痕跡はなし
- index.htlmは js/app.jsを実行
- index.htmlには次がある
  ```
  <body>   <App></App>    </body>
  <script src="js/app.js"></script>
- app.component.tsは次の行でAppセレクタを登録
  > selector: 'App'
- Appコンポーネント内のtemplateで\<Favaorite>, \<Task>などで子コンポーネントを指定
- Taskコンポーネントはtask.component.tsで実装


✳️コンパイル
npm run-script watch

✳️build
webpack

✳️起動
npm run-script run &

✳️再ロード
cmd+R

✳️
npm run-sciprt run


# 見出し

## 見出し２

- list

  - list
