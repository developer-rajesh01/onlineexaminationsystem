import express from "express";
import Test from "../models/Test.js";

const router = express.Router();

// Create new test
router.post("/", async (req, res) => {
    try {
        const test = new Test(req.body);
        await test.save();
        res.status(201).json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.get("/", async (req, res) => {
    try {
        const { email, status } = req.query;
        const filter = {};
        if (email) filter.facultyEmail = email;  // match your schema field name for email
        if (status) filter.status = status;      // status = 'Active' or 'Completed'
        const tests = await Test.find(filter);
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Get test by id
router.get("/:id", async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: "Test not found" });
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update test by id
router.put("/:id", async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!test) return res.status(404).json({ message: "Test not found" });
        res.json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete test by id
router.delete("/:id", async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.id);
        if (!test) return res.status(404).json({ message: "Test not found" });
        res.json({ message: "Test deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
