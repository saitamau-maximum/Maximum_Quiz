// Question.js
const questions = [
    {
        question: "HTMLのフルフォームは何ですか？",
        options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language", "Hyper Tool Markup Language"],
        answer: "Hyper Text Markup Language"
    },
    {
        question: "HTML文書の最初のタグは何ですか？",
        options: ["<html>", "<head>", "<title>", "<!DOCTYPE html>"],
        answer: "<!DOCTYPE html>"
    },
    {
        question: "HTMLでリンクを作成するために使用されるタグは？",
        options: ["<a>", "<link>", "<href>", "<url>"],
        answer: "<a>"
    },
    {
        question: "HTMLで画像を表示するために使用されるタグは？",
        options: ["<img>", "<image>", "<src>", "<picture>"],
        answer: "<img>"
    },
    {
        question: "HTMLでリストを作成するために使用されるタグは？",
        options: ["<ul>または<ol>", "<list>", "<li>", "<dl>"],
        answer: "<ul>または<ol>"
    },
    {
        question: "HTMLでフォームを作成するために使用されるタグは？",
        options: ["<form>", "<input>", "<textarea>", "<button>"],
        answer: "<form>"
    },
    {
        question: "HTMLでテーブルの行を定義するタグは？",
        options: ["<tr>", "<td>", "<table>", "<th>"],
        answer: "<tr>"
    },
    {
        question: "HTMLで最も大きな見出しを作成するタグは？",
        options: ["<h1>", "<h6>", "<header>", "<head>"],
        answer: "<h1>"
    },
    {
        question: "HTMLでコメントを記述する正しい方法は？",
        options: ["<!-- コメント -->", "// コメント", "/* コメント */", "# コメント"],
        answer: "<!-- コメント -->"
    },
    {
        question: "HTMLでページのメタデータを定義するために使用されるタグは？",
        options: ["<meta>", "<head>", "<title>", "<style>"],
        answer: "<meta>"
    }
];

export default questions;
