import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { FiUpload, FiTrash2 } from "react-icons/fi";

function Questions() {
    const [questions, setQuestions] = useState(() => {
        const saved = localStorage.getItem("questions");
        if (saved) return JSON.parse(saved);
        return [{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }];
    });

    const [fileData, setFileData] = useState(null);

    useEffect(() => {
        localStorage.setItem("questions", JSON.stringify(questions));
    }, [questions]);

    const handleQuestionChange = (qIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].questionText = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const setCorrectAnswer = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].correctAnswerIndex = oIndex;
        setQuestions(newQuestions);
    };

    const addOption = (qIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length < 4) {
            newQuestions[qIndex].options.push("");
            setQuestions(newQuestions);
        }
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length > 2) {
            newQuestions[qIndex].options.splice(oIndex, 1);
            if (newQuestions[qIndex].correctAnswerIndex === oIndex) {
                newQuestions[qIndex].correctAnswerIndex = 0;
            } else if (newQuestions[qIndex].correctAnswerIndex > oIndex) {
                newQuestions[qIndex].correctAnswerIndex--;
            }
            setQuestions(newQuestions);
        }
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { questionText: "", options: ["", ""], correctAnswerIndex: 0 },
        ]);
    };

    const deleteQuestion = (qIndex) => {
        if (questions.length === 1) return;
        const newQuestions = [...questions];
        newQuestions.splice(qIndex, 1);
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        for (let q of questions) {
            if (!q.questionText.trim()) {
                alert("Please fill question text.");
                return;
            }
            if (q.options.length < 2) {
                alert("At least two options required");
                return;
            }
            if (q.options.slice(0, 2).some((opt) => !opt.trim())) {
                alert("Fill at least first two options");
                return;
            }
        }

        try {
            const res = await fetch("/api/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions }),
            });

            if (!res.ok) {
                throw new Error("Submit failed");
            }

            alert("Questions saved!");
            setQuestions([{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }]);
            setFileData(null);
            localStorage.removeItem("questions");
        } catch (error) {
            alert(error.message);
        }
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawJson = XLSX.utils.sheet_to_json(worksheet);

            const importedQuestions = rawJson.map((row) => ({
                questionText: row.Question || "",
                options: [
                    row.Option1 || "",
                    row.Option2 || "",
                    row.Option3 || "",
                    row.Option4 || "",
                ].filter((opt) => opt !== ""),
                correctAnswerIndex:
                    typeof row.CorrectAnswer === "number" &&
                        row.CorrectAnswer >= 0 &&
                        row.CorrectAnswer < 4
                        ? row.CorrectAnswer
                        : 0,
            }));

            setFileData(importedQuestions);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex items-center space-x-4">
                <label
                    htmlFor="excelUpload"
                    className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    title="Upload questions from Excel"
                >
                    <FiUpload size={20} />
                    Import Questions from Excel
                </label>
                <input
                    id="excelUpload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFile}
                    className="hidden"
                />
                {fileData && (
                    <span className="text-indigo-700 font-semibold">
                        {fileData.length} questions loaded from file.
                    </span>
                )}
            </div>

            {questions.map((q, qi) => (
                <div
                    key={qi}
                    className="relative bg-white p-6 rounded-lg shadow-lg border border-gray-200"
                    style={{
                        perspective: "800px",
                        transformStyle: "preserve-3d",
                        transform: "rotateY(4deg) rotateX(3deg) rotateZ(1deg)",
                    }}
                >
                    {questions.length > 1 && (
                        <button
                            onClick={() => deleteQuestion(qi)}
                            className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                            title="Delete this question"
                        >
                            &times;
                        </button>
                    )}

                    <textarea
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(qi, e.target.value)}
                        placeholder={`Question ${qi + 1}`}
                        className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={3}
                        required
                    />

                    <div className="space-y-3">
                        {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center space-x-3">
                                <input
                                    type="radio"
                                    name={`correct-${qi}`}
                                    checked={q.correctAnswerIndex === oi}
                                    onChange={() => setCorrectAnswer(qi, oi)}
                                    className="w-5 h-5"
                                />
                                <input
                                    type="text"
                                    placeholder={`Option ${oi + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(qi, oi, e.target.value)}
                                    className="flex-grow px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                    required={oi < 2}
                                />
                                {oi > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(qi, oi)}
                                        className="text-red-600 hover:text-red-800 transition"
                                        title="Remove option"
                                    >
                                        <FiTrash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {q.options.length < 4 && (
                            <button
                                type="button"
                                onClick={() => addOption(qi)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold mt-2"
                            >
                                + Add option
                            </button>
                        )}
                    </div>
                </div>
            ))}

            <div className="flex space-x-4">
                <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
                >
                    + Add Another Question
                </button>

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-indigo-700 text-white px-6 py-3 rounded hover:bg-indigo-800 transition"
                >
                    Save All Questions
                </button>
            </div>
        </div>
    );
}

export default Questions;
