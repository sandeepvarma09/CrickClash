const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/challenges', {
      matchId: "65f0a0000000000000000000", // invalid match id to test 404
      username: "testuser",
      stake: "test stake",
      predictions: {
        tossWinner: "Team 1",
        matchWinner: "Team 1",
        topRunScorer: "Virat Kohli",
        totalRunsByWinner: 200,
        playerOfTheMatch: "Virat Kohli"
      }
    });
    console.log("Success:", res.data);
  } catch (e) {
    if (e.response) {
      console.log("Error status:", e.response.status, e.response.data);
    } else {
      console.log("Network Error:", e.message);
    }
  }
}

test();
