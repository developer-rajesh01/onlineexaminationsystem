import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiTrash2, FiPlusCircle } from "react-icons/fi";
import * as XLSX from "xlsx";

const QUESTIONS_PER_PAGE = 10;

// Fake async MongoDB save
const saveQuestionsToDB = async (data) => {
    return new Promise((res) =>
        setTimeout(() => {
            console.log("Saved to MongoDB:", data);
            res({ success: true });
        }, 1000)
    );
};

function CreateTest() {
    // Initialize state with data from localStorage if available
    const [quiz, setQuiz] = useState(() => {
        const savedQuiz = localStorage.getItem("quizData");
        return savedQuiz
            ? JSON.parse(savedQuiz)
            : {
                title: "",
                duration: "",
                startDate: "",
                startTime: "",
                targetAudience: "",
                author: "",
                passMarks: "",
                totalMarks: "",
            };
    });

    const [questions, setQuestions] = useState(() => {
        const savedQuestions = localStorage.getItem("questionsData");
        return savedQuestions
            ? JSON.parse(savedQuestions)
            : [{ questionText: "", options: ["", ""], correctIdx: 0 }];
    });

    const [errors, setErrors] = useState({});
    const [quizErrors, setQuizErrors] = useState({});
    const [validationMessage, setValidationMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [importedQuestions, setImportedQuestions] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStatus, setImportStatus] = useState("");
    const fileRef = useRef();

    // Save quiz and questions to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("quizData", JSON.stringify(quiz));
    }, [quiz]);

    useEffect(() => {
        localStorage.setItem("questionsData", JSON.stringify(questions));
    }, [questions]);

    // Validate quiz information
    const validateQuiz = () => {
        const newErrors = {};
        const requiredFields = [
            "title",
            "duration",
            "startDate",
            "startTime",
            "targetAudience",
            "author",
            "totalMarks",
        ];
        requiredFields.forEach((field) => {
            if (!quiz[field].trim()) {
                newErrors[field] = true;
            }
        });
        return newErrors;
    };

    // Validate a single question
    const validateQuestion = (q) => ({
        questionText: !q.questionText?.trim(),
        options: q.options.map((opt) => !String(opt || "").trim()),
        minOptions: q.options.filter((opt) => String(opt || "").trim()).length < 2,
    });

    // Validate all questions
    const validateQuestions = () => {
        const newErrors = {};
        let hasValidQuestion = false;
        questions.forEach((q, idx) => {
            const qErrors = validateQuestion(q);
            if (
                qErrors.questionText ||
                qErrors.minOptions ||
                qErrors.options.some((e) => e)
            ) {
                newErrors[idx] = qErrors;
            } else {
                hasValidQuestion = true;
            }
        });
        return { errors: newErrors, hasValidQuestion };
    };

    const handleQuizChange = (field, val) => {
        setQuiz((prev) => ({ ...prev, [field]: val }));
        setQuizErrors((prev) => ({ ...prev, [field]: !val.trim() }));
        setValidationMessage("");
    };

    const handleQChange = (idx, val) => {
        const updated = [...questions];
        updated[idx].questionText = val;
        setQuestions(updated);
        setErrors((prev) => ({ ...prev, [idx]: validateQuestion(updated[idx]) }));
        setValidationMessage("");
    };

    const handleOChange = (qi, oi, val) => {
        const updated = [...questions];
        updated[qi].options[oi] = val;
        setQuestions(updated);
        setErrors((prev) => ({ ...prev, [qi]: validateQuestion(updated[qi]) }));
        setValidationMessage("");
    };

    const addOption = (qi) => {
        if (questions[qi].options.length < 4) {
            const updated = [...questions];
            updated[qi].options.push("");
            setQuestions(updated);
            setErrors((prev) => ({ ...prev, [qi]: validateQuestion(updated[qi]) }));
        }
    };

    const setCorrect = (qi, oi) => {
        const updated = [...questions];
        updated[qi].correctIdx = oi;
        setQuestions(updated);
    };

    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            { questionText: "", options: ["", ""], correctIdx: 0 },
        ]);
        setErrors((prev) => ({
            ...prev,
            [questions.length]: validateQuestion({
                questionText: "",
                options: ["", ""],
                correctIdx: 0,
            }),
        }));
    };

    const deleteQuestion = (idx) => {
        if (questions.length === 1) return;
        const updated = questions.filter((_, i) => i !== idx);
        setQuestions(updated);
        setErrors((prev) => {
            const { [idx]: _, ...rest } = prev;
            return rest;
        });
    };

    const numPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    const pagedQuestions = questions.slice(
        currentPage * QUESTIONS_PER_PAGE,
        (currentPage + 1) * QUESTIONS_PER_PAGE
    );

    const clearAll = () => {
        setQuestions([{ questionText: "", options: ["", ""], correctIdx: 0 }]);
        setQuiz({
            title: "",
            duration: "",
            startDate: "",
            startTime: "",
            targetAudience: "",
            author: "",
            passMarks: "",
            totalMarks: "",
        });
        setCurrentPage(0);
        setErrors({});
        setQuizErrors({});
        setValidationMessage("");
        localStorage.removeItem("quizData");
        localStorage.removeItem("questionsData");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json(sheet);
            const imported = raw
                .map((row) => ({
                    questionText: String(row.Question || ""),
                    options: [
                        String(row.Option1 ?? ""),
                        String(row.Option2 ?? ""),
                        String(row.Option3 ?? ""),
                        String(row.Option4 ?? ""),
                    ].filter((opt) => opt !== ""),
                    correctIdx: 0,
                }))
                .filter((q) => q.questionText.trim() && q.options.length >= 2);
            if (imported.length === 0) {
                setImportStatus("No valid questions found in the file.");
                setTimeout(() => setImportStatus(""), 2500);
                return;
            }
            console.log("Imported questions:", imported); // Debug log
            setImportedQuestions(imported);
            setShowImportModal(true);
        };
        reader.readAsBinaryString(file);
    };

    const handleImportYes = async () => {
        await saveQuestionsToDB(importedQuestions);
        setQuestions((prev) => [...prev, ...importedQuestions]);
        setImportStatus(`${importedQuestions.length} questions imported & saved!`);
        setShowImportModal(false);
        setImportedQuestions([]);
        setErrors((prev) => {
            const newErrors = { ...prev };
            importedQuestions.forEach((q, i) => {
                newErrors[questions.length + i] = validateQuestion(q);
            });
            return newErrors;
        });
        setTimeout(() => setImportStatus(""), 2500);
    };

    const handleImportNo = () => {
        setQuestions((prev) => [...prev, ...importedQuestions]);
        setImportStatus(`${importedQuestions.length} questions imported (not saved to DB)!`);
        setShowImportModal(false);
        setImportedQuestions([]);
        setErrors((prev) => {
            const newErrors = { ...prev };
            importedQuestions.forEach((q, i) => {
                newErrors[questions.length + i] = validateQuestion(q);
            });
            return newErrors;
        });
        setTimeout(() => setImportStatus(""), 2500);
    };

    const handleCreateTest = () => {
        // Validate quiz information
        const quizValidationErrors = validateQuiz();
        setQuizErrors(quizValidationErrors);

        // Validate questions
        const { errors: questionErrors, hasValidQuestion } = validateQuestions();
        setErrors(questionErrors);

        // Check if validation passes
        if (Object.keys(quizValidationErrors).length > 0 || !hasValidQuestion) {
            const messages = [];
            if (Object.keys(quizValidationErrors).length > 0) {
                messages.push("Please fill in all required quiz information fields.");
            }
            if (!hasValidQuestion) {
                messages.push(
                    "At least one question with a valid question text and at least two non-empty options is required."
                );
            }
            setValidationMessage(messages.join(" "));
            return;
        }

        // If validation passes, proceed to save
        console.log("QUIZ DATA SUBMITTED:", { ...quiz, questions });
        alert("Test saved! See console for stored object.");
        setValidationMessage("");
        // Optionally clear localStorage after saving
        localStorage.removeItem("quizData");
        localStorage.removeItem("questionsData");
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-8">
            {/* Top "Save All" Button */}
            <button
                className="fixed right-6 top-20 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105 z-50"
                onClick={handleCreateTest}
            >
                Create
            </button>

            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-4xl font-extrabold text-center text-indigo-900 mb-8">
                    {quiz.title.trim() ? `${quiz.title}` : "Create a New Test"}
                </h1>

                {/* Validation Error Message */}
                {validationMessage && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        {validationMessage}
                    </div>
                )}

                {/* Quiz Information Section */}
                <section className="mb-10 p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <h2 className="text-2xl font-bold text-indigo-900 border-b border-indigo-200 pb-3 mb-6">
                        Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: "title", placeholder: "Title", type: "text" },
                            { id: "duration", placeholder: "Duration (minutes)", type: "number" },
                            { id: "startDate", placeholder: "Start Date", type: "date" },
                            { id: "startTime", placeholder: "Start Time", type: "time" },
                            { id: "targetAudience", placeholder: "Target Audience", type: "text" },
                            { id: "author", placeholder: "Author", type: "text" },
                            { id: "passMarks", placeholder: "Pass Marks (optional)", type: "number" },
                            { id: "totalMarks", placeholder: "Total Marks", type: "number" },
                        ].map((field) => (
                            <input
                                key={field.id}
                                type={field.type}
                                placeholder={field.placeholder}
                                value={quiz[field.id]}
                                onChange={(e) => handleQuizChange(field.id, e.target.value)}
                                className={`p-3 rounded-lg border ${quizErrors[field.id] ? "border-red-400" : "border-gray-300"
                                    } bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                            />
                        ))}
                    </div>
                </section>

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
                            onChange={handleImport}
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
                                Clears all quiz information and questions.
                            </div>
                        </div>
                    </div>
                    <span className="font-semibold text-lg text-indigo-900">
                        Total Questions: {questions.length}
                    </span>
                </div>

                {/* Import Confirmation Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                            <h3 className="text-xl font-bold text-indigo-900 mb-4">
                                Import {importedQuestions.length} Questions?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Would you like to save these questions to the database?
                            </p>
                            <div className="flex gap-4 justify-end">
                                <button
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                                    onClick={handleImportYes}
                                >
                                    Yes
                                </button>
                                <button
                                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
                                    onClick={handleImportNo}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Import Status */}
                {!!importStatus && (
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
                            <button
                                className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-2xl transition"
                                title="Delete this question"
                                onClick={() => deleteQuestion(globalIdx)}
                            >
                                &times;
                            </button>
                            <div className="text-lg font-semibold text-indigo-900 mb-4">
                                Question {globalIdx + 1}
                            </div>
                            <textarea
                                className={`w-full p-4 rounded-lg border ${errors[globalIdx]?.questionText
                                    ? "border-red-400"
                                    : "border-gray-300"
                                    } bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                                rows={3}
                                placeholder="Enter your question here..."
                                required
                                value={q.questionText}
                                onChange={(e) => handleQChange(globalIdx, e.target.value)}
                            />
                            {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-3 mb-4">
                                    <input
                                        type="radio"
                                        checked={q.correctIdx === oi}
                                        onChange={() => setCorrect(globalIdx, oi)}
                                        className="w-5 h-5 accent-indigo-500"
                                        name={`opt-${globalIdx}`}
                                    />
                                    <input
                                        type="text"
                                        required
                                        className={`flex-1 p-3 rounded-lg border ${errors[globalIdx]?.options && errors[globalIdx].options[oi]
                                            ? "border-red-400"
                                            : "border-gray-300"
                                            } bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
                                        placeholder={`Option ${oi + 1}`}
                                        value={opt}
                                        onChange={(e) => handleOChange(globalIdx, oi, e.target.value)}
                                    />
                                </div>
                            ))}
                            {errors[globalIdx]?.minOptions && (
                                <div className="text-red-500 text-sm ml-8 mb-4">
                                    At least two non-empty options are required.
                                </div>
                            )}
                            {q.options.length < 4 && (
                                <button
                                    className="ml-8 text-indigo-600 font-semibold hover:text-indigo-800 transition"
                                    onClick={() => addOption(globalIdx)}
                                    type="button"
                                >
                                    + Add Option
                                </button>
                            )}
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

export default CreateTest;