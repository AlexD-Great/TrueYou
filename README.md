# `DecentraVerify`

## *プロジェクト概要*
DecentraVerifyは、インターネットコンピューター（ICP）を活用したWeb3 dAppで、安全で分散型の資格情報の保存と検証を提供します。改ざん不可能なオンチェーン検証を実現し、資格詐欺を防止します。

対象: 大学、雇用主、機関 – 学位、認定証、専門資格を即座に検証可能。

安全性 & パーミッションレス: 中央集権型データベースに依存せず、詐欺やデータ漏洩のリスクを軽減。

ICP活用: Motokoベースのスマートコントラクトを採用し、シームレスなブロックチェーン統合を実現。

ICPブロックチェーン上で資格情報の保存と検証を行う分散型アプリケーションです。

新しい DecentraVerify プロジェクトとインターネットコンピューター開発コミュニティへようこそ。 デフォルトでは、新しいプロジェクトを作成すると、このREADMEといくつかのテンプレートファイルがプロジェクトディレクトリに追加されます。これらのテンプレートファイルを編集してプロジェクトをカスタマイズし、自分のコードを追加することで開発サイクルを加速できます。

まずは、プロジェクトのディレクトリ構造やデフォルトの設定ファイルを確認することをおすすめします。開発環境でこのプロジェクトを操作しても、本番環境のデプロイメントやIDトークンには影響を与えません。

DecentraVerify について詳しく知りたい場合は、以下のオンラインドキュメントをご覧ください。

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Motoko Programming Language Guide](https://internetcomputer.org/docs/current/motoko/main/motoko)
- [Motoko Language Quick Reference](https://internetcomputer.org/docs/current/motoko/main/language-manual)

プロジェクトにすぐに取り組みたい場合は、以下のコマンドを試してください。

```bash
cd decentra_verify_m/
dfx help
dfx canister --help
```

## ローカル環境でのプロジェクト実行

DecentraVerify をローカルでテストし、オンチェーン資格検証の仕組みを確認するには、以下のコマンドを使用してください。

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
dfx deploy
```

ジョブが完了すると、アプリケーションは次のURLで利用可能になります。
`http://localhost:4943?canisterId={asset_canister_id}`.

バックエンドのカニスターに変更を加えた場合は、以下のコマンドで新しい Candid インターフェースを生成できます。

```bash
npm run generate
```

いつでも実行できます。これは、フロントエンド開発サーバーを起動する前に実行することを推奨します。また、dfx deploy を実行するたびに自動的に実行されます。

フロントエンドに変更を加えた場合は、以下のコマンドで開発サーバーを起動できます

```bash
npm start
```

これにより、http://localhost:8080 でサーバーが起動し、ポート 4943 のレプリカへ API リクエストをプロキシします。

## *将来の拡張機能*

マルチブロックチェーン対応 - Ethereum、Solana、Polkadot への拡張により、より広範な採用を目指します。

分散型組織管理 - 機関がスマートコントラクトを使用して資格情報の発行・取り消しを行える機能を提供。

モバイル対応インターフェース - モバイルユーザー向けに最適化し、デジタル資格の共有を容易にします。

### フロントエンド環境変数に関する注意点

DFX を使用せずにフロントエンドコードをホストする場合、本番環境でルートキーを取得しないようにするために、以下のいずれかの調整が必要になる場合があります。

- Webpack を使用している場合、DFX_NETWORK を ic に設定する。
- 自動生成された宣言内で process.env.DFX_NETWORK を置き換えるために、お好みの方法を使用してください。
  - dfx.json 内で canisters -> {asset_canister_id} -> declarations -> env_override を文字列に設定すると、自動生成された宣言内の process.env.DFX_NETWORK がその文字列に置き換えられます。
- 独自の createActor コンストラクタを作成してください。
