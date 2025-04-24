// main.js
import questions from './Question.js';

const quizContainer = document.getElementById('quiz');

questions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question-container');

    const questionText = document.createElement('p');
    questionText.classList.add('question');
    questionText.textContent = `${index + 1}. ${q.question}`;
    questionDiv.appendChild(questionText);

    const optionsDiv = document.createElement('div');
    optionsDiv.classList.add('options');

    q.options.forEach(option => {
        const label = document.createElement('label');
        label.classList.add('option');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `question-${index}`;
        input.value = option;

        label.appendChild(input);
        label.appendChild(document.createTextNode(option));
        optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);
    quizContainer.appendChild(questionDiv);
});
