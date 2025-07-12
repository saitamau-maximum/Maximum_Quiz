import os
import subprocess
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS # CORS対応のため

app = Flask(__name__)
CORS(app) # 全てのオリジンからのリクエストを許可 (開発用)

# ファイルパスの設定
C_FILE = "ex13_1.c" # ユーザーのC++コードを保存するファイル名
EXE_FILE = "ex13_1" # コンパイル後の実行可能ファイル名
TEMP_OUTPUT = "./locked/temp_output.txt"
TEMP_ERROR = "./locked/temp_error.txt"
HASH_OUTPUT = "./locked/hash_output.txt"
LOCKED_DIR = "./locked"
CASES_DIR = os.path.join(LOCKED_DIR, "cases", "my_cpp_quiz") # テストケースのディレクトリ

# テストケースの数 (C++_Input_Question1.html の questions.length のように動的に取得することも可能)
# 今回は単純な足し算問題なので、手動でテストケースを用意します
NUM_TESTCASES = 3 # 仮に3つのテストケースを用意

@app.route('/submit_code', methods=['POST'])
def submit_code():
    data = request.get_json()
    user_code = data.get('code')

    if not user_code:
        return jsonify({"status": "error", "error_message": "コードが提供されていません。"})

    # locked ディレクトリが存在しない場合は作成
    os.makedirs(LOCKED_DIR, exist_ok=True)
    os.makedirs(os.path.join(CASES_DIR, "in"), exist_ok=True)
    os.makedirs(os.path.join(CASES_DIR, "out"), exist_ok=True)

    # ユーザーのコードをCファイルに書き込み
    # main関数のみを提出させる場合、ユーザーのコードをテンプレートに埋め込む
    full_code = user_code # ユーザーがmain関数全体を提出する前提
    # あるいは、ユーザーがmain関数の中身だけを提出する場合のテンプレート:
    # full_code = f"""
    # #include <iostream>
    # int main() {{
    #   {user_code}
    #   return 0;
    # }}
    # """

    with open(os.path.join(LOCKED_DIR, C_FILE), "w") as f:
        f.write(full_code)

    # コンパイル
    compile_cmd = ["g++", "-o", os.path.join(LOCKED_DIR, EXE_FILE), os.path.join(LOCKED_DIR, C_FILE)]
    try:
        # stderr を PIPE に接続してエラーメッセージを取得
        compile_result = subprocess.run(compile_cmd, capture_output=True, text=True, check=False)
        if compile_result.returncode != 0:
            print(f"Compilation error: {compile_result.stderr}")
            return jsonify({
                "status": "compile_error",
                "error_message": compile_result.stderr
            })
    except Exception as e:
        print(f"Compilation failed: {e}")
        return jsonify({
            "status": "error",
            "error_message": f"コンパイルコマンドの実行に失敗しました: {e}"
        })

    # テストケースを実行し、ハッシュ値を比較
    for idx in range(NUM_TESTCASES):
        input_file = os.path.join(CASES_DIR, "in", f"{idx}.txt")
        expected_hash_file = os.path.join(CASES_DIR, "out", f"{idx}.txt")

        # テスト入力ファイルが存在することを確認
        if not os.path.exists(input_file):
            return jsonify({"status": "error", "error_message": f"テスト入力ファイル {input_file} が見つかりません。"})
        # 正解ハッシュ値ファイルが存在することを確認
        if not os.path.exists(expected_hash_file):
            return jsonify({"status": "error", "error_message": f"正解ハッシュファイル {expected_hash_file} が見つかりません。"})

        # ユーザーのプログラムを実行し、出力を取得
        try:
            with open(input_file, "r") as infile, \
                 open(TEMP_OUTPUT, "w") as outfile, \
                 open(TEMP_ERROR, "w") as errfile:
                # ex13_1.sh のようにカレントディレクトリを移動しないため、フルパスで実行ファイルを指定
                run_result = subprocess.run(
                    [os.path.join(LOCKED_DIR, EXE_FILE)],
                    stdin=infile,
                    stdout=outfile,
                    stderr=errfile,
                    timeout=5, # タイムアウトを設定 (5秒)
                    check=False
                )

            # エラー出力をチェック
            with open(TEMP_ERROR, "r") as f:
                runtime_error_output = f.read().strip()
            if runtime_error_output:
                print(f"Runtime error: {runtime_error_output}")
                with open(TEMP_OUTPUT, "r") as f:
                    your_output = f.read().strip()
                return jsonify({
                    "status": "runtime_error",
                    "error_message": runtime_error_output,
                    "your_output": your_output
                })

            # 出力ファイルのハッシュ値を計算
            with open(TEMP_OUTPUT, "rb") as f:
                # `tr -d ' \t\n'` のロジックをPythonで実装
                raw_output = f.read().decode('utf-8')
                # スペース、タブ、改行をすべて削除し、小文字化
                processed_output = "".join(raw_output.split()).lower() # `tr -d` 相当
                your_hash = hashlib.sha256(processed_output.encode('utf-8')).hexdigest()

            # 正解ハッシュ値を読み込み
            with open(expected_hash_file, "r") as f:
                expected_hash = f.read().strip()

            # ハッシュ値を比較
            if your_hash != expected_hash:
                with open(TEMP_OUTPUT, "r") as f:
                    your_output = f.read()
                return jsonify({
                    "status": "failure",
                    "your_hash": your_hash,
                    "expected_hash": expected_hash,
                    "your_output": your_output
                })

        except subprocess.TimeoutExpired:
            print("Execution timed out.")
            return jsonify({
                "status": "runtime_error",
                "error_message": "プログラムの実行がタイムアウトしました。",
                "your_output": "(出力なし)"
            })
        except Exception as e:
            print(f"Execution failed: {e}")
            return jsonify({
                "status": "error",
                "error_message": f"プログラムの実行に失敗しました: {e}"
            })

    # すべてのテストケースに合格
    return jsonify({"status": "success"})

if __name__ == '__main__':
    # テストケースファイルが存在しない場合は作成
    # ユーザーがプログラムの合計を求めるように指示されているので、簡単な入出力を作成
    # input: 1 2 -> output: 3
    # input: 10 20 -> output: 30
    # input: 5 5 -> output: 10
    
    test_cases_data = [
        ("1 2", "3"),
        ("10 20", "30"),
        ("5 5", "10")
    ]

    os.makedirs(os.path.join(CASES_DIR, "in"), exist_ok=True)
    os.makedirs(os.path.join(CASES_DIR, "out"), exist_ok=True)

    for i, (input_val, expected_output_val) in enumerate(test_cases_data):
        # 入力ファイル
        with open(os.path.join(CASES_DIR, "in", f"{i}.txt"), "w") as f:
            f.write(input_val + "\n")

        # 正解ハッシュ値ファイル (expected_output_val のハッシュ値を計算して保存)
        # `tr -d ' \t\n'` に相当する処理
        processed_expected_output = "".join(expected_output_val.split()).lower()
        expected_hash = hashlib.sha256(processed_expected_output.encode('utf-8')).hexdigest()
        with open(os.path.join(CASES_DIR, "out", f"{i}.txt"), "w") as f:
            f.write(expected_hash)

    app.run(debug=True) # 開発中はdebug=Trueで変更を自動反映