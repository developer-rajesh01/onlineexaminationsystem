import React, { useState } from "react";

function CreateQuiz() {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([]);

    const questionTypes = [
        { value: "multipleChoice", label: "Multiple Choice" },
        { value: "shortAnswer", label: "Short Answer" },
    ];

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: Date.now(),
                type: "multipleChoice",
                questionText: "",
                options: ["", ""], // start with two options for MC
            },
        ]);
    };

    const updateQuestionText = (id, text) => {
        setQuestions(
            questions.map((q) =>
                q.id === id ? { ...q, questionText: text } : q
            )
        );
    };

    const updateQuestionType = (id, type) => {
        setQuestions(
            questions.map((q) =>
                q.id === id
                    ? { ...q, type, options: type === "multipleChoice" ? q.options : [] }
                    : q
            )
        );
    };

    const addOption = (id) => {
        setQuestions(
            questions.map((q) =>
                q.id === id ? { ...q, options: [...q.options, ""] } : q
            )
        );
    };

    const updateOptionText = (qId, index, text) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === qId) {
                    const newOptions = [...q.options];
                    newOptions[index] = text;
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    const removeOption = (qId, index) => {
        setQuestions(
            questions.map((q) => {
                if (q.id === qId) {
                    const newOptions = q.options.filter((_, i) => i !== index);
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    const removeQuestion = (id) => {
        setQuestions(questions.filter((q) => q.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ title, questions });
        alert("Quiz Created! Check console for data.");
    };

    return (
        <div className="max-w-4xl mx-auto my-10 p-6 bg-white rounded shadow">
            <h1 className="text-3xl font-bold mb-6">Create Quiz</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Quiz Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 mb-6 border rounded"
                    required
                />

                {questions.map(({ id, questionText, type, options }, qi) => (
                    <div
                        key={id}
                        className="mb-8 border border-gray-300 p-4 rounded relative"
                    >
                        <button
                            type="button"
                            onClick={() => removeQuestion(id)}
                            className="absolute right-4 top-4 text-red-500 font-bold"
                            aria-label={`Remove Question ${qi + 1}`}
                        >
                            &times;
                        </button>

                        <label className="block font-semibold mb-2">
                            Question {qi + 1}
                        </label>
                        <input
                            type="text"
                            placeholder="Enter question text"
                            value={questionText}
                            onChange={(e) => updateQuestionText(id, e.target.value)}
                            className="w-full p-2 mb-4 border rounded"
                            required
                        />

                        <label className="block mb-2">Question Type:</label>
                        <select
                            value={type}
                            onChange={(e) => updateQuestionType(id, e.target.value)}
                            className="mb-4 p-2 border rounded"
                        >
                            {questionTypes.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {type === "multipleChoice" && (
                            <div className="space-y-2">
                                <label className="block mb-2 font-semibold">Options:</label>
                                {options.map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => updateOptionText(id, i, e.target.value)}
                                            required
                                            className="flex-1 p-2 border rounded"
                                        />
                                        {options.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(id, i)}
                                                className="text-red-500 font-bold px-2 rounded hover:bg-red-100"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addOption(id)}
                                    className="text-blue-500 text-sm mt-2 hover:underline"
                                >
                                    + Add Option
                                </button>
                            </div>
                        )}

                        {type === "shortAnswer" && (
                            <p className="italic text-gray-500">This is a short answer question.</p>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addQuestion}
                    className="mb-6 bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600"
                >
                    + Add Question
                </button>

                <button
                    type="submit"
                    className="block bg-indigo-600 text-white rounded px-6 py-3 hover:bg-indigo-700"
                >
                    Create Quiz
                </button>
            </form>
        </div>
    );
}

export default CreateQuiz;
