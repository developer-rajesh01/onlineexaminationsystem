import React from "react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const FileUploader = ({
    onQuestionsImported,
    acceptedFormats = ".xlsx,.xls,.pdf,.doc,.docx,.txt",
    className = "",
    buttonText = "Import Questions"
}) => {
    const [status, setStatus] = React.useState(null);

    const parseExcel = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet);

                    const questions = json.map((row) => {
                        const qText = String(row.Question || row.q || row[0] || "").trim();

                        const options = [
                            String(row.Option1 || row.A || row.a || row[1] || "").trim(),
                            String(row.Option2 || row.B || row.b || row[2] || "").trim(),
                            String(row.Option3 || row.C || row.c || row[3] || "").trim(),
                            String(row.Option4 || row.D || row.d || row[4] || "").trim(),
                        ].filter((o) => o.length > 1);

                        // 🔥 FIXED: Better Excel answer parsing
                        let correctIndex = 0;
                        const correctRaw = String(
                            row.CorrectAnswer ||
                            row.Answer ||
                            row.Correct ||
                            row.correct ||
                            row[5] ||
                            row[6] ||
                            ""
                        ).trim().toUpperCase();

                        // Number (1,2,3,4)
                        const numMatch = correctRaw.match(/^\s*(\d+)\s*$/);
                        if (numMatch) {
                            correctIndex = Math.max(0, Math.min(3, parseInt(numMatch[1]) - 1));
                        }
                        // Letter (A,B,C,D)
                        else if (correctRaw.match(/^[ABCD]/)) {
                            correctIndex = "ABCD".indexOf(correctRaw.charAt(0));
                        }
                        // Extra fallback patterns
                        else if (correctRaw.includes("B")) correctIndex = 1;
                        else if (correctRaw.includes("C")) correctIndex = 2;
                        else if (correctRaw.includes("D")) correctIndex = 3;

                        console.log(`Excel row: "${correctRaw}" → correctIndex: ${correctIndex}`); // DEBUG

                        return {
                            questionText: qText,
                            options: options.length >= 2 ? options.slice(0, 4) : ["", "", "", ""],
                            correctIdx: correctIndex, // ✅ SENDS correct index
                        };
                    }).filter((q) => q.questionText.length > 5);

                    resolve(questions);
                } catch {
                    resolve([]);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };


    const parsePDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(" ") + "\n";
        }
        return parseTextToQuestions(fullText);
    };

    const parseDocx = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return parseTextToQuestions(result.value);
    };

    const parseTextToQuestions = (text) => {
        if (!text) return [];
        text = text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
        const questionBlocks = text.split(/(?=Q\d+\.|\d+\.)/i);
        const questions = [];

        questionBlocks.forEach(block => {
            const questionMatch = block.match(/(Q\d+\.|\d+\.)\s*(.*?)(?=A\.|B\.|C\.|D\.)/i);
            if (!questionMatch) return;
            const questionText = questionMatch[2]?.trim();
            if (!questionText) return;

            const options = [];
            const optionRegex = /([A-D])\.\s*(.*?)(?=(A\.|B\.|C\.|D\.|Answer:|$))/gi;
            let match;
            while ((match = optionRegex.exec(block)) !== null) {
                options.push(match[2].trim());
            }
            if (options.length < 2) return;

            let correctIndex = 0;
            const answerMatch = block.match(/Answer:\s*([A-D1-4])/i);
            if (answerMatch) {
                const ans = answerMatch[1].toUpperCase();
                if ("ABCD".includes(ans)) {
                    correctIndex = "ABCD".indexOf(ans);
                } else {
                    correctIndex = Math.max(0, parseInt(ans) - 1);
                }
            }

            questions.push({
                questionText,
                options: options.slice(0, 4),
                correctIdx: correctIndex  // Convert to correctIdx for CreateTest
            });
        });
        return questions;
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("📥 Processing file...");
        e.target.value = "";

        try {
            const fileExt = file.name.toLowerCase().split('.').pop();
            let importedQuestions = [];

            if (['xlsx', 'xls'].includes(fileExt)) {
                importedQuestions = await parseExcel(file);
            } else if (fileExt === 'pdf') {
                importedQuestions = await parsePDF(file);
            } else if (['doc', 'docx'].includes(fileExt)) {
                importedQuestions = await parseDocx(file);
            } else if (fileExt === 'txt') {
                const text = await file.text();
                importedQuestions = parseTextToQuestions(text);
            } else {
                setStatus("❌ Unsupported file type");
                setTimeout(() => setStatus(null), 3000);
                return;
            }

            // ✅ ADD THIS FUNCTION (around line 15, after imports)
            const validateImportedQuestion = (q) => {
                if (!q.questionText?.trim() || q.questionText.trim().length < 5) return null;

                // Ensure options array exists and has 2+ valid items
                const validOptions = (Array.isArray(q.options) ? q.options : [])
                    .map(opt => String(opt || '').trim())
                    .filter(opt => opt.length > 1);

                if (validOptions.length < 2) return null;

                const correctIdx = Number(q.correctIdx ?? 0);
                if (isNaN(correctIdx) || correctIdx >= validOptions.length || correctIdx < 0) {
                    return null;
                }

                return {
                    questionText: q.questionText.trim(),
                    options: validOptions.slice(0, 4),
                    correctIdx
                };
            };

            // ✅ REPLACE validation (lines 108-115)
            const validQuestions = importedQuestions
                .map(validateImportedQuestion)
                .filter(Boolean);

            if (validQuestions.length === 0) {
                setStatus("❌ No valid questions found (need text + 2+ options + valid answer)");
                setTimeout(() => setStatus(null), 3000);
                return;
            }

            onQuestionsImported(validQuestions);  // ✅ Now sends PERFECTLY validated questions
            setStatus(`✅ ${validQuestions.length} VALID questions ready!`);

        } catch (err) {
            setStatus(`❌ Error: ${err.message}`);
            setTimeout(() => setStatus(null), 4000);
        }
    };

    return (
        <>
            <label
                htmlFor="fileUploader"
                className={`group cursor-pointer flex items-center gap-2 px-5 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition ${className}`}
                title="Upload questions from Excel/PDF/DOC/TXT"
            >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {buttonText}
            </label>
            <input
                id="fileUploader"
                type="file"
                accept={acceptedFormats}
                onChange={handleFile}
                className="hidden"
            />
            {status && (
                <div className="ml-4 p-3 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg text-sm">
                    {status}
                </div>
            )}
        </>
    );
};

export default FileUploader;
