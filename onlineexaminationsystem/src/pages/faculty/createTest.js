import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiTrash2, FiPlusCircle } from "react-icons/fi";
import * as XLSX from "xlsx";
import { useNavigate, useLocation, useParams } from "react-router-dom";

const QUESTIONS_PER_PAGE = 10;

// Simulated async save to DB placeholder; replace with real API call
const saveQuestionsToDB = async (data) =>
    new Promise((res) =>
        setTimeout(() => {
            console.log("Saved to MongoDB:", data);
            res({ success: true });
        }, 1000)
    );

function isoToLocalInputValue(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localInputValueToIso(localValue) {
    if (!localValue) return "";
    const d = new Date(localValue);
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
}

function CreateTest() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    // detect if editing (so we skip localStorage for edit mode)
    const isEditMode = Boolean(id || location?.state?.task);

    // use localStorage only if NOT editing
    const [quiz, setQuiz] = useState(() => {
        if (isEditMode) {
            return {
                title: "",
                duration: "",
                startDate: "",
                startTime: "",
                targetAudience: "",
                author: "",
                passMarks: "",
                totalMarks: "",
                institute: "",
            };
        }
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
                institute: "",
            };
    });

    const [startTimestampInput, setStartTimestampInput] = useState(""); // datetime-local value (for startTimestamp)
    const [institute, setInstitute] = useState("");

    // Load institute & author from localStorage
    useEffect(() => {
        const inst = localStorage.getItem("institute") || "";
        const authorFromStorage =
            localStorage.getItem("author") ||
            localStorage.getItem("name") ||
            localStorage.getItem("email") ||
            "";
        setQuiz((prev) => ({ ...prev, institute: inst, author: authorFromStorage }));
        setInstitute(inst);
    }, []);

    // questions initial state: use localStorage only when NOT editing
    const [questions, setQuestions] = useState(() => {
        if (isEditMode) {
            return [{ questionText: "", options: ["", ""], correctIdx: 0 }];
        }
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

    // Audience suggestion data
    const COURSES = [
        "BCA",
        "MCA",
        "BTech",
        "B.Sc",
        "B.A",
        "M.Sc",
        "BCom",
        "MBA",
        "Diploma",
    ];
    const BATCHES = Array.from({ length: 10 }, (_, i) => `Batch${i + 1}`);

    const [audienceSuggestions, setAudienceSuggestions] = useState([]);

    // Persist quiz and questions in localStorage
    useEffect(() => {
        localStorage.setItem("quizData", JSON.stringify(quiz));
    }, [quiz]);

    useEffect(() => {
        localStorage.setItem("questionsData", JSON.stringify(questions));
    }, [questions]);

    // If editing: prefill from location.state.task OR fetch by id
    useEffect(() => {
        const incoming = location?.state?.task;
        if (incoming) {
            // Map incoming structure into our form shape
            setQuiz((prev) => ({
                ...prev,
                title: incoming.title ?? prev.title,
                duration: incoming.duration ? String(incoming.duration) : prev.duration,
                targetAudience: incoming.targetAudience ?? prev.targetAudience,
                author: incoming.author ?? prev.author,
                passMarks:
                    incoming.passMarks !== undefined && incoming.passMarks !== null
                        ? String(incoming.passMarks)
                        : prev.passMarks,
                totalMarks:
                    incoming.totalMarks !== undefined && incoming.totalMarks !== null
                        ? String(incoming.totalMarks)
                        : prev.totalMarks,
                institute: incoming.institute ?? prev.institute,
                startDate: incoming.startDate ?? prev.startDate,
                startTime: incoming.startTime ?? prev.startTime,
            }));

            // prefer startTimestamp
            if (incoming.startTimestamp) {
                setStartTimestampInput(isoToLocalInputValue(incoming.startTimestamp));
            } else if (incoming.startDate && incoming.startTime) {
                // optional: combine date + time into datetime-local if both present
                try {
                    const combined = new Date(`${incoming.startDate}T${incoming.startTime}`);
                    if (!isNaN(combined.getTime())) {
                        setStartTimestampInput(isoToLocalInputValue(combined.toISOString()));
                    }
                } catch {
                    // ignore
                }
            }

            // questions: try to copy incoming.questions if present
            if (Array.isArray(incoming.questions) && incoming.questions.length) {
                // ensure each question has options array and correctIdx
                const mapped = incoming.questions.map((q) => ({
                    questionText: q.questionText ?? q.text ?? "",
                    options: Array.isArray(q.options)
                        ? q.options
                        : [
                            q.option1 ?? "",
                            q.option2 ?? "",
                            q.option3 ?? "",
                            q.option4 ?? "",
                        ].filter(() => true), // keep blanks as-is
                    correctIdx:
                        typeof q.correctIdx === "number"
                            ? q.correctIdx
                            : q.correctOptionIndex ?? 0,
                }));
                setQuestions(mapped.length ? mapped : [{ questionText: "", options: ["", ""], correctIdx: 0 }]);
            }
            return;
        }

        // If no incoming state but :id present, fetch from API
        let cancelled = false;
        if (id) {
            (async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/tests/${id}`, { credentials: "include" });
                    if (!res.ok) {
                        const txt = await res.text().catch(() => "");
                        throw new Error(`${res.status} ${txt}`);
                    }
                    const data = await res.json();
                    if (cancelled) return;
                    const t = data?.data || data || {};
                    setQuiz((prev) => ({
                        ...prev,
                        title: t.title ?? prev.title,
                        duration: t.duration ? String(t.duration) : prev.duration,
                        targetAudience: t.targetAudience ?? prev.targetAudience,
                        author: t.author ?? prev.author,
                        passMarks:
                            t.passMarks !== undefined && t.passMarks !== null ? String(t.passMarks) : prev.passMarks,
                        totalMarks:
                            t.totalMarks !== undefined && t.totalMarks !== null ? String(t.totalMarks) : prev.totalMarks,
                        institute: t.institute ?? prev.institute,
                        startDate: t.startDate ?? prev.startDate,
                        startTime: t.startTime ?? prev.startTime,
                    }));
                    if (t.startTimestamp) {
                        setStartTimestampInput(isoToLocalInputValue(t.startTimestamp));
                    } else if (t.startDate && t.startTime) {
                        try {
                            const combined = new Date(`${t.startDate}T${t.startTime}`);
                            if (!isNaN(combined.getTime())) {
                                setStartTimestampInput(isoToLocalInputValue(combined.toISOString()));
                            }
                        } catch { }
                    }
                    if (Array.isArray(t.questions) && t.questions.length) {
                        const mapped = t.questions.map((q) => ({
                            questionText: q.questionText ?? q.text ?? "",
                            options: Array.isArray(q.options)
                                ? q.options
                                : [
                                    q.option1 ?? "",
                                    q.option2 ?? "",
                                    q.option3 ?? "",
                                    q.option4 ?? "",
                                ],
                            correctIdx:
                                typeof q.correctIdx === "number"
                                    ? q.correctIdx
                                    : q.correctOptionIndex ?? 0,
                        }));
                        setQuestions(mapped.length ? mapped : [{ questionText: "", options: ["", ""], correctIdx: 0 }]);
                    }
                } catch (err) {
                    console.error("Failed to load test for edit:", err);
                }
            })();
        }
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, id]);

    // --- SYNC: when separate date+time inputs changed, set datetime-local (if user hasn't explicitly set it) ---
    useEffect(() => {
        // Only sync into datetime-local when user hasn't manually typed a datetime-local.
        // This avoids overwriting a deliberate datetime-local choice.
        if (startTimestampInput) return; // user already set datetime-local - don't override

        const d = quiz.startDate;
        const t = quiz.startTime;
        if (!d || !t) return;

        try {
            // build a local datetime string "YYYY-MM-DDTHH:mm"
            const combinedLocal = `${d}T${t}`; // e.g. "2025-11-08T17:42"
            const dt = new Date(combinedLocal);
            if (!isNaN(dt.getTime())) {
                setStartTimestampInput(isoToLocalInputValue(dt.toISOString()));
            }
        } catch (e) {
            // ignore invalid combos
        }
    }, [quiz.startDate, quiz.startTime, startTimestampInput]);

    // --- SYNC: when datetime-local changed, update the separate date/time inputs so both are visible ---
    useEffect(() => {
        if (!startTimestampInput) return;
        try {
            // startTimestampInput is like "2025-11-08T22:12"
            const d = new Date(startTimestampInput);
            if (isNaN(d.getTime())) return;

            const pad = (n) => String(n).padStart(2, "0");
            const yyyy = d.getFullYear();
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const hh = pad(d.getHours());
            const min = pad(d.getMinutes());

            const dateStr = `${yyyy}-${mm}-${dd}`;
            const timeStr = `${hh}:${min}`;

            // set into quiz form state (so the visible date/time inputs show the composed values)
            setQuiz((prev) => ({ ...prev, startDate: dateStr, startTime: timeStr }));
        } catch (e) {
            // ignore
        }
    }, [startTimestampInput]);

    const todayStr = () => new Date().toISOString().split("T")[0];

    const validateQuiz = () => {
        const newErrors = {};
        const requiredFields = [
            "title",
            "duration",
            // startDate & startTime are optional if startTimestamp provided
            "targetAudience",
            "totalMarks",
        ];

        requiredFields.forEach((field) => {
            // If startTimestamp is set, don't require startDate/startTime individually
            if ((field === "startDate" || field === "startTime") && startTimestampInput) return;
            if (!quiz[field] || !quiz[field].toString().trim()) {
                newErrors[field] = true;
            }
        });

        // startDate must be today or future (only if startTimestamp not used and startDate provided)
        if (!startTimestampInput && quiz.startDate && quiz.startDate < todayStr()) {
            newErrors.startDate = "Date cannot be in the past";
        }

        if (
            quiz.passMarks !== "" &&
            quiz.passMarks !== undefined &&
            quiz.totalMarks !== "" &&
            quiz.totalMarks !== undefined
        ) {
            const pm = Number(quiz.passMarks);
            const tm = Number(quiz.totalMarks);
            if (!isNaN(pm) && !isNaN(tm) && pm >= tm) {
                newErrors.passMarks = "Pass marks must be smaller than total marks";
            }
        }

        return newErrors;
    };

    const validateQuestion = (q) => ({
        questionText: !q.questionText?.trim(),
        options: q.options.map((opt) => !String(opt || "").trim()),
        minOptions: q.options.filter((opt) => String(opt || "").trim()).length < 2,
    });

    const validateQuestions = () => {
        const newErrors = {};
        let hasValidQuestion = false;
        questions.forEach((q, idx) => {
            const qErrors = validateQuestion(q);
            if (qErrors.questionText || qErrors.minOptions || qErrors.options.some((e) => e)) {
                newErrors[idx] = qErrors;
            } else {
                hasValidQuestion = true;
            }
        });
        return { errors: newErrors, hasValidQuestion };
    };

    const handleQuizChange = (field, val) => {
        // date cannot be in past -- immediate feedback
        if (field === "startDate") {
            if (val && val < todayStr()) {
                setQuizErrors((prev) => ({ ...prev, startDate: true }));
                setValidationMessage("Start date cannot be before today.");
                setQuiz((prev) => ({ ...prev, [field]: val })); // still set value so user can correct
                return;
            } else {
                setQuizErrors((prev) => {
                    const { startDate, ...rest } = prev;
                    return rest;
                });
            }
        }

        if (field === "targetAudience") {
            setQuiz((prev) => ({ ...prev, [field]: val }));

            const tokens = val.split(",").map((t) => t.trim()).filter(Boolean);
            const last = tokens.length ? tokens[tokens.length - 1] : "";
            const term = last.toLowerCase();

            const matches = [];
            if (!term) {
                matches.push(...COURSES.concat(BATCHES));
            } else {
                matches.push(
                    ...COURSES.filter((c) => c.toLowerCase().includes(term)),
                    ...BATCHES.filter((b) => b.toLowerCase().includes(term))
                );
            }
            const uniq = Array.from(new Set(matches));
            setAudienceSuggestions(uniq.slice(0, 20));
            setQuizErrors((prev) => ({ ...prev, targetAudience: !val.trim() }));
            setValidationMessage("");
            return;
        }

        setQuiz((prev) => ({ ...prev, [field]: val }));
        setQuizErrors((prev) => ({ ...prev, [field]: !String(val || "").trim() }));
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
        if (questions.length === 1) return; // prevent deleting last question silently
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
            author:
                localStorage.getItem("author") ||
                localStorage.getItem("name") ||
                localStorage.getItem("email") ||
                "",
            passMarks: "",
            totalMarks: "",
            institute: "",
        });
        setStartTimestampInput("");
        setCurrentPage(0);
        setErrors({});
        setQuizErrors({});
        setValidationMessage("");
        localStorage.removeItem("quizData");
        localStorage.removeItem("questionsData");
    };

    // Import from Excel
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
                .map((row) => {
                    const options = [
                        String(row.Option1 ?? ""),
                        String(row.Option2 ?? ""),
                        String(row.Option3 ?? ""),
                        String(row.Option4 ?? ""),
                    ].filter((opt) => opt !== "");

                    let correctIdx = 0;
                    if (typeof row.CorrectAnswer === "string") {
                        const optionMap = { A: 0, B: 1, C: 2, D: 3 };
                        const answerKey = row.CorrectAnswer.toUpperCase().trim();
                        correctIdx = optionMap[answerKey] ?? 0;
                        if (correctIdx >= options.length) correctIdx = 0;
                    }

                    return {
                        questionText: String(row.Question || ""),
                        options: options.length ? options : ["", ""],
                        correctIdx: correctIdx,
                    };
                })
                .filter((q) => q.questionText.trim() && q.options.length >= 2);

            if (imported.length === 0) {
                setImportStatus("No valid questions found in the file.");
                setTimeout(() => setImportStatus(""), 2500);
                return;
            }

            setImportedQuestions(imported);
            setShowImportModal(true);
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const handleImportYes = async () => {
        await saveQuestionsToDB(importedQuestions); // Replace with real API call if needed
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

    const [isSaving, setIsSaving] = useState(false);
    const [facultyEmail, setFacultyEmail] = useState("");
    useEffect(() => {
        const email = localStorage.getItem("email");
        if (email) setFacultyEmail(email);
        const authorFromStorage =
            localStorage.getItem("author") ||
            localStorage.getItem("name") ||
            localStorage.getItem("email") ||
            "";
        setQuiz((prev) => ({ ...prev, author: authorFromStorage }));
    }, []);

    // Create or Save (update)
    const handleCreateOrSave = async () => {
        const quizValidationErrors = validateQuiz();
        const { errors: questionErrors, hasValidQuestion } = validateQuestions();

        setQuizErrors(quizValidationErrors);
        setErrors(questionErrors);

        const messages = [];
        if (Object.keys(quizValidationErrors).length > 0) {
            messages.push("Please fix the highlighted quiz information fields.");
        }
        if (!hasValidQuestion) {
            messages.push(
                "At least one question with valid question text and at least two non-empty options is required."
            );
        }
        if (messages.length > 0) {
            setValidationMessage(messages.join(" "));
            return;
        }

        // Build payload
        const payload = {
            title: quiz.title.trim(),
            duration: Number(quiz.duration),
            // prefer startTimestamp if set
            startTimestamp: startTimestampInput ? localInputValueToIso(startTimestampInput) : undefined,
            startDate: !startTimestampInput ? quiz.startDate : undefined,
            startTime: !startTimestampInput ? quiz.startTime : undefined,
            targetAudience: quiz.targetAudience.trim(),
            author:
                quiz.author?.trim() ||
                localStorage.getItem("author") ||
                localStorage.getItem("name") ||
                localStorage.getItem("email") ||
                "",
            passMarks: quiz.passMarks ? Number(quiz.passMarks) : undefined,
            totalMarks: Number(quiz.totalMarks),
            institute: quiz.institute?.trim() || "",
            questions,
            facultyEmail,
        };

        Object.keys(payload).forEach((k) => {
            if (payload[k] === undefined) delete payload[k];
        });

        setIsSaving(true);
        try {
            let res;
            if (id || location?.state?.task?._id) {
                // update flow: prefer URL id then task._id
                const targetId = id || location?.state?.task?._id;
                res = await fetch(`http://localhost:5000/api/tests/${targetId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });
            } else {
                // create
                res = await fetch("http://localhost:5000/api/tests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });
            }

            const text = await res.text().catch(() => "");
            let data;
            try {
                data = text ? JSON.parse(text) : null;
            } catch (e) {
                data = { message: text || null };
            }

            if (!res.ok) {
                console.error("Save failed:", res.status, data);
                throw new Error(data?.message || `Server responded with ${res.status}`);
            }

            alert(id || location?.state?.task ? "Test saved successfully!" : "Test created successfully!");
            // After save remove local draft so stale data won't rehydrate later
            localStorage.removeItem("quizData");
            localStorage.removeItem("questionsData");

            // After save navigate back to dashboard (or wherever you want)
            navigate("/", { replace: true });
        } catch (err) {
            console.error("handleCreateOrSave error:", err);
            alert(`Error saving test: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const isEditing = Boolean(id || location?.state?.task);

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 py-8">
            <button
                className={`fixed right-6 top-20 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg transition transform z-50
    ${isSaving ? "opacity-75 cursor-not-allowed" : "hover:bg-indigo-700 hover:scale-105"}`}
                onClick={handleCreateOrSave}
                disabled={isSaving}
                type="button"
            >
                {isSaving ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                            <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></path>
                        </svg>
                        {isEditing ? "Saving…" : "Creating…"}
                    </span>
                ) : (
                    (isEditing ? "Save Changes" : "Create")
                )}
            </button>

            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-4xl font-extrabold text-center text-indigo-900 mb-8">
                    {quiz.title.trim() ? quiz.title : isEditing ? "Edit Test" : "Create a New Test"}
                </h1>

                {validationMessage && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        {validationMessage}
                    </div>
                )}

                {/* Quiz Info Inputs */}
                <section className="mb-10 p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <h2 className="text-2xl font-bold text-indigo-900 border-b border-indigo-200 pb-3 mb-6">
                        Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
                        {[
                            { id: "title", placeholder: "Title", type: "text" },
                            { id: "duration", placeholder: "Duration (minutes)", type: "number" },
                            { id: "startDate", placeholder: "Start Date", type: "date" },
                            { id: "startTime", placeholder: "Start Time", type: "time" },
                            { id: "targetAudience", placeholder: "Target Audience (comma separated)", type: "text" },
                            { id: "passMarks", placeholder: "Pass Marks (optional)", type: "number" },
                            { id: "totalMarks", placeholder: "Total Marks", type: "number" },
                        ].map((field) => (
                            <div key={field.id} className="flex flex-col justify-between space-y-1">
                                <input
                                    list={field.id === "targetAudience" ? "audience-list" : undefined}
                                    id={field.id}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={quiz[field.id] ?? ""}
                                    onChange={(e) => handleQuizChange(field.id, e.target.value)}
                                    className={`p-3 rounded-lg border ${quizErrors[field.id] ? "border-red-400" : "border-gray-300"
                                        } bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full`}
                                />

                                {field.id === "startDate" && quizErrors.startDate && (
                                    <div className="text-sm text-red-500 mt-1">
                                        {typeof quizErrors.startDate === "string" ? quizErrors.startDate : "Please choose today or a future date."}
                                    </div>
                                )}

                                {field.id === "passMarks" && quizErrors.passMarks && (
                                    <div className="text-sm text-red-500 mt-1">{quizErrors.passMarks}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <datalist id="audience-list">
                        {audienceSuggestions.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>
                </section>

                {/* Actions Bar */}
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
                    <span className="font-semibold text-lg text-indigo-900">Total Questions: {questions.length}</span>
                </div>

                {/* Import Confirmation Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                            <h3 className="text-xl font-bold text-indigo-900 mb-4">
                                Import {importedQuestions.length} Questions?
                            </h3>
                            <p className="text-gray-600 mb-6">Would you like to save these questions to the database?</p>
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
                            <div className="text-lg font-semibold text-indigo-900 mb-4">Question {globalIdx + 1}</div>
                            <textarea
                                className={`w-full p-4 rounded-lg border ${errors[globalIdx]?.questionText ? "border-red-400" : "border-gray-300"
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
                                <div className="text-red-500 text-sm ml-8 mb-4">At least two non-empty options are required.</div>
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
