import React, { useState, useEffect, useRef } from "react";
import { FiUpload, FiTrash2, FiPlusCircle } from "react-icons/fi";
import * as XLSX from "xlsx";

const QUESTIONS_PER_PAGE = 5;

function Questions() {
    const [questions, setQuestions] = useState(() => {
        const saved = localStorage.getItem("questions");
        return saved
            ? JSON.parse(saved)
            : [{ questionText: "", options: ["", ""], correctAnswerIndex: 0 }];
    });
    const [importStatus, setImportStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const fileRef = useRef();

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
        const newQuestions = [
            ...questions,
            { questionText: "", options: ["", ""], correctAnswerIndex: 0 },
        ];
        setQuestions(newQuestions);
        validateQuestion(newQuestions[newQuestions.length - 1], newQuestions.length - 1);
    };

    const deleteQuestion = (qIndex) => {
        if (questions.length === 1) return;
        const newQuestions = questions.filter((_, i) => i !== qIndex);
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
            setImportStatus(null);
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
            const importedQuestions = rawJson
                .map((row) => {
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
                        options: options.length >= 2 ? options : ["", ""],
                        correctAnswerIndex:
                            typeof row.CorrectAnswer === "number" &&
                                row.CorrectAnswer >= 0 &&
                                row.CorrectAnswer < options.length
                                ? row.CorrectAnswer
                                : 0,
                    };
                })
                .filter((q) => q.questionText.trim() && q.options.length >= 2);
            if (importedQuestions.length === 0) {
                setImportStatus("No valid questions found in the file.");
                setTimeout(() => setImportStatus(null), 2500);
                return;
            }
            setQuestions(importedQuestions);
            setImportStatus(`Imported ${importedQuestions.length} questions successfully`);
            setTimeout(() => setImportStatus(null), 2500);
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

    // Pagination logic
    const numPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    const pagedQuestions = questions.slice(
        currentPage * QUESTIONS_PER_PAGE,
        (currentPage + 1) * QUESTIONS_PER_PAGE
    );

    // Check if submit button should be disabled
    const isSubmitDisabled = questions.some(
        (q, qi) => errors[qi]?.questionText || errors[qi]?.options
    );

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-8">
            {/* Fixed Save All Button */}
            <button
                className={`fixed right-6 top-20 px-8 py-3 rounded-full shadow-lg transition transform hover:scale-105 z-50 ${isSubmitting || isSubmitDisabled
                        ? "bg-indigo-400 opacity-50 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                onClick={handleSubmit}
                disabled={isSubmitting || isSubmitDisabled}
            >
                {isSubmitting ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 mr-2 inline"
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

            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-4xl font-extrabold text-center text-indigo-900 mb-8">
                   Add Question 
                </h1>

                {/* Validation Error Message */}
                {isSubmitDisabled && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        Please fix all errors before submitting
                    </div>
                )}

                {/* Question Action Bar */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md mb-6 border border-gray-200">
                    <div className="flex gap-4">
                        <button
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition"
                            onClick={() => fileRef.current.click()}
                        >
                            <FiUpload /> Import Questions
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFile}
                            className="hidden"
                        />
                        <div className="relative group">
                            <button
                                className="flex items-center gap-2 px-5 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                                onClick={clearAll}
                            >
                                <FiTrash2 /> Clear All
                            </button>
                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-2 w-48 z-10">
                                Clears all questions and resets the form.
                            </div>
                        </div>
                    </div>
                    <span className="font-semibold text-lg text-indigo-900">
                        Total Questions: {questions.length}
                    </span>
                </div>

                {/* Import Status */}
                {importStatus && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg">
                        {importStatus}
                    </div>
                )}

                {/* Questions List */}
                {pagedQuestions.map((q, idx) => {
                    const globalIdx = currentPage * QUESTIONS_PER_PAGE + idx;
                    return (
                        <div
                            key={globalIdx}
                            className="bg-white border border-gray-200 shadow-md rounded-2xl p-6 mb-6 relative"
                        >
                            {questions.length > 1 && (
                                <button
                                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-2xl transition"
                                    title="Delete this question"
                                    onClick={() => deleteQuestion(globalIdx)}
                                >
                                    &times;
                                </button>
                            )}
                            <div className="text-lg font-semibold text-indigo-900 mb-4">
                                Question {globalIdx + 1}
                            </div>
                            <textarea
                                className={`w-full p-4 rounded-lg border ${errors[globalIdx]?.questionText
                                        ? "border-red-400"
                                        : "border-gray-300"
                                    } bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                                value={q.questionText}
                                onChange={(e) => handleQuestionChange(globalIdx, e.target.value)}
                                placeholder="Enter your question here..."
                                rows={3}
                            />
                            {errors[globalIdx]?.questionText && (
                                <p className="text-red-500 text-sm ml-4 mt-1">
                                    {errors[globalIdx].questionText}
                                </p>
                            )}
                            <div className="space-y-4 mt-4">
                                {q.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name={`correct-${globalIdx}`}
                                            checked={q.correctAnswerIndex === oi}
                                            onChange={() => setCorrectAnswer(globalIdx, oi)}
                                            className="w-5 h-5 accent-indigo-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Option ${oi + 1}`}
                                            value={opt}
                                            onChange={(e) =>
                                                handleOptionChange(globalIdx, oi, e.target.value)
                                            }
                                            className={`flex-1 p-3 rounded-lg border ${oi < 2 && errors[globalIdx]?.options && !opt.trim()
                                                    ? "border-red-400"
                                                    : "border-gray-300"
                                                } bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                                            required={oi < 2}
                                        />
                                        {oi > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOption(globalIdx, oi)}
                                                className="text-red-500 hover:text-red-700 transition"
                                                title="Remove option"
                                            >
                                                <FiTrash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {errors[globalIdx]?.options && (
                                    <p className="text-red-500 text-sm ml-8">
                                        {errors[globalIdx].options}
                                    </p>
                                )}
                                {q.options.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => addOption(globalIdx)}
                                        className="ml-8 text-indigo-600 font-semibold hover:text-indigo-800 transition"
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Pagination */}
                {numPages > 1 && (
                    <div className="flex justify-center gap-6 mb-8">
                        <button
                            className="px-6 py-2 font-semibold rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition disabled:opacity-50"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        >
                            Prev
                        </button>
                        <span className="font-semibold text-lg text-indigo-900 my-auto">
                            {currentPage + 1} / {numPages}
                        </span>
                        <button
                            className="px-6 py-2 font-semibold rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition disabled:opacity-50"
                            disabled={currentPage === numPages - 1}
                            onClick={() => setCurrentPage((p) => Math.min(numPages - 1, p + 1))}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Add Question Button */}
                <div className="flex justify-end mt-8">
                    <button
                        className="px-8 py-3 bg-indigo-500 text-white rounded-full font-semibold hover:bg-indigo-600 transition transform hover:scale-105"
                        onClick={addQuestion}
                    >
                        <FiPlusCircle className="inline -mt-1 mr-2" /> Add Question
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Questions;