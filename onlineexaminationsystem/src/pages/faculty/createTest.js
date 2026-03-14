import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiTrash2, FiPlusCircle } from "react-icons/fi";
import * as XLSX from "xlsx";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import FileUploader from "../../component/FileUploader";
// import DatabaseQuestions from "./DatabaseQuestionSelector"; 
import DatabaseQuestionSelector from "./DatabaseQuestionSelector";

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
    const urlId = useParams().id;  // Get id IMMEDIATELY
    const incomingTask = location?.state?.task;
    const isEditMode = Boolean(urlId || incomingTask);

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
    const [institute, setInstitute] = useState(() => {
        return localStorage.getItem("institute") || "My Institute";
    });
    // ✅ SECTIONS STATE - NEW!
    const [sections, setSections] = useState(() => {
        if (isEditMode) return [{ name: "General", marks: 10, questions: [] }];

        try {
            const saved = localStorage.getItem("sectionsData");
            return saved ? JSON.parse(saved) : [{ name: "General", marks: 10, questions: [] }];
        } catch {
            return [{ name: "General", marks: 10, questions: [] }];
        }
    });
    const [currentSectionIndex, setCurrentSectionIndex] = useState(() => {
        if (isEditMode) return 0;
        try {
            const saved = localStorage.getItem("currentSectionIndex");
            return saved && !isNaN(parseInt(saved)) ? parseInt(saved) : 0;
        } catch {
            return 0;
        }
    });


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

    // ✅ CURRENT SECTION QUESTIONS ONLY
    const currentSection = sections[currentSectionIndex];
    const [currentQuestions, setCurrentQuestions] = useState([{ questionText: "", options: ["", ""], correctIdx: 0 }]);
    useEffect(() => {
        // 🔥 ONLY sync if currentQuestions doesn't match section!
        const sectionQuestionsFlat = currentSection.questions.map(q => ({
            questionText: q.questionText || "",
            options: Array.isArray(q.options)
                ? q.options.map(opt => opt.text || opt || "")
                : q.options || [""],
            correctIdx: q.correctIdx || 0
        }));

        // ✅ ONLY update if different length OR first load
        if (currentQuestions.length !== sectionQuestionsFlat.length || currentSectionIndex === 0) {
            setCurrentQuestions(sectionQuestionsFlat);
        }
    }, [currentSectionIndex, currentSection.questions.length]);  // ✅ Smarter deps!

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



    // If editing: prefill from location.state.task OR fetch by id
    useEffect(() => {
        let cancelled = false;

        const loadEditData = async () => {
            try {
                // 1️⃣ Dashboard edit (location.state.task)
                const incoming = location?.state?.task;
                if (incoming) {
                    console.log("🟢 Loading dashboard edit:", incoming);

                    setQuiz({
                        title: incoming.title || "",
                        duration: incoming.duration?.toString() || "",
                        startDate: incoming.startDate || "",
                        startTime: incoming.startTime || "",
                        targetAudience: incoming.targetAudience || "",
                        author: incoming.author || "",
                        passMarks: incoming.passMarks?.toString() || "",
                        totalMarks: incoming.totalMarks?.toString() || "",
                        institute: incoming.institute || ""
                    });

                    // Load sections OR fallback to questions
                    const sectionsData = incoming.sections || [{
                        name: "General",
                        marks: Number(incoming.totalMarks) || 10,
                        questions: incoming.questions || []
                    }];

                    setSections(sectionsData.map(sec => ({
                        name: sec.name || "General",
                        marks: Number(sec.marks) || 10,
                        questions: (sec.questions || []).map(q => ({
                            questionText: q.questionText || q.text || "",
                            options: Array.isArray(q.options) ? q.options.map(o => o.text || o) : [],
                            correctIdx: Number(q.correctIdx || q.correctOptionIndex || 0)
                        }))
                    })));

                    setCurrentSectionIndex(0);
                    return;
                }

                // 2️⃣ URL edit (id param)
                if (id) {
                    console.log("🟢 Fetching API:", id);
                    const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
                        credentials: "include"
                    });

                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();

                    if (cancelled) return;

                    const t = data.data || data;
                    console.log("🟢 API data:", t);

                    setQuiz({
                        title: t.title || "",
                        duration: t.duration?.toString() || "",
                        startDate: t.startDate || "",
                        startTime: t.startTime || "",
                        targetAudience: t.targetAudience || "",
                        author: t.author || "",
                        passMarks: t.passMarks?.toString() || "",
                        totalMarks: t.totalMarks?.toString() || "",
                        institute: t.institute || ""
                    });

                    if (t.sections?.length) {
                        setSections(t.sections.map(sec => ({
                            name: sec.name || "General",
                            marks: Number(sec.marks) || 10,
                            questions: sec.questions.map(q => ({
                                questionText: q.questionText || q.text || "",
                                options: Array.isArray(q.options) ? q.options.map(o => o.text || o) : [],
                                correctIdx: Number(q.correctIdx || q.correctOptionIndex || 0)
                            }))
                        })));
                    }

                    setCurrentSectionIndex(0);
                }
            } catch (err) {
                console.error("❌ Edit failed:", err);
            }
        };

        if (isEditMode) loadEditData();
        return () => { cancelled = true; };
    }, [id, location?.state?.task, isEditMode]);


    useEffect(() => {
        if (startTimestampInput || quiz.startDate || quiz.startTime) return;  
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
        if (startTimestampInput || quiz.startDate || quiz.startTime) return;
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
        currentQuestions.forEach((q, idx) => {
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
        // 🔥 FIX: Prevent time input from resetting to current time
        if (field === "startTime" && quiz.startTime && val !== quiz.startTime) {
            setQuiz((prev) => ({ ...prev, [field]: val }));
            setQuizErrors((prev) => ({ ...prev, [field]: !val.trim() }));
            setValidationMessage("");
            return;
        }

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
        const updated = [...currentQuestions];
        updated[idx].questionText = val;
        setCurrentQuestions(updated);
        setErrors((prev) => ({ ...prev, [idx]: validateQuestion(updated[idx]) }));
        setValidationMessage("");
    };

    const handleOChange = (qi, oi, val) => {
        const updated = [...currentQuestions];
        updated[qi].options[oi] = val;
        setCurrentQuestions(updated);
        setErrors((prev) => ({ ...prev, [qi]: validateQuestion(updated[qi]) }));
        setValidationMessage("");
    };

    const addOption = (qi) => {
        if (currentQuestions[qi].options.length < 4) {
            const updated = [...currentQuestions];
            updated[qi].options.push("");
            setCurrentQuestions(updated);
            setErrors((prev) => ({ ...prev, [qi]: validateQuestion(updated[qi]) }));
        }
    };

    // ✅ FIXED - Syncs to SECTIONS too!
    const setCorrect = (qi, oi) => {
        // Update current questions
        const updatedQuestions = [...currentQuestions];
        updatedQuestions[qi].correctIdx = oi;
        setCurrentQuestions(updatedQuestions);

        // ✅ SYNC TO SECTIONS IMMEDIATELY
        setSections(prevSections => prevSections.map((sec, secIdx) =>
            secIdx === currentSectionIndex
                ? {
                    ...sec,
                    questions: updatedQuestions.map(q => ({
                        ...q,
                        correctIdx: q.correctIdx  // ✅ Preserve correctIdx!
                    }))
                }
                : sec
        ));

        console.log(`✅ Set Q${qi + 1} correct answer to option ${oi}`);  // DEBUG
    };


    const addQuestion = () => {
        const newQuestion = { questionText: "", options: ["", ""], correctIdx: 0 };
        setSections(sections.map((sec, i) =>
            i === currentSectionIndex
                ? { ...sec, questions: [...sec.questions, newQuestion] }
                : sec
        ));
        setCurrentQuestions(prev => [...prev, newQuestion]);
    };



    // ✅ CORRECT
    const deleteQuestion = (idx) => {
        if (currentQuestions.length === 1) return;

        // ✅ SYNC BACK TO SECTIONS
        setSections(sections.map((sec, i) =>
            i === currentSectionIndex
                ? { ...sec, questions: sec.questions.filter((_, qIdx) => qIdx !== idx) }
                : sec
        ));

        setCurrentQuestions(prev => prev.filter((_, i) => i !== idx));
        setErrors((prev) => {
            const { [idx]: _, ...rest } = prev;
            return rest;
        });
    };


    // ✅ CORRECT
    const numPages = Math.ceil(currentQuestions.length / QUESTIONS_PER_PAGE);
    const pagedQuestions = currentQuestions.slice(
        currentPage * QUESTIONS_PER_PAGE,
        (currentPage + 1) * QUESTIONS_PER_PAGE
    );

    const clearAll = () => {
        // 🔥 RESET EVERYTHING
        setSections([{ name: "General", marks: 10, questions: [] }]);
        setCurrentSectionIndex(0);
        setCurrentQuestions([{ questionText: "", options: ["", ""], correctIdx: 0 }]);
        setQuiz({
            title: "",
            duration: "",
            startDate: "",
            startTime: "",
            targetAudience: "",
            author: localStorage.getItem("author") || localStorage.getItem("name") || localStorage.getItem("email") || "",
            passMarks: "",
            totalMarks: "",
            institute: "",
        });
        setStartTimestampInput("");
        setCurrentPage(0);
        setErrors({});
        setQuizErrors({});
        setValidationMessage("");
        setImportStatus("");
        localStorage.removeItem("quizData");
        localStorage.removeItem("questionsData");
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
    // 🔥 PERSIST SECTIONS TO LOCALSTORAGE
    useEffect(() => {
        if (!isEditMode) {  // Don't persist in edit mode
            localStorage.setItem("sectionsData", JSON.stringify(sections));
            localStorage.setItem("currentSectionIndex", currentSectionIndex.toString());
        }
    }, [sections, currentSectionIndex, isEditMode]);


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

        // 🔥 CLEAN SIMPLE PAYLOAD - Backend generates all IDs!
        const payload = {
            title: quiz.title.trim(),
            duration: Number(quiz.duration),
            startTimestamp: startTimestampInput ? localInputValueToIso(startTimestampInput) : undefined,
            startDate: !startTimestampInput ? quiz.startDate : undefined,
            startTime: !startTimestampInput ? quiz.startTime : undefined,
            targetAudience: quiz.targetAudience.trim(),
            author: quiz.author?.trim() || localStorage.getItem("author") || localStorage.getItem("name") || localStorage.getItem("email") || "",
            passMarks: quiz.passMarks ? Number(quiz.passMarks) : undefined,
            totalMarks: sections.reduce((sum, sec) => sum + Number(sec.marks || 10), 0) || 100,
            institute: (quiz.institute || localStorage.getItem("institute") || institute || "Poornima University").trim(),
            facultyEmail,

            // 🔥 PERFECT FORMAT - Backend LOVES this!
            sections: sections.map(sec => ({
                name: sec.name || "General",
                marks: Number(sec.marks) || 10,
                questions: sec.questions.map(q => ({
                    questionText: String(q.questionText || ""),
                    options: (Array.isArray(q.options) ? q.options.slice(0, 4) : ["", "", "", ""]).map(opt => ({
                        text: String(opt || "")
                    }))
                }))
            }))
        };

        // Clean undefined fields
        Object.keys(payload).forEach((k) => {
            if (payload[k] === undefined) delete payload[k];
        });

        console.log("🚀 FULL PAYLOAD:", JSON.stringify(payload, null, 2));

        setIsSaving(true);
        try {
            let res;

            // 🔥 YOUR GENIUS IDEA: Delete old + create fresh!
            if (isEditMode) {
                const targetId = urlId || incomingTask?._id;
                console.log("🗑️ DELETING OLD TEST:", targetId);

                // Delete old test first (ignore errors)
                try {
                    await fetch(`http://localhost:5000/api/tests/${targetId}`, {
                        method: "DELETE",
                        credentials: "include"
                    });
                } catch (deleteErr) {
                    console.log("ℹ️ Delete ignored (might not exist):", deleteErr.message);
                }
            }

            // Always create FRESH new test ✅
            console.log("🆕 CREATING FRESH TEST");
            res = await fetch("http://localhost:5000/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

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

            alert(isEditMode ? "Test updated successfully!" : "Test created successfully!");

            // Clear local draft
            localStorage.removeItem("quizData");
            localStorage.removeItem("sectionsData");
            localStorage.removeItem("currentSectionIndex");

            navigate("/", { replace: true });
        } catch (err) {
            console.error("handleCreateOrSave error:", err);
            alert(`Error saving test: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };


    const isEditing = Boolean(urlId || incomingTask);
    const [showDBSelector, setShowDBSelector] = useState(false);

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
                <section className="mb-12 p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl 
  border border-white/50 hover:shadow-3xl transition-all duration-300">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-900 to-purple-900 
    bg-clip-text text-transparent mb-8 pb-4 border-b-4 border-indigo-200">
                        📋 Test Information
                    </h2>

                    {/* Enhanced responsive grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {[
                            { id: "title", placeholder: "Test Title", icon: "📝", className: "col-span-2 md:col-span-1" },
                            { id: "duration", placeholder: "Duration (min)", icon: "⏱️", className: "" },
                            { id: "startDate", placeholder: "Start Date", icon: "📅", className: "", type: "date" },
                            { id: "startTime", placeholder: "Start Time", icon: "🕐", className: "", type: "time" },
                            { id: "targetAudience", placeholder: "Target Audience", icon: "👥", className: "col-span-2 md:col-span-1", type: "select" },
                            { id: "passMarks", placeholder: "Pass Marks", icon: "✅", className: "" },
                        ].map((field) => (
                            <div key={field.id} className={`${field.className} group`}>
                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    {field.icon} {field.placeholder}
                                </label>

                                {/* ✅ CUSTOM DROPDOWN for targetAudience */}
                                {field.id === "targetAudience" ? (
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl opacity-60 z-10">
                                            {field.icon}
                                        </div>

                                        {/* ✅ TYPEAHEAD INPUT */}
                                        <input
                                            id={field.id}
                                            type="text"
                                            placeholder="Type 'BCA' or 'Batch' to search..."
                                            value={quiz[field.id] ?? ""}
                                            onChange={(e) => handleQuizChange(field.id, e.target.value)}  // ✅ Your existing handler!
                                            className={`w-full p-4 pl-12 pr-4 rounded-2xl border-2 bg-gradient-to-r from-gray-50/50 to-blue-50/50 
        text-gray-900 font-medium text-lg backdrop-blur-sm transition-all duration-300
        focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 
        hover:border-indigo-300 hover:shadow-lg group-hover:scale-[1.02] 
        ${quizErrors[field.id] ? 'border-red-400 bg-red-50/50 focus:ring-red-500/30' : 'border-gray-200'}`}
                                        />

                                        {/* ✅ FIXED DROPDOWN - Replace the entire dropdown div */}
                                        {audienceSuggestions.length > 0 && quiz.targetAudience && (
                                            <div className="fixed top-28 left-1/2 -translate-x-1/2 mt-2 w-96 bg-white/98 backdrop-blur-3xl 
    border-4 border-indigo-200/80 rounded-3xl shadow-2xl max-h-80 overflow-auto z-[999999] mx-4 animate-in fade-in">

                                                {audienceSuggestions.slice(0, 10).map((audience) => (
                                                    <div
                                                        key={audience}
                                                        className="px-6 py-4 hover:bg-indigo-100 cursor-pointer border-b border-gray-100 
          last:border-b-0 hover:text-indigo-800 transition-all font-semibold text-lg hover:scale-[1.02]"
                                                        onClick={() => {
                                                            handleQuizChange("targetAudience", audience);
                                                            setAudienceSuggestions([]);
                                                        }}
                                                    >
                                                        {audience}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                ) : (
 
                                    // ✅ Original input for other fields
                                    <div className="relative">
                                        <input
                                            list={field.id === "targetAudience" ? "audience-list" : undefined}
                                            id={field.id}
                                            type={field.type || "text"}
                                            placeholder={`Enter ${field.placeholder.toLowerCase()}...`}
                                            value={quiz[field.id] ?? ""}
                                            onChange={(e) => handleQuizChange(field.id, e.target.value)}
                                            className={`w-full p-4 pl-12 pr-4 rounded-2xl border-2 bg-gradient-to-r from-gray-50/50 to-blue-50/50 
            text-gray-900 placeholder-gray-500 font-medium text-lg backdrop-blur-sm transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 
            hover:border-indigo-300 hover:shadow-lg group-hover:scale-[1.02] 
            ${quizErrors[field.id] ? 'border-red-400 bg-red-50/50 focus:ring-red-500/30' : 'border-gray-200'}`}
                                        />
                                        {field.icon && (
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl opacity-60">
                                                {field.icon}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {quizErrors[field.id] && (
                                    <p className="text-red-500 text-sm mt-2 font-medium animate-pulse">
                                        {typeof quizErrors[field.id] === "string" ? quizErrors[field.id] : "This field is required"}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-12 p-8 bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 
  backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-200/50 hover:shadow-3xl transition-all">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 
    bg-clip-text text-transparent mb-8 flex items-center gap-3">
                        📚 Test Sections
                    </h2>

                    {/* Enhanced tabs */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {sections.map((sec, idx) => (
                            <button
                                key={`section-${idx}`}
                                onClick={() => setCurrentSectionIndex(idx)}
                                className={`group relative px-6 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300
          backdrop-blur-sm border-2 ${idx === currentSectionIndex
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-400 text-white shadow-2xl scale-105'
                                        : 'bg-white/70 border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:scale-102 hover:bg-indigo-50 text-gray-800'
                                    }`}
                            >
                                <span>📂 {sec.name}</span>
                                <span className="ml-3 font-mono text-sm opacity-80">({sec.marks}m)</span>

                                {idx !== 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // ✅ FIXED delete button
                                            if (sections.length > 1) {
                                                if (idx === currentSectionIndex) {
                                                    setCurrentSectionIndex(idx > 0 ? idx - 1 : 0);  // Move to PREV section first
                                                }
                                                setSections(sections.filter((_, i) => i !== idx));
                                            }

                                        }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-2xl font-bold 
              shadow-lg hover:bg-red-600 scale-0 group-hover:scale-100 transition-all duration-200 flex items-center justify-center"
                                        title="Delete section"
                                    >
                                        ×
                                    </button>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Section editor */}
                    <div className="flex gap-4 p-6 bg-white/60 rounded-2xl border-2 border-dashed border-indigo-300/50 
    backdrop-blur-sm hover:border-indigo-400 transition-all">
                        <input
                            type="text"
                            placeholder="Section name..."
                            value={currentSectionIndex === 0 && !currentSection.name ? "General" : currentSection.name}
                            onChange={(e) => {
                                const newName = e.target.value.trim() || "";
                                setSections(sections.map((s, i) =>
                                    i === currentSectionIndex
                                        ? { ...s, name: newName || (i === 0 ? "General" : "") }
                                        : s
                                ));
                            }}
                            className="flex-1 p-4 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-indigo-500/30 
        focus:border-indigo-400 bg-white/50 backdrop-blur-sm font-semibold text-lg"
                        // ✅ REMOVED disabled - ALL sections editable!
                        />

                        <input
                            type="number"
                            placeholder="Marks"
                            value={currentSection.marks}
                            onChange={(e) => setSections(sections.map((s, i) => i === currentSectionIndex ? { ...s, marks: Number(e.target.value) || 10 } : s))}
                            min="1" max="100"
                            className="w-28 p-4 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-indigo-500/30 
        focus:border-indigo-400 bg-white/50 font-bold text-lg"
                        />
                        <button
                            onClick={() => {
                                const newSection = { name: "New Section", marks: 10, questions: [] };
                                setSections([...sections, newSection]);
                                setCurrentSectionIndex(sections.length);
                            }}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black 
        rounded-2xl shadow-xl hover:from-emerald-600 hover:to-teal-700 hover:shadow-2xl 
        hover:scale-105 transition-all duration-300 whitespace-nowrap"
                        >
                            ➕ New Section
                        </button>
                    </div>
                </section>


                {/* Actions Bar */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-md mb-6 border border-gray-200">
                    <div className="flex gap-4">
                        {showDBSelector && (
                            <DatabaseQuestionSelector
                                onImportQuestions={(selectedQuestions) => {
                                    const normalizedQuestions = selectedQuestions.map(q => ({
                                        questionText: q.questionText || q.text || "",
                                        options: Array.isArray(q.options)
                                            ? q.options.map(opt => opt.text || opt || "")
                                            : [q.option1 || "", q.option2 || "", q.option3 || "", q.option4 || ""],
                                        correctIdx: q.correctIdx || q.correctOptionIndex || 0
                                    }));

                                    setSections(sections.map((sec, i) =>
                                        i === currentSectionIndex
                                            ? { ...sec, questions: [...sec.questions, ...normalizedQuestions] }
                                            : sec
                                    ));

                                    setCurrentQuestions(prev => [...prev, ...normalizedQuestions]);
                                    setShowDBSelector(false);
                                    setImportStatus(`✅ Imported ${selectedQuestions.length} questions from database!`);
                                    setTimeout(() => setImportStatus(""), 4000);
                                }}
                            />

                        )}
                        {/* <button
                            onClick={() => setShowDBSelector(true)}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-xl hover:from-orange-600 hover:to-red-600 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg"
                        >
                            🗄️ Select from Database
                        </button> */}
                        <FileUploader
                            onQuestionsImported={(importedQuestions) => {
                                // ✅ ADD TO CURRENT SECTION
                                const normalizedQuestions = importedQuestions.map(q => ({
                                    questionText: q.questionText || q.text || "",
                                    options: Array.isArray(q.options)
                                        ? q.options.map(opt => opt.text || opt || "")
                                        : [q.option1 || "", q.option2 || "", q.option3 || "", q.option4 || ""],
                                    correctIdx: q.correctIdx || q.correctOptionIndex || 0
                                }));

                                setSections(sections.map((sec, i) =>
                                    i === currentSectionIndex
                                        ? { ...sec, questions: [...sec.questions, ...normalizedQuestions] }
                                        : sec
                                ));

                                // 🔥 FIX: TRIGGER currentQuestions sync!
                                setCurrentQuestions(prev => [...prev, ...normalizedQuestions]);

                                setImportStatus(`${importedQuestions.length} questions → ${currentSection.name}`);
                                setShowImportModal(false);
                            }}
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
                        
                        Questions: {sections.reduce((sum, sec) => sum + sec.questions.length, 0)}
                    </span>
                </div>

                {!!importStatus && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg">
                        {importStatus}
                    </div>
                )}

                {/* Questions List */}
                {currentQuestions.map((q, idx) => (
                    <div key={`q-${idx}`} className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 
    shadow-xl hover:shadow-2xl rounded-3xl p-8 mb-8 transition-all duration-300 hover:-translate-y-2 
    hover:border-indigo-300/50 overflow-hidden">

                        {/* Enhanced delete button */}
                        <button
                            className="absolute -top-4 right-4 bg-gradient-to-r from-red-500 to-rose-600 text-white 
        w-12 h-12 rounded-3xl shadow-2xl font-bold text-xl hover:from-red-600 hover:to-rose-700 
        hover:scale-110 hover:shadow-3xl transition-all duration-200 flex items-center justify-center z-10"
                            onClick={() => deleteQuestion(idx)}
                            title="Delete question"
                        >
                            ×
                        </button>

                        {/* Question header */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-indigo-100">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex 
        items-center justify-center text-2xl font-bold text-white shadow-lg">
                                Q{idx + 1}
                            </div>
                            <h3 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                                Question {idx + 1}
                            </h3>
                        </div>

                        {/* Enhanced textarea */}
                        <textarea
                            className={`w-full p-6 rounded-2xl border-2 bg-gradient-to-b from-gray-50/50 to-white/50 
        text-gray-900 placeholder-gray-500 font-semibold text-xl min-h-[120px] resize-vertical
        backdrop-blur-sm transition-all duration-300 hover:border-indigo-300 focus:outline-none 
        focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 hover:shadow-lg
        ${errors[idx]?.questionText ? 'border-red-400 bg-red-50/50 focus:ring-red-500/30' : 'border-gray-200'}`}
                            placeholder="Write your question here... (Make it clear and specific)"
                            value={q.questionText}
                            onChange={(e) => handleQChange(idx, e.target.value)}
                        />

                        {/* Options with better spacing */}
                        <div className="mt-8 space-y-4">
                            {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 
          rounded-2xl border-2 border-transparent group-hover:border-indigo-200 hover:shadow-md transition-all">
                                    <input
                                        type="radio"
                                        checked={q.correctIdx === oi}
                                        onChange={() => setCorrect(idx, oi)}
                                        className="w-6 h-6 mt-1 accent-indigo-500 shadow-md hover:scale-110 transition-all"
                                        name={`opt-${idx}`}
                                    />
                                    <input
                                        type="text"
                                        className={`flex-1 p-4 rounded-xl border-2 bg-white/70 backdrop-blur-sm font-semibold text-lg 
              placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 
              transition-all duration-300 hover:border-indigo-300 hover:shadow-md
              ${errors[idx]?.options?.[oi] ? 'border-red-400 bg-red-50/70 focus:ring-red-500/30' : 'border-transparent'}`}
                                        placeholder={`Option ${oi + 1} (Make it clear and distinct)`}
                                        value={opt}
                                        onChange={(e) => handleOChange(idx, oi, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        {q.options.length < 4 && (
                            <button
                                className="mt-6 ml-16 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white 
          font-bold rounded-2xl shadow-lg hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl 
          hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                onClick={() => addOption(idx)}
                            >
                                ➕ Add Option
                            </button>
                        )}


                    </div>
                ))}


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
