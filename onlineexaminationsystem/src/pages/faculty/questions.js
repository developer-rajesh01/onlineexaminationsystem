import React, { useState, useEffect } from "react";
import { FiUpload, FiTrash2, FiCheckCircle, FiAlertCircle, FiInfo, FiBook, FiUser } from "react-icons/fi";
import FileUploader from "../../component/FileUploader";

function Questions() {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // ✅ NEW: Subject and Teacher states
  const [subjectName, setSubjectName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherName, setTeacherName] = useState("");

  // Read from localStorage (set by login)
  const [nameFromStorage] = useState(localStorage.getItem("name") || "");
  const [emailFromStorage] = useState(localStorage.getItem("email") || "");
  // Function to create an empty new question template
  const createNewQuestion = () => ({
    id: Math.random().toString(36).substr(2, 9),
    questionText: "",
    options: ["", ""],
    correctIdx: 0,
  });

  // Questions state with localStorage initialization
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem("questions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.questions || [createNewQuestion()];
      } catch {
        return [createNewQuestion()];
      }
    }
    return [createNewQuestion()];
  });

  const [importStatus, setImportStatus] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [subjectErrors, setSubjectErrors] = useState({});

  // Persist questions AND metadata in localStorage
  useEffect(() => {
    const dataToSave = {
      questions,
      subjectName,
    };
    localStorage.setItem("questions", JSON.stringify(dataToSave));
  }, [questions, subjectName]);


  // Load saved metadata on mount
  useEffect(() => {
    if (nameFromStorage) setTeacherName(nameFromStorage);
    if (emailFromStorage) setTeacherEmail(emailFromStorage);

    const saved = localStorage.getItem("questions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSubjectName(parsed.subjectName || "");
        setQuestions(parsed.questions || [createNewQuestion()]);
      } catch (e) {
        console.error("Error parsing saved data:", e);
      }
    }
  }, []);

  const validateMetadata = () => {
    const newErrors = {};
    if (!subjectName.trim()) {
      newErrors.subjectName = "Subject name is required";
    }
    setSubjectErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate a single question fields
  const validateQuestion = (q, qIndex, baseErrors = {}) => {
    const newErrors = { ...baseErrors };
    if (!q.questionText || !q.questionText.trim()) {
      newErrors[qIndex] = {
        ...newErrors[qIndex],
        questionText: "Question text is required",
      };
    } else {
      if (!newErrors[qIndex]) newErrors[qIndex] = {};
      newErrors[qIndex].questionText = null;
    }

    if (q.options.slice(0, 2).some((opt) => !opt || !opt.trim())) {
      newErrors[qIndex] = {
        ...newErrors[qIndex],
        options: "At least two options must be filled",
      };
    } else {
      if (!newErrors[qIndex]) newErrors[qIndex] = {};
      newErrors[qIndex].options = null;
    }

    return newErrors;
  };

  // Validate all questions
  const validateAllQuestions = (qArr) => {
    let isValid = true;
    const newErrors = {};
    qArr.forEach((q, qi) => {
      const errs = validateQuestion(q, qi, newErrors);
      if (errs[qi]?.questionText || errs[qi]?.options) isValid = false;
    });
    setErrors(newErrors);
    return isValid;
  };

  // Handler functions
  const handleQuestionChange = (qIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].questionText = value;
    setQuestions(newQuestions);
    setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
    setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
  };

  const setCorrect = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctIdx = oIndex;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length < 4) {
      newQuestions[qIndex].options.push("");
      setQuestions(newQuestions);
      setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
    }
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options.length > 2) {
      newQuestions[qIndex].options.splice(oIndex, 1);
      if (newQuestions[qIndex].correctIdx === oIndex) {
        newQuestions[qIndex].correctIdx = 0;
      } else if (newQuestions[qIndex].correctIdx > oIndex) {
        newQuestions[qIndex].correctIdx--;
      }
      setQuestions(newQuestions);
      setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, createNewQuestion()]);
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

  const clearAll = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    setQuestions([createNewQuestion()]);
    setSubjectName("");
    setTeacherEmail("");
    setTeacherName("");
    setErrors({});
    setSubjectErrors({});
    setImportStatus(null);
    setSubmitStatus(null);
    localStorage.removeItem("questions");
    setShowClearConfirm(false);
  };

  // ✅ ENHANCED: Submit with subject & teacher metadata
  const handleSubmit = async () => {
    if (!validateMetadata()) {
      setSubmitStatus({
        type: "error",
        message: "Please enter subject name before submitting",
      });
      return;
    }

    if (!validateAllQuestions(questions)) {
      setSubmitStatus({
        type: "error",
        message: "Please fix all errors before submitting"
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const url = `${API_BASE}/api/questions/bulk`;
      const payload = {
        questions,
        subjectName: subjectName.trim(),
        teacherEmail: teacherEmail.trim(), // from localStorage
        teacherName: teacherName.trim(),
        institute: localStorage.getItem("institute") || null,
        branch: localStorage.getItem("branch") || null,
        timestamp: new Date().toISOString(),
      };


      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let body = null;
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = text;
      }

      if (!res.ok) {
        const message = body?.message || body || "Submit failed";
        setSubmitStatus({
          type: "error",
          message: body?.errors ? body.errors.join('\n') : message
        });
        return;
      }

      setSubmitStatus({
        type: "success",
        message: `✅ Saved ${questions.length} questions for "${subjectName}" by ${teacherName || teacherEmail}! 🎉`
      });

      setQuestions([createNewQuestion()]);
      setErrors({});
      setSubjectErrors({});
      localStorage.removeItem("questions");

      setTimeout(() => setSubmitStatus(null), 5000);

    } catch (err) {
      setSubmitStatus({
        type: "error",
        message: `Network error: ${err.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    !subjectName.trim() ||
    questions.some((q, qi) => errors[qi]?.questionText || errors[qi]?.options);

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">

        {/* Subject only (no teacher inputs) */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 rounded-2xl shadow-2xl text-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FiBook size={28} /> Subject & Teacher
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Subject Name *</label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g., Mathematics, Physics, History"
                className={`w-full p-4 rounded-xl bg-white/20 backdrop-blur-sm border-2 text-white placeholder-white/70 focus:ring-4 focus:ring-white/50 focus:border-white/50 transition-all duration-300 ${subjectErrors.subjectName
                    ? "border-red-400 bg-red-500/20"
                    : "border-white/30 hover:border-white/50"
                  }`}
              />
              {subjectErrors.subjectName && (
                <p className="text-red-200 text-sm mt-1 flex items-center gap-1">
                  <FiAlertCircle size={14} /> {subjectErrors.subjectName}
                </p>
              )}
            </div>

            <div className="text-sm text-white/80">
              Logged in as:{" "}
              <span className="font-bold">
                {teacherName || teacherEmail} ({teacherEmail})
              </span>
            </div>
          </div>
        </div>


        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-indigo-700 p-6 rounded-xl shadow-2xl text-white">
          <div className="flex items-center space-x-4 flex-1">
            <FileUploader
              onQuestionsImported={(importedQuestions) => {
                setQuestions(importedQuestions.map(q => ({
                  ...q,
                  id: Math.random().toString(36).substr(2, 9)
                })));
                setImportStatus(`✅ Imported ${importedQuestions.length} questions! 🎉`);
                setTimeout(() => setImportStatus(null), 4000);
              }}
            />
            <button
              type="button"
              onClick={clearAll}
              className="group flex items-center gap-2 rounded-lg px-6 py-3 bg-red-500/90 backdrop-blur-sm text-white hover:bg-red-600 hover:shadow-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              <FiTrash2 size={20} className="group-hover:scale-110 transition-transform" />
              Clear All
            </button>
          </div>
          <div className="text-lg font-bold bg-white/20 px-4 py-2 rounded-lg">
            📊 Total: {questions.length} Questions
          </div>
        </div>

        {/* Status Messages */}
        {(importStatus || submitStatus) && (
          <div className="space-y-2">
            {importStatus && <StatusMessage message={importStatus} type="info" />}
            {submitStatus && (
              <StatusMessage
                message={submitStatus.message}
                type={submitStatus.type}
                icon={submitStatus.type === "success" ? FiCheckCircle : FiAlertCircle}
              />
            )}
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <QuestionCard
              key={q.id || qi}
              question={q}
              index={qi}
              errors={errors[qi]}
              onQuestionChange={handleQuestionChange}
              onOptionChange={handleOptionChange}
              onCorrectAnswerChange={setCorrect}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onDelete={deleteQuestion}
              canDelete={questions.length > 1}
            />
          ))}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30">
          <button
            type="button"
            onClick={addQuestion}
            className="flex-1 sm:flex-none bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-teal-600 hover:to-teal-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"
          >
            ➕ Add New Question
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isSubmitDisabled}
            className={`flex items-center justify-center gap-3 px-12 py-4 rounded-xl text-lg font-bold shadow-2xl transition-all duration-300 transform ${isSubmitting || isSubmitDisabled
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-3xl hover:scale-105 text-white"
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "💾 Save All Questions"
            )}
          </button>
        </div>
      </div>

      {/* Custom Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="text-center mb-8">
              <FiAlertCircle size={56} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Clear All Questions?</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                This action cannot be undone. All unsaved questions will be permanently lost.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ✅ QuestionCard Component (Complete)
const QuestionCard = ({
  question,
  index,
  errors,
  onQuestionChange,
  onOptionChange,
  onCorrectAnswerChange,
  onAddOption,
  onRemoveOption,
  onDelete,
  canDelete
}) => (
  <div className="group bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-blue-200 hover:shadow-2xl hover:border-blue-300 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    {canDelete && (
      <button
        onClick={() => onDelete(index)}
        className="absolute top-4 right-4 z-10 bg-red-500/90 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all duration-200 backdrop-blur-sm"
        title="Delete question"
      >
        ×
      </button>
    )}

    <div className="relative z-10 space-y-3 mb-6">
      <label className="block text-xl font-bold text-gray-800 mb-2">
        Q{index + 1}
      </label>
      <textarea
        className={`w-full p-4 border-2 rounded-xl bg-white/50 backdrop-blur-sm text-lg placeholder-gray-500 focus:ring-4 focus:ring-blue-200 focus:border-blue-400 hover:shadow-lg transition-all duration-300 resize-vertical min-h-[100px] ${errors?.questionText
            ? "border-red-400 bg-red-50/50"
            : "border-blue-200 hover:border-blue-300"
          }`}
        value={question.questionText}
        onChange={(e) => onQuestionChange(index, e.target.value)}
        placeholder="Enter your question here..."
        aria-invalid={!!errors?.questionText}
      />
      {errors?.questionText && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 px-3 py-2 rounded-lg">
          <FiAlertCircle size={16} />
          {errors.questionText}
        </div>
      )}
    </div>

    <div className="relative z-10 space-y-3">
      <label className="block text-lg font-semibold text-gray-800 mb-3">
        Options
      </label>
      {question.options.map((opt, oi) => (
        <div key={oi} className="flex items-start space-x-3 p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-all duration-200">
          <input
            type="radio"
            name={`correct-${index}`}
            checked={question.correctIdx === oi}
            onChange={() => onCorrectAnswerChange(index, oi)}
            className="w-6 h-6 mt-0.5 text-teal-500 focus:ring-teal-500 mt-1 flex-shrink-0"
          />
          <input
            type="text"
            placeholder={`Option ${oi + 1}`}
            value={opt}
            onChange={(e) => onOptionChange(index, oi, e.target.value)}
            className={`flex-grow px-4 py-3 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${oi < 2 && !opt.trim()
                ? "border-red-400 bg-red-50/50"
                : "border-gray-200 hover:border-blue-300"
              }`}
          />
          {oi > 1 && (
            <button
              type="button"
              onClick={() => onRemoveOption(index, oi)}
              className="text-red-500 hover:text-red-600 p-2 -m-2 hover:bg-red-100 rounded-lg transition-all duration-200"
              title="Remove option"
            >
              <FiTrash2 size={18} />
            </button>
          )}
        </div>
      ))}

      {errors?.options && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-100 px-3 py-2 rounded-lg">
          <FiAlertCircle size={16} />
          {errors.options}
        </div>
      )}

      {question.options.length < 4 && (
        <button
          type="button"
          onClick={() => onAddOption(index)}
          className="text-teal-600 hover:text-teal-700 font-semibold text-lg hover:underline flex items-center gap-2 pt-2"
        >
          ➕ Add Option
        </button>
      )}
    </div>
  </div>
);

// ✅ StatusMessage Component (Complete)
const StatusMessage = ({ message, type = "info", icon: Icon }) => (
  <div className={`p-4 rounded-xl shadow-lg transform transition-all duration-300 ${type === "success"
      ? "bg-green-100 border-2 border-green-400 text-green-800"
      : type === "error"
        ? "bg-red-100 border-2 border-red-400 text-red-800 animate-pulse"
        : "bg-blue-100 border-2 border-blue-400 text-blue-800"
    }`}>
    <div className="flex items-center gap-3">
      {Icon ? <Icon size={20} /> : <FiInfo size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  </div>
);

export default Questions;
