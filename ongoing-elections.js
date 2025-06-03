async function fetchElections() {
    try {
      const response = await fetch('/api/elections');
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const container = document.getElementById('elections-container');
  
      if (data.length === 0) {
        container.innerHTML = "<p class='no-elections'>Oops! No elections conducted yet.</p>";
      } else {
        data.forEach(election => {
          const electionCard = document.createElement('div');
          electionCard.classList.add('election-card');
    electionCard.innerHTML = `
  <h2>${election.electionName}</h2>
  <p><strong>Type:</strong> ${election.electionType}</p>
  <p><strong>Start Date:</strong> ${election.startDate}</p>
  <p><strong>End Date:</strong> ${election.endDate}</p>
  <p><strong>Start Time:</strong> ${election.startTime}</p>

  <button class="toggle-btn">Show Candidates</button>
  <ul class="candidate-list" style="display: none;">
    ${election.candidates.map(candidate => `
      <li>${candidate.candidateName} - ${candidate.partyName}</li>`).join('')}
  </ul>

  ${
    election.status === 'Ongoing' 
      ? `<button class="vote-now-btn" onclick="startFaceRecognition('${election._id}')">Vote Now</button>` 
      : `<span style="color: black; font-weight: bold;">Upcoming</span>`
  }
`;
const toggleBtn = electionCard.querySelector('.toggle-btn');
const candidateList = electionCard.querySelector('.candidate-list');

toggleBtn.addEventListener('click', () => {
  const isVisible = candidateList.style.display === 'block';
  candidateList.style.display = isVisible ? 'none' : 'block';
  toggleBtn.textContent = isVisible ? 'Show Candidates' : 'Hide Candidates';
});
          container.appendChild(electionCard);
  });
      }
    } catch (error) {
      console.error("Error fetching elections:", error);
      document.getElementById('elections-container').innerHTML = "<p>Error fetching elections.</p>";
    }
  }
  function startFaceRecognition(electionId) {
    const voterId = localStorage.getItem('voterId');
    console.log(voterId) // Or however you store it
    if (!voterId) {
      alert("User not logged in.");
      return;
    }
    window.location.href = `http://localhost:5000/verify-face?voterId=${voterId}&electionId=${electionId}`;
  }
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear(); // Clear stored voterId etc
    window.location.href = '/home.html'; // Or your home page
  });
  
  document.getElementById('resultsBtn').addEventListener('click', () => {
    window.location.href = '/results.html'; // adjust path if needed
  });
  
  // Call the function on page load
  fetchElections();
  