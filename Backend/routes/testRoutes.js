import express from "express";
import Test from "../models/Test.js";

const router = express.Router();

// helper: compute live status
function computeLiveStatus(startIso, endIso) {
    if (!startIso || !endIso) return "upcoming";
    const now = Date.now();
    const s = new Date(startIso).getTime();
    const e = new Date(endIso).getTime();
    if (now < s) return "upcoming";
    if (now >= s && now < e) return "ongoing";
    return "completed";
}

// helper: derive date/time strings (YYYY-MM-DD, HH:mm) from Date
function deriveDateAndTime(d) {
    if (!d) return { startDate: undefined, startTime: undefined };
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return { startDate: undefined, startTime: undefined };

    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());

    return {
        startDate: `${yyyy}-${mm}-${dd}`,
        startTime: `${hh}:${min}`,
    };
}

// Create new test (with validation, timestamps, and socket emit)
router.post("/", async (req, res) => {
    try {
        const {
            title,
            duration, // minutes
            startTimestamp, // optional ISO string
            startDate, // optional YYYY-MM-DD
            startTime, // optional HH:MM
            endTimestamp, // optional override ISO
            targetAudience,
            courseName, // optional - prefer this if provided
            author,
            passMarks,
            totalMarks,
            institute,
            questions = [],
            facultyEmail,
        } = req.body;

        // required checks
        if (
            !title ||
            !duration ||
            (!startTimestamp && !(startDate && startTime)) ||
            !totalMarks ||
            !targetAudience // keep requiring targetAudience for backwards compat, we will also set courseName
        ) {
            return res.status(400).json({
                message:
                    "Missing required fields. Required: title, duration, totalMarks, targetAudience and either startTimestamp OR (startDate + startTime).",
            });
        }

        // compute start timestamp (Date object)
        let start;
        if (startTimestamp) {
            start = new Date(startTimestamp);
            if (isNaN(start)) return res.status(400).json({ message: "Invalid startTimestamp" });
        } else {
            const isoLocal = `${startDate}T${startTime}:00`;
            start = new Date(isoLocal);
            if (isNaN(start)) return res.status(400).json({ message: "Invalid startDate/startTime" });
        }

        // compute end timestamp (duration preferred, else explicit endTimestamp)
        let end;
        const dur = Number(duration);
        if (Number.isNaN(dur) || dur <= 0) return res.status(400).json({ message: "Invalid duration" });

        if (endTimestamp) {
            end = new Date(endTimestamp);
            if (isNaN(end)) return res.status(400).json({ message: "Invalid endTimestamp" });
        } else {
            end = new Date(start.getTime() + dur * 60000);
        }

        // passMarks validation: must be less than totalMarks when provided
        if (passMarks !== undefined && passMarks !== null) {
            const pm = Number(passMarks);
            const tm = Number(totalMarks);
            if (Number.isNaN(pm) || Number.isNaN(tm))
                return res.status(400).json({ message: "Invalid passMarks or totalMarks" });
            if (pm >= tm) return res.status(400).json({ message: "passMarks must be smaller than totalMarks" });
        }

        const now = new Date();
        let status = "upcoming";
        if (now >= start && now < end) status = "ongoing";
        if (now >= end) status = "completed";

        const { startDate: derivedDate, startTime: derivedTime } = deriveDateAndTime(start);

        // prefer explicit courseName, otherwise copy from targetAudience
        const finalCourseName = (courseName || targetAudience || "").toString();

        const testDoc = new Test({
            title,
            duration: dur,
            startTimestamp: start,
            endTimestamp: end,
            startDate: derivedDate,
            startTime: derivedTime,
            targetAudience,
            courseName: finalCourseName,
            author,
            passMarks: passMarks !== undefined ? Number(passMarks) : undefined,
            totalMarks: Number(totalMarks),
            institute,
            questions,
            facultyEmail,
            status,
        });

        const saved = await testDoc.save();

        const payload = {
            ...saved.toObject(),
            // ensure courseName present in payload for clients
            courseName: saved.courseName || saved.targetAudience,
            liveStatus: computeLiveStatus(saved.startTimestamp, saved.endTimestamp),
            serverTime: new Date().toISOString(),
        };

        try {
            const io = req.app.get("io");
            if (io) {
                // emit to both courseName and targetAudience rooms so older clients still receive messages
                const audiences = new Set();
                if (saved.targetAudience) {
                    String(saved.targetAudience)
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                        .forEach((a) => audiences.add(a));
                }
                if (saved.courseName) {
                    String(saved.courseName)
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                        .forEach((a) => audiences.add(a));
                }

                audiences.forEach((a) => io.to(`audience:${a}`).emit("testCreated", payload));
                io.to(`test:${saved._id}`).emit("testCreated", payload);
            }
        } catch (emitErr) {
            console.error("Error emitting testCreated:", emitErr);
        }

        return res.status(201).json({ success: true, test: saved });
    } catch (error) {
        console.error("Create test error:", error);
        return res.status(500).json({ message: error.message });
    }
});

// List tests with optional filtering; returns liveStatus + serverTime for client sync
router.get("/", async (req, res) => {
    try {
        const { email, status } = req.query;
        const filter = {};
        if (email) filter.facultyEmail = email;
        if (status) filter.status = status;
        const tests = await Test.find(filter).lean();

        const serverTime = new Date().toISOString();
        const enriched = tests.map((t) => ({
            ...t,
            // ensure courseName exists for clients (fallback to targetAudience)
            courseName: t.courseName || t.targetAudience,
            liveStatus: computeLiveStatus(t.startTimestamp, t.endTimestamp),
        }));

        res.json({ serverTime, tests: enriched });
    } catch (error) {
        console.error("Get tests error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get test by id (with serverTime and liveStatus)
router.get("/:id", async (req, res) => {
    try {
        const test = await Test.findById(req.params.id).lean();
        if (!test) return res.status(404).json({ message: "Test not found" });

        const serverTime = new Date().toISOString();
        const enriched = {
            ...test,
            courseName: test.courseName || test.targetAudience,
            liveStatus: computeLiveStatus(test.startTimestamp, test.endTimestamp),
        };

        res.json({ serverTime, test: enriched });
    } catch (error) {
        console.error("Get test by id error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Update test by id (validate passMarks < totalMarks when updated)
router.put("/:id", async (req, res) => {
    try {
        const update = { ...req.body };

        // If client provided courseName but not targetAudience, keep both fields consistent if desired
        if (update.courseName && !update.targetAudience) {
            update.targetAudience = update.courseName;
        } else if (update.targetAudience && !update.courseName) {
            update.courseName = update.targetAudience;
        }

        if (update.passMarks !== undefined && update.totalMarks !== undefined) {
            const pm = Number(update.passMarks);
            const tm = Number(update.totalMarks);
            if (Number.isNaN(pm) || Number.isNaN(tm))
                return res.status(400).json({ message: "Invalid passMarks or totalMarks" });
            if (pm >= tm) return res.status(400).json({ message: "passMarks must be smaller than totalMarks" });
        }

        // handle timestamp/duration updates
        if (update.startTimestamp || update.endTimestamp || update.duration || (update.startDate && update.startTime)) {
            const existing = await Test.findById(req.params.id);
            if (!existing) return res.status(404).json({ message: "Test not found" });

            // determine start (prefer provided values, fall back to existing)
            let start;
            if (update.startTimestamp) {
                start = new Date(update.startTimestamp);
            } else if (update.startDate && update.startTime) {
                start = new Date(`${update.startDate}T${update.startTime}:00`);
            } else {
                start = existing.startTimestamp;
            }
            if (isNaN(new Date(start).getTime())) return res.status(400).json({ message: "Invalid startTimestamp/startDate/startTime" });

            const dur = update.duration !== undefined ? Number(update.duration) : existing.duration;
            if (Number.isNaN(dur) || dur <= 0) return res.status(400).json({ message: "Invalid duration" });

            const end = update.endTimestamp ? new Date(update.endTimestamp) : new Date(new Date(start).getTime() + dur * 60000);
            if (isNaN(new Date(end).getTime())) return res.status(400).json({ message: "Invalid endTimestamp" });

            const now = new Date();
            let newStatus = "upcoming";
            if (now >= start && now < end) newStatus = "ongoing";
            if (now >= end) newStatus = "completed";

            update.startTimestamp = start;
            update.endTimestamp = end;
            update.duration = dur;
            update.status = newStatus;

            const { startDate: derivedDate, startTime: derivedTime } = deriveDateAndTime(start);
            update.startDate = derivedDate;
            update.startTime = derivedTime;
        }

        // ensure courseName if targetAudience changed in update
        if (update.targetAudience && !update.courseName) {
            update.courseName = update.targetAudience;
        }

        const test = await Test.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });

        if (!test) return res.status(404).json({ message: "Test not found" });

        try {
            const io = req.app.get("io");
            if (io) {
                const payload = {
                    ...test.toObject(),
                    courseName: test.courseName || test.targetAudience,
                    liveStatus: computeLiveStatus(test.startTimestamp, test.endTimestamp),
                    serverTime: new Date().toISOString(),
                };

                io.to(`test:${test._id}`).emit("testUpdated", payload);

                const audiences = new Set();
                if (test.targetAudience) {
                    String(test.targetAudience)
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                        .forEach((a) => audiences.add(a));
                }
                if (test.courseName) {
                    String(test.courseName)
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                        .forEach((a) => audiences.add(a));
                }

                audiences.forEach((a) => io.to(`audience:${a}`).emit("testUpdated", payload));
            }
        } catch (e) {
            console.error("Emit error on update:", e);
        }

        res.json(test);
    } catch (error) {
        console.error("Update test error:", error);
        res.status(400).json({ message: error.message });
    }
});

// Delete test by id
router.delete("/:id", async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.id);
        if (!test) return res.status(404).json({ message: "Test not found" });

        try {
            const io = req.app.get("io");
            if (io) {
                const payload = { _id: test._id };

                io.to(`test:${test._id}`).emit("testDeleted", payload);

                const audiences = new Set();
                if (test.targetAudience) {
                    String(test.targetAudience)
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                        .forEach((a) => audiences.add(a));
                }
                if (test.courseName) {
                    String(test.courseName)
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                        .forEach((a) => audiences.add(a));
                }

                audiences.forEach((a) => io.to(`audience:${a}`).emit("testDeleted", payload));
            }
        } catch (e) {
            console.error("Emit error on delete:", e);
        }

        res.json({ message: "Test deleted" });
    } catch (error) {
        console.error("Delete test error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
