import express from 'express';
import Term from '../models/Term.js';
import Suggestion from '../models/Suggestion.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import { protect, moderatorOnly } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Download all terms as PDF
router.get('/download/pdf', async (req, res) => {
    try {
        const terms = await Term.find({ status: 'approved' }).sort({ name: 1 });
        
        const doc = new PDFDocument();
        let filename = 'TechGloss_Terms.pdf';
        
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res);
        
        doc.fontSize(25).text('Technical Glossary', { align: 'center' });
        doc.moveDown();
        
        terms.forEach(term => {
            doc.fontSize(16).fillColor('black').text(term.name, { continued: true }).fillColor('gray').fontSize(12).text(`  (${term.category})`);
            doc.fontSize(12).fillColor('black').text(`Definition: ${term.definition}`);
            if (term.example) {
                doc.fontSize(12).fillColor('blue').text(`Example: ${term.example}`);
            }
            doc.moveDown();
        });
        
        doc.end();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all approved terms
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = { status: 'approved' };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    
    const terms = await Term.find(query).populate('author', 'username').sort({ upvotes: -1 });
    res.json(terms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a term (Pending for users, Approved if moderator)
router.post('/', protect, async (req, res) => {
  try {
    const { name, definition, example, category } = req.body;
    const status = req.user.role === 'moderator' ? 'approved' : 'pending';
    
    const term = await Term.create({
      name, definition, example, category, author: req.user._id, status
    });
    
    if (status === 'pending') {
        const moderators = await User.find({ role: 'moderator' });
        for (const mod of moderators) {
            mod.notifications.push({
                message: `New term "${term.name}" submitted for review.`,
                type: 'system'
            });
            await mod.save();
        }
    }

    console.log('Term created:', term.name);
    res.status(201).json(term);
  } catch (error) {
    console.error('Term Creation Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote (Upvote/Downvote)
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { type } = req.body; // 'up' or 'down'
    const term = await Term.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!term) return res.status(404).json({ message: 'Term not found' });

    const hasUpvoted = user.upvotedTerms.includes(term._id);
    const hasDownvoted = user.downvotedTerms.includes(term._id);

    // Remove previous votes
    if (hasUpvoted) {
      term.upvotes--;
      user.upvotedTerms.pull(term._id);
    }
    if (hasDownvoted) {
      term.downvotes--;
      user.downvotedTerms.pull(term._id);
    }

    // Apply new vote
    if (type === 'up' && !hasUpvoted) {
      term.upvotes++;
      user.upvotedTerms.push(term._id);
    } else if (type === 'down' && !hasDownvoted) {
      term.downvotes++;
      user.downvotedTerms.push(term._id);
    }

    await term.save();
    await user.save();
    res.json(term);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// SUGGESTIONS
// Create a suggestion for a term
router.post('/:id/suggest', protect, async (req, res) => {
    try {
        const { suggestedDefinition, suggestedExample } = req.body;
        const suggestion = await Suggestion.create({
            term: req.params.id,
            suggestedDefinition,
            suggestedExample,
            author: req.user._id
        });
        
        const moderators = await User.find({ role: 'moderator' });
        for (const mod of moderators) {
            mod.notifications.push({
                message: `A new suggestion has been submitted.`,
                type: 'system'
            });
            await mod.save();
        }

        res.status(201).json(suggestion);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all pending suggestions (Moderator)
router.get('/suggestions/pending', protect, moderatorOnly, async (req, res) => {
    try {
        const suggestions = await Suggestion.find({ status: 'pending' })
            .populate('term', 'name')
            .populate('author', 'username');
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve/Reject suggestion
router.put('/suggestions/:id/status', protect, moderatorOnly, async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const suggestion = await Suggestion.findById(req.params.id);
        
        if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

        suggestion.status = status;
        await suggestion.save();

        if (status === 'approved') {
            await Term.findByIdAndUpdate(suggestion.term, {
                definition: suggestion.suggestedDefinition,
                example: suggestion.suggestedExample
            });
            
            // Notify author
            const user = await User.findById(suggestion.author);
            user.notifications.push({
                message: `Your suggestion for term improvement was accepted!`,
                type: 'suggestion_accepted'
            });
            user.points += 5;
            await user.save();
        } else if (status === 'rejected') {
            const user = await User.findById(suggestion.author);
            if (user) {
                user.notifications.push({
                    message: `Your suggestion was rejected.`,
                    type: 'system'
                });
                await user.save();
            }
        }

        res.json(suggestion);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Bookmark Term
router.post('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.savedTerms.includes(req.params.id)) {
            user.savedTerms.pull(req.params.id);
        } else {
            user.savedTerms.push(req.params.id);
        }
        await user.save();
        res.json(user.savedTerms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Comments
router.post('/:id/comments', protect, async (req, res) => {
    try {
        const comment = await Comment.create({
            term: req.params.id,
            author: req.user._id,
            text: req.body.text
        });
        const populated = await comment.populate('author', 'username');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ term: req.params.id }).populate('author', 'username').sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reports
router.post('/:id/report', protect, async (req, res) => {
    try {
        await Report.create({
            term: req.params.id,
            reporter: req.user._id,
            reason: req.body.reason
        });
        
        const moderators = await User.find({ role: 'moderator' });
        for (const mod of moderators) {
            mod.notifications.push({
                message: `A new report has been submitted.`,
                type: 'system'
            });
            await mod.save();
        }

        res.json({ message: 'Report submitted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// MODERATOR ENDPOINTS
// Analytics
router.get('/moderator/analytics', protect, moderatorOnly, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTerms = await Term.countDocuments({ status: 'approved' });
        const pendingTerms = await Term.countDocuments({ status: 'pending' });
        const reports = await Report.find({ status: 'pending' }).populate('term', 'name').populate('reporter', 'username');
        
        const categoryStats = await Term.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        res.json({ 
            totalUsers, totalTerms, pendingTerms, 
            reports,
            popularCategory: categoryStats[0] ? categoryStats[0]._id : 'N/A' 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/moderator/reports/:id', protect, moderatorOnly, async (req, res) => {
    try {
        await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' });
        res.json({ message: 'Report resolved' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find().sort({ points: -1 }).limit(10).select('username points');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Notifications
router.get('/me/notifications', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('notifications');
        res.json(user.notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/me/notifications/read', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.notifications.forEach(n => n.read = true);
        await user.save();
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/pending', protect, moderatorOnly, async (req, res) => {
  try {
    const terms = await Term.find({ status: 'pending' }).populate('author', 'username');
    res.json(terms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/status', protect, moderatorOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const term = await Term.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    // Notify author & Add Points
    if (status === 'approved') {
        const user = await User.findById(term.author);
        if (user) {
            user.notifications.push({
                message: `Your term "${term.name}" has been approved!`,
                type: 'approval'
            });
            user.points += 10;
            await user.save();
        }
    } else if (status === 'rejected') {
        const user = await User.findById(term.author);
        if (user) {
            user.notifications.push({
                message: `Your term "${term.name}" has been rejected.`,
                type: 'system'
            });
            await user.save();
        }
    }
    
    res.json(term);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
