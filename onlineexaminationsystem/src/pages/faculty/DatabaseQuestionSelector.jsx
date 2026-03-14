// Replace your entire DatabaseQuestionSelector.jsx with this FIXED version:

import React, { useState, useEffect } from "react";
import { FiCheck, FiPlus, FiSearch, FiX } from "react-icons/fi";

const DatabaseQuestionSelector = ({ onImportQuestions, onClose }) => {
    const [questions, setQuestions] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");

    // ✅ FIXED: Safe array handling
    const safeQuestions = Array.isArray(questions) ? questions : [];

    const fetchAllQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/questions", {
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                // ✅ FIXED: Handle both {data: [...]} and direct array
                setQuestions(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to load questions:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchAllQuestions();
    }, []);

    const toggleSelect = (questionId) => {
        setSelectedIds(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const importSelected = () => {
        if (selectedIds.length === 0) {
            alert("Select at least 1 question");
            return;
        }

        const selectedQuestions = safeQuestions.filter(q => selectedIds.includes(q.id));
        onImportQuestions(selectedQuestions);
        onClose();
    };

    // ✅ FIXED LINE 67:
    const filteredQuestions = safeQuestions.filter(q =>
        q.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!subjectFilter || q.subject === subjectFilter)
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FiSearch size={32} />
                            Select Questions from Database
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {filteredQuestions.length} shown | {selectedIds.length} selected | {safeQuestions.length} total
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-3xl hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="🔍 Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 p-4 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="p-4 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                            <option value="">All Subjects</option>
                            <option value="Math">Math</option>
                            <option value="Science">Science</option>
                            <option value="English">English</option>
                        </select>
                        <button
                            onClick={fetchAllQuestions}
                            disabled={loading}
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {/* Questions List */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">
                            Loading questions from database...
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            No questions match your search/filter
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredQuestions.map((question) => (
                                <div
                                    key={question.id}
                                    className={`p-6 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all cursor-pointer group ${selectedIds.includes(question.id)
                                            ? "border-green-400 bg-green-50 shadow-green-200 ring-2 ring-green-200"
                                            : "border-gray-200 hover:border-blue-300"
                                        }`}
                                    onClick={() => toggleSelect(question.id)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${selectedIds.includes(question.id)
                                                ? "bg-green-500 text-white shadow-green-300"
                                                : "bg-gray-200 group-hover:bg-blue-200 text-gray-600 shadow-sm"
                                            }`}>
                                            {selectedIds.includes(question.id) ? <FiCheck size={20} /> : "Q"}
                                        </div>
                                        <span className="text-sm font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                            {question.subject || "General"}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight text-gray-900">
                                        {question.questionText}
                                    </h3>

                                    <div className="space-y-2 mb-4">
                                        {(question.options || []).slice(0, 4).map((opt, idx) => (
                                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${idx === question.correctIdx
                                                    ? "bg-green-100 border-2 border-green-300 font-semibold shadow-sm"
                                                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                                }`}>
                                                <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="truncate flex-1">{(opt.text || opt) || "No text"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-4 justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 border border-gray-400 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={importSelected}
                        disabled={selectedIds.length === 0}
                        className="px-12 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        <FiPlus />
                        Import {selectedIds.length} Questions
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseQuestionSelector;
