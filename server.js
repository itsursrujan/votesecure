require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Admin = require('./models/Admin');
const Candidate = require('./models/candidate');
const Election = require('./models/Election');
const path = require('path'); // Import Election model
const app = express();
const axios = require('axios');



//cross platform allowance from 5000 to 3000 port frontend flask-5000 and server.js-3000
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5000' }));

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use('/images/uploads', express.static(path.join(__dirname, 'uploads')));
// Add a simple logger to see what's happening
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

//USER SERVER
// Signup Route
app.post('/signup', async (req, res) => {
  const { name, voterId, age, gender, address, password } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({ error: "User name must contain only alphabetic characters " });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ voterId });
  if (existingUser) {
    return res.status(400).json({ error: "Voter ID already registered" });
  }

  // Save user with hasVoted defaulted to false
  try {
    const user = new User({ name, voterId, age, gender, address, password, hasVoted: false });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { voterId, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ voterId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate Password (assuming plain text password, no hashing)
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful!', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
//FORGOT PASSWORD SERVER
// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
  const { voterId, newPassword } = req.body;

  try {
    const user = await User.findOne({ voterId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password (No hashing as per your requirement)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

// 🟢 Serve Forgot Password Page
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'forgot-password.html'));
});


// check face registered
app.get('/check-face/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ faceRegistered: false });

    const isRegistered = user.faceEncoding && user.faceEncoding.length > 0;
    res.json({ faceRegistered: isRegistered });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Validation function
const isValidName = (name) => /^[A-Za-z]+$/.test(name);

//ADMIN SERVER

// Admin Sign-In
app.post('/admin/signin', async (req, res) => {
  const { name, eciId, aadharId, password } = req.body;

  if (!isValidName(name)) {
    return res.status(400).json({ error: "Name must contain only alphabetic characters" });
  }
  // Validate ECI ID and Aadhar ID
  const eciRegex = /^[A-Za-z]{4}\d{6}$/;
  const aadharRegex = /^\d{10}$/;

  if (!eciRegex.test(eciId) || !aadharRegex.test(aadharId)) {
    return res.status(400).json({ error: 'Invalid ECI ID or Aadhar ID format' });
  }

  try {
    // Check for unique ECI ID and Aadhar ID
    const existingAdmin = await Admin.findOne({ $or: [{ eciId }, { aadharId }] });

    if (existingAdmin) {
      if (existingAdmin.eciId === eciId) {
        return res.status(400).json({ error: 'ECI ID already exists' });
      }
      if (existingAdmin.aadharId === aadharId) {
        return res.status(400).json({ error: 'Aadhar ID already exists' });
      }
    }

    // Save new admin if validation passes
    const admin = new Admin({ name, eciId, aadharId, password });
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register admin' });
  }
});

app.post('/admin/login', async (req, res) => {
  const { eciId, password } = req.body;

  try {
    // Check if user exists
    const admin = await Admin.findOne({ eciId });

    if (!admin) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate Password (assuming plain text password, no hashing)
    if (admin.password !== password) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

//ADMIN DASHBOARD SERVER

// Import multer and path
const multer = require('multer');
const fs = require('fs');

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Multer Config for Image Uploads
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

app.post('/add-candidate', upload.single('partySymbol'), async (req, res) => {
  const { candidateName, partyName, age, candidateId } = req.body;

  // Check if all fields are filled
  if (!candidateName || !partyName || !age || !candidateId || !req.file) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate age and candidate ID
  if (age < 25 || age > 70) {
    return res.status(400).json({ error: 'Candidate age must be between 25 and 70.' });
  }

  if (!/^\d{5}$/.test(candidateId)) {
    return res.status(400).json({ error: 'Candidate ID must be a 5-digit number.' });
  }

  try {
    const existingCandidate = await Candidate.findOne({ candidateId });
    if (existingCandidate) {
      return res.status(400).json({ error: 'Candidate ID already exists.' });
    }

    // Save candidate data
    const candidate = new Candidate({
      candidateName,
      partyName,
      age,
      partySymbol: `/uploads/${req.file.filename}`,
      candidateId
    });

    await candidate.save();
    res.status(201).json({ message: 'Candidate added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add candidate.' });
  }
});


//VIEW VOTERS PAGE SERVER
// View Voters Route
app.get('/voters', async (req, res) => {
  try {
    const voters = await User.find();
    res.status(200).json(voters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch voters.' });
  }
});

// Delete Voter Route
app.delete('/voters/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const voter = await User.findByIdAndDelete(id);
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }
    res.status(200).json({ message: 'Voter deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete voter.' });
  }
});

//View Candidates Server
app.get('/get-candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete candidate
app.delete('/delete-candidate/:id', async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

//CONDUCT ELECTION PAGE SERVER
// Fetch Candidates Route
app.get('/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find({}, 'candidateName age partyName candidateId');
    res.status(200).json(candidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch candidates.' });
  }
});

// Conduct Election
app.post('/conduct-election', async (req, res) => {
  const { electionName, electionType, startDate, endDate, startTime, selectedCandidates } = req.body;


  // Validate Election Type
  const validElectionTypes = ['PM', 'CM', 'MLA'];
  if (!validElectionTypes.includes(electionType)) {
    return res.status(400).json({ error: 'Invalid election type. Choose PM, CM, or MLA.' });
  }

  // Validate Dates and Times
  const currentDate = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start <= currentDate) {
    return res.status(400).json({ error: 'Start date must be in the future.' });
  }

  if (end <= start) {
    return res.status(400).json({ error: 'End date must be after the start date.' });
  }

  const [hours, minutes] = startTime.split(':').map(Number);
  if (hours < 8 || hours > 18 || (hours === 18 && minutes > 0)) {
    return res.status(400).json({ error: 'Start time must be between 8:00 AM and 6:00 PM.' });
  }

  // Prevent Election Within 5 Minutes
  const ongoingElection = await Election.findOne({ status: 'Ongoing' });
  if (ongoingElection) {
    const electionStartTime = new Date(`${ongoingElection.startDate}T${ongoingElection.startTime}`);
    const timeDifference = Math.floor((currentDate - electionStartTime) / 60000);
    if (timeDifference < 5) {
      return res.status(400).json({ error: 'An election was recently conducted. Please wait for 5 minutes.' });
    }
  }

  // Save Election to Database
  try {

    if (!selectedCandidates || selectedCandidates.length < 2) {
      return res.status(400).json({ error: 'At least 2 candidates are required to conduct an election.' });
    }

    // Fetch full candidate details
    const candidateDocs = await Candidate.find({ _id: { $in: selectedCandidates } });

    if (candidateDocs.length < 2) {
      return res.status(400).json({ error: 'Invalid candidate selection.' });
    }

    const election = new Election({
      electionName,
      electionType,
      startDate,
      endDate,
      startTime,
      candidates: candidateDocs, // Send full candidate objects
      status: 'Upcoming',
    });
    await election.save();
    res.status(201).json({ message: 'Election conducted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to conduct election.', details: error.message });
  }
});
//USER AFTER LOGIN SERVER
// Serve HTML File
app.get('/ongoing-elections.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ongoingElections.html'));
});

// API to Fetch Elections from MongoDB
app.get('/api/elections', async (req, res) => {
  try {
    const elections = await Election.find({ status: { $in: ['Upcoming', 'Ongoing'] } });

    if (elections.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(elections);
  } catch (error) {
    console.error('Error fetching elections:', error);
    res.status(500).json({ error: 'Failed to fetch elections' });
  }
});
// New route to fetch candidates of a specific election
app.get('/api/election/:electionId', async (req, res) => {
  try {
    const electionId = req.params.electionId;
    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    // Map the candidates to only send needed details
    const candidates = election.candidates.map(candidate => ({
      candidateId: candidate._id,
      candidateName: candidate.candidateName,   // Assuming DB field is 'name'
      partyName: candidate.partyName   // Assuming DB field is 'partyName'
    }));

    res.status(200).json({ candidates });
  } catch (error) {
    console.error('Error fetching election candidates:', error);
    res.status(500).json({ error: 'Failed to fetch election candidates' });
  }
});


const cron = require('node-cron');
// Runs every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();

  try {
    const elections = await Election.find({});

    for (const election of elections) {
      const start = new Date(election.startDate);
      const [startHour, startMin] = election.startTime.split(':').map(Number);
      start.setHours(startHour, startMin, 0, 0);  // set full start timestamp

      const end = new Date(election.endDate);
      end.setHours(23, 59, 59, 999); // full end of the day


      // console.log(`🕒 Checking election: ${election.electionName}`);
      // console.log(`  now      : ${now}`);
      // console.log(`  start    : ${start}`);
      // console.log(`  end      : ${end}`);
      // console.log(`  status   : ${election.status}`);
      // 1. Update to Ongoing

      if (election.status === 'Upcoming' && now > end) {
        election.status = 'Completed';
        await election.save();
        console.log(`⚠️ "${election.electionName}" skipped Ongoing, directly marked as Completed`);
      }

      if (election.status === 'Upcoming' && now >= start && now < end) {
        election.status = 'Ongoing';
        await election.save();
        console.log(`✅ "${election.electionName}" updated to Ongoing`);
      }

      // 2. Update to Completed
      if (election.status === 'Ongoing' && now > end) {
        election.status = 'Completed';
        await election.save();
        console.log(`✅ "${election.electionName}" updated to Completed`);
      }
    }
  } catch (err) {
    console.error('❌ Cron job error:', err);
  }
});

//Vote Cast Phase after Face Verification
// In your Node.js backend (e.g. routes/election.js or server.js)
app.get('/api/election/:id', async (req, res) => {
  const electionId = req.params.id;
  try {
    const election = await Election.findById(electionId); // Mongoose call

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    res.json({
      candidates: election.candidates.map(c => ({
        candidateId: c._id,
        candidateName: c.name,
        partyName: c.party
      }))
    });
  } catch (err) {
    console.error("Election fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// API to cast vote
app.post('/api/vote', async (req, res) => {
  const { voterId, electionId, candidateId } = req.body;

  if (!voterId || !electionId || !candidateId) {
    return res.status(400).json({ success: false, message: "Missing fields." });
  }

  try {
    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ success: false, message: "Voter not found" });

    const hasVoted = user.votes.some(v => v.electionId.toString() === electionId);
    if (hasVoted) {
      return res.status(403).json({ success: false, message: "You have already voted in this election." });
    }

    // Add vote
    user.votes.push({ electionId, candidateId });
    await user.save();

    return res.status(200).json({ success: true, message: "Vote cast successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});
//RESULT PAGE
app.get('/results', async (req, res) => {
  try {
    const completedElections = await Election.find({ status: 'Completed' });

    const allResults = [];

    for (const election of completedElections) {
      const voteMap = {}; // candidateId => vote count

      const users = await User.find({ 'votes.electionId': election._id });

      // Count votes per candidate for this election
      users.forEach(user => {
        const vote = user.votes.find(v => v.electionId.toString() === election._id.toString());
        if (vote) {
          voteMap[vote.candidateId.toString()] = (voteMap[vote.candidateId.toString()] || 0) + 1;
        }
      });

      // Prepare candidate list with vote count
      const candidatesWithVotes = election.candidates.map(c => {
        return {
          candidateName: c.candidateName,
          partyName: c.partyName,
          candidateId: c._id.toString(), // use _id as ID
          voteCount: voteMap[c._id.toString()] || 0
        };
      });

      // Determine winner
      const winner = candidatesWithVotes.reduce((max, c) =>
        c.voteCount > (max?.voteCount || 0) ? c : max, null);
      console.log(winner)

      allResults.push({
        electionName: election.electionName,
        electionType: election.electionType,
        candidates: candidatesWithVotes,
        winner
      });
    }

    res.status(200).json(allResults);

  } catch (error) {
    console.error("Error fetching election results:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// Server Listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});