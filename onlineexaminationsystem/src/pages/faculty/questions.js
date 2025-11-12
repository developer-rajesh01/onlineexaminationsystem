// import React, { useState, useEffect, useRef } from "react";
// import * as XLSX from "xlsx";
// import { FiUpload, FiTrash2 } from "react-icons/fi";


// function Questions() {
//   const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

//   const createNewQuestion = () => ({
//     id: Math.random().toString(36).substr(2, 9),
//     questionText: "",
//     options: ["", ""],
//     correctAnswerIndex: 0,
//   });

//   const [questions, setQuestions] = useState(() => {
//     const saved = localStorage.getItem("questions");
//     if (saved)
//       try {
//         return JSON.parse(saved);
//       } catch (e) {
//         /* ignore */
//       }
//     return [createNewQuestion()];
//   });

//   const [importStatus, setImportStatus] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isParsing, setIsParsing] = useState(false); // when parsing excel
//   const [errors, setErrors] = useState({});
//   const [uploadingFile, setUploadingFile] = useState(false); // non-excel upload indicator
//   const [lastSavedBatchId, setLastSavedBatchId] = useState(null);

//   // avoid accidental double-trigger when input fires twice
//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     localStorage.setItem("questions", JSON.stringify(questions));
//   }, [questions]);

//   /* ---------- Validation ---------- */
//   const validateQuestion = (q, qIndex, baseErrors = {}) => {
//     const newErrors = { ...baseErrors };
//     if (!q.questionText || !q.questionText.trim()) {
//       newErrors[qIndex] = {
//         ...newErrors[qIndex],
//         questionText: "Question text is required",
//       };
//     } else {
//       if (!newErrors[qIndex]) newErrors[qIndex] = {};
//       newErrors[qIndex].questionText = null;
//     }
//     if (q.options.slice(0, 2).some((opt) => !opt || !opt.trim())) {
//       newErrors[qIndex] = {
//         ...newErrors[qIndex],
//         options: "At least two options must be filled",
//       };
//     } else {
//       if (!newErrors[qIndex]) newErrors[qIndex] = {};
//       newErrors[qIndex].options = null;
//     }
//     return newErrors;
//   };

//   const validateAllQuestions = (qArr) => {
//     let isValid = true;
//     const newErrors = {};
//     qArr.forEach((q, qi) => {
//       const errs = validateQuestion(q, qi, newErrors);
//       if (errs[qi]?.questionText || errs[qi]?.options) isValid = false;
//     });
//     setErrors(newErrors);
//     return isValid;
//   };

//   /* ---------- handlers ---------- */
//   const handleQuestionChange = (qIndex, value) => {
//     const newQuestions = [...questions];
//     newQuestions[qIndex].questionText = value;
//     setQuestions(newQuestions);
//     setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
//   };

//   const handleOptionChange = (qIndex, oIndex, value) => {
//     const newQuestions = [...questions];
//     newQuestions[qIndex].options[oIndex] = value;
//     setQuestions(newQuestions);
//     setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
//   };

//   const setCorrectAnswer = (qIndex, oIndex) => {
//     const newQuestions = [...questions];
//     newQuestions[qIndex].correctAnswerIndex = oIndex;
//     setQuestions(newQuestions);
//   };

//   const addOption = (qIndex) => {
//     const newQuestions = [...questions];
//     if (newQuestions[qIndex].options.length < 4) {
//       newQuestions[qIndex].options.push("");
//       setQuestions(newQuestions);
//       setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
//     }
//   };

//   const removeOption = (qIndex, oIndex) => {
//     const newQuestions = [...questions];
//     if (newQuestions[qIndex].options.length > 2) {
//       newQuestions[qIndex].options.splice(oIndex, 1);
//       if (newQuestions[qIndex].correctAnswerIndex === oIndex) {
//         newQuestions[qIndex].correctAnswerIndex = 0;
//       } else if (newQuestions[qIndex].correctAnswerIndex > oIndex) {
//         newQuestions[qIndex].correctAnswerIndex--;
//       }
//       setQuestions(newQuestions);
//       setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
//     }
//   };

//   const addQuestion = () => setQuestions([...questions, createNewQuestion()]);

//   const deleteQuestion = (qIndex) => {
//     if (questions.length === 1) return;
//     const newQuestions = [...questions];
//     newQuestions.splice(qIndex, 1);
//     setQuestions(newQuestions);
//     const newErrors = { ...errors };
//     delete newErrors[qIndex];
//     setErrors(newErrors);
//   };

//   /* ---------- Submit (Save All Questions) ---------- */
//   // const handleSubmit = async () => {
//   //   if (isParsing) {
//   //     alert("Please wait until file parsing finishes before submitting.");
//   //     return;
//   //   }
//   //   if (!validateAllQuestions(questions)) {
//   //     alert("Please fix all errors before submitting");
//   //     return;
//   //   }

//   //   setIsSubmitting(true);
//   //   try {
//   //     // client batch id (server may override)
//   //     const clientBatchId = `batch-${Date.now()}-${Math.random()
//   //       .toString(36)
//   //       .slice(2, 8)}`;

//   //     // read uploader info/token from localStorage
//   //     const token = localStorage.getItem("token") || null;
//   //     const uploaderEmail = localStorage.getItem("userEmail") || null;
//   //     const uploaderName =
//   //       localStorage.getItem("userName") ||
//   //       localStorage.getItem("userFullName") ||
//   //       null;

//   //     const payload = {
//   //       batchId: clientBatchId,
//   //       uploaderEmail,
//   //       uploaderName,
//   //       questions,
//   //     };

//   //     const res = await fetch(`${API_BASE}/api/questions/bulk`, {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   //       },
//   //       body: JSON.stringify(payload),
//   //     });

//   //     const text = await res.text();
//   //     let body;
//   //     try {
//   //       body = JSON.parse(text);
//   //     } catch (e) {
//   //       body = text;
//   //     }

//   //     if (!res.ok) {
//   //       console.error("Submit failed:", res.status, body);
//   //       alert(`Submit failed: ${body?.message || body || res.status}`);
//   //       return;
//   //     }

//   //     const returnedBatchId = body?.batchId || clientBatchId;
//   //     setLastSavedBatchId(returnedBatchId);
//   //     alert(`Questions saved! Batch ID: ${returnedBatchId}`);

//   //     // reset UI
//   //     setQuestions([createNewQuestion()]);
//   //     setErrors({});
//   //     localStorage.removeItem("questions");
//   //   } catch (err) {
//   //     console.error("Network error:", err);
//   //     alert("Network error: " + err.message);
//   //   } finally {
//   //     setIsSubmitting(false);
//   //   }
//   // };

//   // inside your Questions component
//   const handleSubmit = async () => {
//     if (!validateAllQuestions(questions)) {
//       alert("Please fix all errors before submitting");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const clientBatchId = `batch-${Date.now()}-${Math.random()
//         .toString(36)
//         .slice(2, 8)}`;

//       // READ user info from localStorage (set these at login)
//       const uploaderEmail = localStorage.getItem("userEmail") || null;
//       const uploaderName =
//         localStorage.getItem("userName") ||
//         localStorage.getItem("userFullName") ||
//         null;

//       const payload = {
//         batchId: clientBatchId,
//         uploaderEmail,
//         uploaderName,
//         questions,
//       };

//       // include token if you store it at login in localStorage
//       const token = localStorage.getItem("token") || null;

//       const res = await fetch(`${API_BASE}/api/questions/bulk`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: JSON.stringify(payload),
//       });

//       const text = await res.text();
//       let body;
//       try {
//         body = JSON.parse(text);
//       } catch (e) {
//         body = text;
//       }

//       if (!res.ok) {
//         console.error("Submit failed:", res.status, body);
//         alert(`Submit failed: ${body?.message || body || res.status}`);
//         return;
//       }

//       const returnedBatchId = body?.batchId || clientBatchId;
//       setLastSavedBatchId(returnedBatchId);

//       alert(`Questions saved! Batch ID: ${returnedBatchId}`);
//       setQuestions([createNewQuestion()]);
//       setErrors({});
//       localStorage.removeItem("questions");
//     } catch (err) {
//       console.error("Network error:", err);
//       alert("Network error: " + err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   /* ---------- File handler (Excel parse OR file upload) ---------- */
//   const handleFile = async (e) => {
//     const file = e.target.files?.[0];
//     // clear input so same file can be selected later if needed
//     if (fileInputRef.current) fileInputRef.current.value = "";

//     if (!file) return;
//     const name = file.name || "";
//     const lc = name.toLowerCase();
//     const isExcel =
//       file.type ===
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
//       file.type === "application/vnd.ms-excel" ||
//       lc.endsWith(".xlsx") ||
//       lc.endsWith(".xls") ||
//       lc.endsWith(".csv");

//     if (isExcel) {
//       setIsParsing(true);
//       setImportStatus("Parsing Excel file...");
//       try {
//         const arrayBuffer = await file.arrayBuffer();
//         const workbook = XLSX.read(arrayBuffer, { type: "array" });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

//         // Map expected columns: Question, Option1..4, CorrectAnswer
//         const importedQuestions = rawJson.map((row) => {
//           const qText = row.Question ? String(row.Question).trim() : "";
//           const optsRaw = [
//             row.Option1 ?? "",
//             row.Option2 ?? "",
//             row.Option3 ?? "",
//             row.Option4 ?? "",
//           ].map((o) => (o === undefined || o === null ? "" : String(o).trim()));
//           const optsFiltered = optsRaw.filter((o) => o !== "");
//           while (optsFiltered.length < 2) optsFiltered.push("");

//           let correctIndex = 0;
//           const ca = row.CorrectAnswer;
//           if (ca !== undefined && ca !== null && String(ca).trim() !== "") {
//             const caStr = String(ca).trim();
//             const asNum = Number(caStr);
//             if (!Number.isNaN(asNum)) {
//               if (asNum >= 1 && asNum <= optsFiltered.length)
//                 correctIndex = asNum - 1;
//               else if (asNum >= 0 && asNum < optsFiltered.length)
//                 correctIndex = asNum;
//             } else {
//               const found = optsFiltered.findIndex(
//                 (o) => o.toLowerCase() === caStr.toLowerCase()
//               );
//               if (found !== -1) correctIndex = found;
//             }
//           }

//           return {
//             id: Math.random().toString(36).substr(2, 9),
//             questionText: qText,
//             options: optsFiltered,
//             correctAnswerIndex: correctIndex,
//           };
//         });

//         const importArr =
//           importedQuestions.length > 0
//             ? importedQuestions
//             : [createNewQuestion()];
//         setQuestions(importArr);
//         setImportStatus(
//           `Imported ${importedQuestions.length} questions. Review then click "Save All Questions".`
//         );
//         validateAllQuestions(importArr);
//       } catch (err) {
//         console.error("Excel parse error:", err);
//         setImportStatus(
//           "Failed to parse Excel file. Check headers: Question, Option1..4, CorrectAnswer"
//         );
//       } finally {
//         setIsParsing(false);
//         setTimeout(() => setImportStatus(null), 3500);
//       }
//       return;
//     }

//     // Non-excel file -> upload to backend
//     setUploadingFile(true);
//     setImportStatus(`Uploading file "${file.name}"...`);
//     try {
//       const form = new FormData();
//       form.append("file", file);

//       const token = localStorage.getItem("token") || null;
//       const res = await fetch(`${API_BASE}/api/uploads`, {
//         method: "POST",
//         headers: {
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: form,
//       });

//       const text = await res.text();
//       let body;
//       try {
//         body = JSON.parse(text);
//       } catch (e) {
//         body = text;
//       }

//       if (!res.ok) {
//         console.error("Upload failed:", res.status, body);
//         setImportStatus(
//           `Upload failed: ${body?.message || body || res.status}`
//         );
//       } else {
//         const fileInfo = body?.data || body;
//         setImportStatus(
//           `Uploaded file successfully: ${fileInfo.filename || file.name}`
//         );
//         console.log("Uploaded file info:", fileInfo);
//       }
//     } catch (err) {
//       console.error("Upload error:", err);
//       setImportStatus("Network error while uploading file: " + err.message);
//     } finally {
//       setUploadingFile(false);
//       setTimeout(() => setImportStatus(null), 4000);
//     }
//   };

//   const clearAll = () => {
//     setQuestions([createNewQuestion()]);
//     setErrors({});
//     setImportStatus(null);
//     localStorage.removeItem("questions");
//   };

//   const isSubmitDisabled =
//     questions.some(
//       (q, qi) => errors[qi]?.questionText || errors[qi]?.options
//     ) ||
//     isParsing ||
//     uploadingFile;

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
//       {/* Import and Clear Section */}
//       <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-700 p-4 rounded-lg shadow-lg">
//         <div className="flex items-center space-x-4">
//           <label
//             htmlFor="fileUpload"
//             className="group cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 bg-teal-400 text-white hover:bg-teal-500"
//           >
//             <FiUpload
//               size={18}
//               className="group-hover:scale-110 transition-transform"
//             />
//             Import Questions / Upload File
//           </label>
//           <input
//             id="fileUpload"
//             ref={fileInputRef}
//             type="file"
//             accept=".xlsx,.xls,.csv,.pdf,.txt,image/*,application/*"
//             onChange={handleFile}
//             className="hidden"
//           />
//           <button
//             type="button"
//             onClick={clearAll}
//             className="group flex items-center gap-2 rounded-md px-4 py-2 bg-red-400 text-white hover:bg-red-500"
//           >
//             <FiTrash2 size={18} />
//             Clear All
//           </button>
//         </div>
//         <div className="text-gray-100 font-semibold">
//           {uploadingFile
//             ? "Uploading file..."
//             : isParsing
//             ? "Parsing file..."
//             : `Total Questions: ${questions.length}`}
//         </div>
//       </div>

//       {/* Import Feedback */}
//       {importStatus && (
//         <div
//           className="bg-teal-100 text-teal-800 p-3 rounded-lg shadow-md"
//           role="status"
//         >
//           {importStatus}
//         </div>
//       )}

//       {lastSavedBatchId && (
//         <div className="mt-2 text-sm text-gray-700">
//           Last saved batch ID:{" "}
//           <span className="font-mono text-indigo-700">{lastSavedBatchId}</span>
//         </div>
//       )}

//       {/* Question Cards */}
//       {questions.map((q, qi) => (
//         <div
//           key={q.id || qi}
//           className="relative bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-400 transition-all duration-300"
//         >
//           {questions.length > 1 && (
//             <button
//               onClick={() => deleteQuestion(qi)}
//               className="absolute top-3 right-3 bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center"
//             >
//               &times;
//             </button>
//           )}
//           <div className="space-y-2">
//             <label
//               htmlFor={`question-${qi}`}
//               className="block text-gray-700 font-semibold"
//             >
//               Question
//             </label>
//             <textarea
//               id={`question-${qi}`}
//               className={`w-full p-3 border rounded-lg bg-white text-gray-900 resize-none ${
//                 errors[qi]?.questionText ? "border-red-400" : "border-blue-300"
//               }`}
//               value={q.questionText}
//               onChange={(e) => handleQuestionChange(qi, e.target.value)}
//               rows={3}
//               placeholder="Enter question"
//             />
//             {errors[qi]?.questionText && (
//               <p className="text-red-400 text-sm">{errors[qi].questionText}</p>
//             )}
//           </div>

//           <div className="space-y-4 mt-4">
//             {q.options.map((opt, oi) => (
//               <div key={oi} className="flex items-center space-x-3">
//                 <input
//                   type="radio"
//                   name={`correct-${qi}`}
//                   checked={q.correctAnswerIndex === oi}
//                   onChange={() => setCorrectAnswer(qi, oi)}
//                   className="w-5 h-5"
//                 />
//                 <input
//                   type="text"
//                   placeholder={`Option ${oi + 1}`}
//                   value={opt}
//                   onChange={(e) => handleOptionChange(qi, oi, e.target.value)}
//                   className={`flex-grow px-3 py-2 border rounded-lg ${
//                     oi < 2 && !opt.trim() ? "border-red-400" : "border-blue-300"
//                   }`}
//                 />
//                 {oi > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeOption(qi, oi)}
//                     className="text-red-400"
//                   >
//                     <FiTrash2 />
//                   </button>
//                 )}
//               </div>
//             ))}
//             {errors[qi]?.options && (
//               <p className="text-red-400 text-sm">{errors[qi].options}</p>
//             )}
//             {q.options.length < 4 && (
//               <button
//                 type="button"
//                 onClick={() => addOption(qi)}
//                 className="text-teal-500"
//               >
//                 + Add Option
//               </button>
//             )}
//           </div>
//         </div>
//       ))}

//       {/* Actions */}
//       <div className="flex space-x-4 justify-end">
//         <button
//           type="button"
//           onClick={addQuestion}
//           className="bg-teal-400 text-white px-6 py-3 rounded-lg"
//         >
//           + Add Question
//         </button>
//         <button
//           type="button"
//           onClick={handleSubmit}
//           disabled={isSubmitting || isSubmitDisabled}
//           className={`px-6 py-3 rounded-lg text-white ${
//             isSubmitting || isSubmitDisabled
//               ? "bg-indigo-400 opacity-60 cursor-not-allowed"
//               : "bg-indigo-600"
//           }`}
//         >
//           {isSubmitting ? "Saving..." : "Save All Questions"}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default Questions;




import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { FiUpload, FiTrash2 } from "react-icons/fi";

import { jwtDecode } from "jwt-decode";


function Questions() {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const createNewQuestion = () => ({
    id: Math.random().toString(36).substr(2, 9),
    questionText: "",
    options: ["", ""],
    correctAnswerIndex: 0,
  });

  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem("questions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* ignore corrupted localStorage */
      }
    }
    return [createNewQuestion()];
  });

  const [importStatus, setImportStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [lastSavedBatchId, setLastSavedBatchId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("questions", JSON.stringify(questions));
  }, [questions]);





  /* ---------- Validation ---------- */
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

  /* ---------- handlers ---------- */
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
      setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
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
      setErrors(validateQuestion(newQuestions[qIndex], qIndex, errors));
    }
  };

  const addQuestion = () => setQuestions([...questions, createNewQuestion()]);

  const deleteQuestion = (qIndex) => {
    if (questions.length === 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(qIndex, 1);
    setQuestions(newQuestions);
    const newErrors = { ...errors };
    delete newErrors[qIndex];
    setErrors(newErrors);
  };

// inside Questions component
// const isTokenExpired = () => {
//   const token = localStorage.getItem("token");
//   if (!token) return true;
//   try {
//     const decoded = jwtDecode(token);
//     const currentTime = Date.now() / 1000;
//     return decoded.exp < currentTime;
//   } catch (err) {
//     console.error("Token decode failed:", err);
//     return true;
//   }
// };


const isTokenExpired = () => {
  const token = localStorage.getItem("token");
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (err) {
    console.error("Token decode failed:", err);
    return true;
  }
};



  /* ---------- Submit (one batchId + uploader info) ---------- */
  const handleSubmit = async () => {
    if (!validateAllQuestions(questions)) {
      alert("Please fix all errors before submitting");
      return;
    }

    if (isTokenExpired()) {
      alert("Your session has expired. Please log in again.");
      localStorage.clear();
      window.location.href = "/login";
      return;
    }


    setIsSubmitting(true);
    try {
      // single batch id for this submit
      const clientBatchId = `batch-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      // READ uploader info (must be stored at login)
      const uploaderEmail = localStorage.getItem("userEmail") || null;
      const uploaderName = localStorage.getItem("userName") || null;

      // ensure questions' options are arrays (defensive)
      const normalizedQuestions = questions.map((q) => ({
        questionText: q.questionText || "",
        options: Array.isArray(q.options)
          ? q.options
          : [String(q.options || "")],
        correctAnswerIndex:
          typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
        // keep client id (optional)
        id: q.id,
      }));

      const payload = {
        batchId: clientBatchId,
        uploaderEmail,
        uploaderName,
        questions: normalizedQuestions,
      };

      // Include JWT if you saved it at login (so server can set req.user)
      const token = localStorage.getItem("token") || null;

      const res = await fetch(`${API_BASE}/api/questions/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = text;
      }

      if (!res.ok) {
        console.error("Submit failed:", res.status, body);
        alert(`Submit failed: ${body?.message || body || res.status}`);
        return;
      }

      // success — store returned batch id (server may override)
      const returnedBatchId = body?.batchId || clientBatchId;
      setLastSavedBatchId(returnedBatchId);

      alert(`Questions saved! Batch ID: ${returnedBatchId}`);
      setQuestions([createNewQuestion()]);
      setErrors({});
      localStorage.removeItem("questions");
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- handleFile (Excel parse OR file upload) ---------- */
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    // reset input so same file can be selected repeatedly
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file) return;
    const name = file.name || "";
    const lc = name.toLowerCase();
    const isExcel =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      lc.endsWith(".xlsx") ||
      lc.endsWith(".xls") ||
      lc.endsWith(".csv");

    if (isExcel) {
      setIsParsing(true);
      setImportStatus("Parsing Excel file...");
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const importedQuestions = rawJson.map((row) => {
          const qText = row.Question ? String(row.Question).trim() : "";
          const optsRaw = [
            row.Option1 ?? "",
            row.Option2 ?? "",
            row.Option3 ?? "",
            row.Option4 ?? "",
          ].map((o) => (o === undefined || o === null ? "" : String(o).trim()));
          const optsFiltered = optsRaw.filter((o) => o !== "");
          while (optsFiltered.length < 2) optsFiltered.push("");

          let correctIndex = 0;
          const ca = row.CorrectAnswer;
          if (ca !== undefined && ca !== null && String(ca).trim() !== "") {
            const caStr = String(ca).trim();
            const asNum = Number(caStr);
            if (!Number.isNaN(asNum)) {
              if (asNum >= 1 && asNum <= optsFiltered.length)
                correctIndex = asNum - 1;
              else if (asNum >= 0 && asNum < optsFiltered.length)
                correctIndex = asNum;
            } else {
              const found = optsFiltered.findIndex(
                (o) => o.toLowerCase() === caStr.toLowerCase()
              );
              if (found !== -1) correctIndex = found;
            }
          }

          return {
            id: Math.random().toString(36).substr(2, 9),
            questionText: qText,
            options: optsFiltered,
            correctAnswerIndex: correctIndex,
          };
        });

        const importArr =
          importedQuestions.length > 0
            ? importedQuestions
            : [createNewQuestion()];
        setQuestions(importArr);
        setImportStatus(
          `Imported ${importedQuestions.length} questions. Review then click "Save All Questions".`
        );
        validateAllQuestions(importArr);
      } catch (err) {
        console.error("Excel parse error:", err);
        setImportStatus(
          "Failed to parse Excel file. Check headers: Question, Option1..4, CorrectAnswer"
        );
      } finally {
        setIsParsing(false);
        setTimeout(() => setImportStatus(null), 3500);
      }
      return;
    }

    // Non-excel file -> upload to backend (files like pdf/txt/images)
    setUploadingFile(true);
    setImportStatus(`Uploading file "${file.name}"...`);
    try {
      const form = new FormData();
      form.append("file", file);

      const token = localStorage.getItem("token") || null;
      const res = await fetch(`${API_BASE}/api/uploads`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = text;
      }

      if (!res.ok) {
        console.error("Upload failed:", res.status, body);
        setImportStatus(
          `Upload failed: ${body?.message || body || res.status}`
        );
      } else {
        const fileInfo = body?.data || body;
        setImportStatus(
          `Uploaded file successfully: ${fileInfo.filename || file.name}`
        );
        console.log("Uploaded file info:", fileInfo);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setImportStatus("Network error while uploading file: " + err.message);
    } finally {
      setUploadingFile(false);
      setTimeout(() => setImportStatus(null), 3500);
    }
  };

  const clearAll = () => {
    setQuestions([createNewQuestion()]);
    setErrors({});
    setImportStatus(null);
    localStorage.removeItem("questions");
  };

  const isSubmitDisabled =
    questions.some(
      (q, qi) => errors[qi]?.questionText || errors[qi]?.options
    ) ||
    isParsing ||
    uploadingFile;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Import and Clear Section */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-700 p-4 rounded-lg shadow-lg">
        <div className="flex items-center space-x-4">
          <label
            htmlFor="fileUpload"
            className="group cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 bg-teal-400 text-white hover:bg-teal-500"
          >
            <FiUpload
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            Import Questions / Upload File
          </label>
          <input
            id="fileUpload"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.txt,image/*,application/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={clearAll}
            className="group flex items-center gap-2 rounded-md px-4 py-2 bg-red-400 text-white hover:bg-red-500"
          >
            <FiTrash2 size={18} />
            Clear All
          </button>
        </div>
        <div className="text-gray-100 font-semibold">
          {uploadingFile
            ? "Uploading file..."
            : isParsing
            ? "Parsing file..."
            : `Total Questions: ${questions.length}`}
        </div>
      </div>

      {/* Import Feedback */}
      {importStatus && (
        <div
          className="bg-teal-100 text-teal-800 p-3 rounded-lg shadow-md"
          role="status"
        >
          {importStatus}
        </div>
      )}

      {lastSavedBatchId && (
        <div className="mt-2 text-sm text-gray-700">
          Last saved batch ID:{" "}
          <span className="font-mono text-indigo-700">{lastSavedBatchId}</span>
        </div>
      )}

      {/* Question Cards */}
      {questions.map((q, qi) => (
        <div
          key={q.id || qi}
          className="relative bg-blue-50 p-6 rounded-xl shadow-lg border border-blue-400 transition-all duration-300"
        >
          {questions.length > 1 && (
            <button
              onClick={() => deleteQuestion(qi)}
              className="absolute top-3 right-3 bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          )}
          <div className="space-y-2">
            <label
              htmlFor={`question-${qi}`}
              className="block text-gray-700 font-semibold"
            >
              Question
            </label>
            <textarea
              id={`question-${qi}`}
              className={`w-full p-3 border rounded-lg bg-white text-gray-900 resize-none ${
                errors[qi]?.questionText ? "border-red-400" : "border-blue-300"
              }`}
              value={q.questionText}
              onChange={(e) => handleQuestionChange(qi, e.target.value)}
              rows={3}
              placeholder="Enter question"
            />
            {errors[qi]?.questionText && (
              <p className="text-red-400 text-sm">{errors[qi].questionText}</p>
            )}
          </div>

          <div className="space-y-4 mt-4">
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
                  className={`flex-grow px-3 py-2 border rounded-lg ${
                    oi < 2 && !opt.trim() ? "border-red-400" : "border-blue-300"
                  }`}
                />
                {oi > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(qi, oi)}
                    className="text-red-400"
                  >
                    <FiTrash2 />
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
                className="text-teal-500"
              >
                + Add Option
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex space-x-4 justify-end">
        <button
          type="button"
          onClick={addQuestion}
          className="bg-teal-400 text-white px-6 py-3 rounded-lg"
        >
          + Add Question
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isSubmitDisabled}
          className={`px-6 py-3 rounded-lg text-white ${
            isSubmitting || isSubmitDisabled
              ? "bg-indigo-400 opacity-60 cursor-not-allowed"
              : "bg-indigo-600"
          }`}
        >
          {isSubmitting ? "Saving..." : "Save All Questions"}
        </button>
      </div>
    </div>
  );
}

export default Questions;
