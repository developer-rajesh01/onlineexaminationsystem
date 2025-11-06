import express from "express";
import Test from "../models/Test.js";

const router = express.Router();

// Create a new test
router.post("/", async (req, res) => {
    try {
        const test = new Test(req.body);
        await test.save();
        res.status(201).json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all tests
router.get("/", async (req, res) => {
    try {
        const tests = await Test.find();
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single test by id
router.get("/:id", async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: "Test not found" });
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a test by id
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

// Delete a test by id
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
