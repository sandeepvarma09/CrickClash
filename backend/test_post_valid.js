const axios = require('axios');

async function run() {
  try {
    const ms = await axios.get('http://localhost:5000/api/matches');
    if (!ms.data.data.length) {
      console.log('No matches');
      return;
    }
    const matchId = ms.data.data[0]._id;
    console.log('Testing with match:', matchId);

    const res = await axios.post('http://localhost:5000/api/challenges', {
      matchId,
      username: 'testuser123',
      stake: 'Testing crash',
      predictions: {
        tossWinner: 'Team A',
        matchWinner: 'Team B',
        topRunScorer: 'Player 1',
        totalRunsByWinner: 150,
        playerOfTheMatch: 'Player 2'
      }
    });
    console.log('Success:', res.data);
  } catch(e) {
    if (e.response) {
      console.log('Error:', e.response.status, e.response.data);
    } else {
      console.log('Crash:', e.message);
    }
  }
}
run();
