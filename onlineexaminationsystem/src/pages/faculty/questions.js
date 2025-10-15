import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { FiUpload, FiTrash2 } from "react-icons/fi";

function Questions() {
    const [questions, setQuestions] = useState(() => {
        const saved = localStorage.getItem("questions");
        if (saved) return JSON.parse(saved);
        return [{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }];
    });
    const [importStatus, setImportStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({}); // Track validation errors per question

    useEffect(() => {
        localStorage.setItem("questions", JSON.stringify(questions));
    }, [questions]);

    // Validate a single question
    const validateQuestion = (q, qIndex) => {
        const newErrors = { ...errors };
        if (!q.questionText.trim()) {
            newErrors[qIndex] = { ...newErrors[qIndex], questionText: "Question text is required" };
        } else {
            newErrors[qIndex] = { ...newErrors[qIndex], questionText: null };
        }
        if (q.options.slice(0, 2).some((opt) => !opt.trim())) {
            newErrors[qIndex] = { ...newErrors[qIndex], options: "At least two options must be filled" };
        } else {
            newErrors[qIndex] = { ...newErrors[qIndex], options: null };
        }
        setErrors(newErrors);
        return !newErrors[qIndex]?.questionText && !newErrors[qIndex]?.options;
    };

    const handleQuestionChange = (qIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].questionText = value;
        setQuestions(newQuestions);
        validateQuestion(newQuestions[qIndex], qIndex);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
        validateQuestion(newQuestions[qIndex], qIndex);
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
            validateQuestion(newQuestions[qIndex], qIndex);
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
            validateQuestion(newQuestions[qIndex], qIndex);
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
        const newErrors = { ...errors };
        delete newErrors[qIndex];
        setErrors(newErrors);
    };

    const handleSubmit = async () => {
        let isValid = true;
        const newErrors = {};
        questions.forEach((q, qi) => {
            if (!validateQuestion(q, qi)) isValid = false;
        });
        if (!isValid) {
            setErrors(newErrors);
            alert("Please fix all errors before submitting");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questions }),
            });
            if (!res.ok) throw new Error("Submit failed");
            alert("Questions saved!");
            setQuestions([{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }]);
            setErrors({});
            localStorage.removeItem("questions");
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
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
            const importedQuestions = rawJson.map((row) => {
                const optionsRaw = [
                    row.Option1,
                    row.Option2,
                    row.Option3,
                    row.Option4,
                ];
                const options = optionsRaw
                    .map((opt) => (opt !== undefined && opt !== null ? String(opt).trim() : ""))
                    .filter((opt) => opt !== "");
                return {
                    questionText: row.Question ? String(row.Question).trim() : "",
                    options: options.length > 0 ? options : ["", ""],
                    correctAnswerIndex:
                        typeof row.CorrectAnswer === "number" &&
                            row.CorrectAnswer >= 0 &&
                            row.CorrectAnswer < options.length
                            ? row.CorrectAnswer
                            : 0,
                };
            });
            setQuestions(importedQuestions.length > 0 ? importedQuestions : [{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }]);
            setImportStatus(`Imported ${importedQuestions.length} questions successfully`);
            setTimeout(() => setImportStatus(null), 3000);
            // Validate all imported questions
            const newErrors = {};
            importedQuestions.forEach((q, qi) => validateQuestion(q, qi));
            setErrors(newErrors);
        };
        reader.readAsBinaryString(file);
    };

    const clearAll = () => {
        setQuestions([{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }]);
        setErrors({});
        setImportStatus(null);
        localStorage.removeItem("questions");
    };

    // Check if submit button should be disabled
    const isSubmitDisabled = questions.some(
        (q, qi) => errors[qi]?.questionText || errors[qi]?.options
    );

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
            {/* Import and Clear Section */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-700 p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-4">
                    <label
                        htmlFor="excelUpload"
                        className="group cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 bg-teal-400 text-white hover:bg-teal-500 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        title="Upload questions from Excel"
                    >
                        <FiUpload size={20} className="group-hover:scale-110 transition-transform" />
                        Import Questions
                    </label>
                    <input
                        id="excelUpload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={clearAll}
                        className="group flex items-center gap-2 rounded-md px-4 py-2 bg-red-400 text-white hover:bg-red-500 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <FiTrash2 size={20} className="group-hover:scale-110 transition-transform" />
                        Clear All
                    </button>
                </div>
                <div className="text-gray-100 font-semibold">
                    Total Questions: {questions.length}
                </div>
            </div>

            {/* Import Feedback */}
            {importStatus && (
                <div className="bg-teal-100 text-teal-800 p-3 rounded-lg shadow-md transform animate-slide-in">
                    {importStatus}
                </div>
            )}

            {/* Question Cards */}
            {questions.map((q, qi) => (
                <div
                    key={qi}
                    className="relative bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-400 hover:shadow-2xl transform hover:-translate-y-1 hover:rotate-x-2 transition-all duration-300"
                    style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
                >
                    {questions.length > 1 && (
                        <button
                            onClick={() => deleteQuestion(qi)}
                            className="absolute top-3 right-3 bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:shadow-md transform hover:scale-110 transition-all duration-200"
                            title="Delete this question"
                        >
                            &times;
                        </button>
                    )}
                    <div className="space-y-2">
                        <textarea
                            className={`w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 resize-none ${errors[qi]?.questionText ? "border-red-400" : "border-blue-300"
                                }`}
                            value={q.questionText}
                            onChange={(e) => handleQuestionChange(qi, e.target.value)}
                            placeholder="Enter your question here..."
                            rows={3}
                        />
                        {errors[qi]?.questionText && (
                            <p className="text-red-400 text-sm">{errors[qi].questionText}</p>
                        )}
                    </div>
                    <div className="space-y-4 mt-4">
                        {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center space-x-3 group">
                                <input
                                    type="radio"
                                    name={`correct-${qi}`}
                                    checked={q.correctAnswerIndex === oi}
                                    onChange={() => setCorrectAnswer(qi, oi)}
                                    className="w-5 h-5 text-teal-400 focus:ring-teal-400 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    placeholder={`Option ${oi + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(qi, oi, e.target.value)}
                                    className={`flex-grow px-3 py-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:shadow-md transition-all duration-200 ${oi < 2 && !opt.trim() ? "border-red-400" : "border-blue-300"
                                        }`}
                                    required={oi < 2}
                                />
                                {oi > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(qi, oi)}
                                        className="text-red-400 hover:text-red-500 transform hover:scale-110 transition-all duration-200"
                                        title="Remove option"
                                    >
                                        <FiTrash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {errors[qi]?.options && (
                            <p className="text-red-400 text-sm">{errors[qi].options}</p>
                        )}
                        {q.options.length < 4 && (
                            <button
                                type="button"
                                onClick={() => addOption(qi)}
                                className="text-teal-400 hover:text-teal-500 font-semibold transform hover:scale-105 transition-all duration-200"
                            >
                                + Add Option
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {/* Action Buttons */}
            <div className="flex space-x-4 justify-end">
                <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-teal-400 text-white px-6 py-3 rounded-lg hover:bg-teal-500 hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                    + Add Question
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSubmitDisabled}
                    className={`flex items-center justify-center px-6 py-3 rounded-lg text-white transition-all duration-200 ${isSubmitting || isSubmitDisabled
                            ? "bg-indigo-400 opacity-50 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105"
                        }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg
                                className="animate-spin h-5 w-5 mr-2"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                />
                            </svg>
                            Saving...
                        </>
                    ) : (
                        "Save All Questions"
                    )}
                </button>
            </div>
        </div>
    );
}

export default Questions;