const fs = require('fs');

// Load group and exhibition data
function loadGroups() {
    return JSON.parse(fs.readFileSync('groups.json')).groups;
}

function loadExhibitions() {
    return JSON.parse(fs.readFileSync('exhibitions.json'));
}

// Calculate the form of a team based on their exhibition match results
function calculateForm(team, exhibitions) {
    const matches = exhibitions.filter(match => match.teamA === team.name || match.teamB === team.name);
    let form = 0;

    matches.forEach(match => {
        if (match.teamA === team.name) {
            form += match.scoreA - match.scoreB; // Positive if teamA wins
        } else {
            form += match.scoreB - match.scoreA; // Positive if teamB wins
        }
    });

    return form;
}

// Simulate a match between two teams based on their ranking and form
function simulateMatch(teamA, teamB, formA, formB) {
    const rankingDifference = teamB.ranking - teamA.ranking;
    const probTeamA = 0.5 + (rankingDifference / 100) + (formA - formB) / 200;  // Include form in probability

    const scoreA = Math.floor(Math.random() * 100) + 50;
    const scoreB = Math.floor(Math.random() * 100) + 50;

    const winner = Math.random() < probTeamA ? teamA : teamB;
    return { winner, scoreA, scoreB };
}

// Simulate the group stage of the tournament
function simulateGroupStage(groups, exhibitions) {
    const standings = {};

    for (const group of groups) {
        console.log(`Group ${group.group} Matches:`);

        const groupStandings = group.teams.map(team => ({
            team: team.name,
            iso: team.iso,
            ranking: team.ranking,
            points: 0,
            scored: 0,
            allowed: 0,
            wins: 0,
            losses: 0,
            form: calculateForm(team, exhibitions)
        }));

        for (let i = 0; i < group.teams.length; i++) {
            for (let j = i + 1; j < group.teams.length; j++) {
                const teamA = group.teams[i];
                const teamB = group.teams[j];
                const { winner, scoreA, scoreB } = simulateMatch(teamA, teamB, groupStandings[i].form, groupStandings[j].form);
                const loser = winner === teamA ? teamB : teamA;

                console.log(`${teamA.name} - ${teamB.name} (${scoreA}:${scoreB})`);

                const winnerStandings = groupStandings.find(t => t.team === winner.name);
                const loserStandings = groupStandings.find(t => t.team === loser.name);

                winnerStandings.points += 2;
                winnerStandings.wins += 1;
                winnerStandings.scored += scoreA;
                winnerStandings.allowed += scoreB;

                loserStandings.losses += 1;
                loserStandings.scored += scoreB;
                loserStandings.allowed += scoreA;
            }
        }

        // Sort standings and store in final standings
        groupStandings.sort((a, b) => b.points - a.points || 
            (b.scored - b.allowed) - (a.scored - a.allowed) || 
            b.scored - a.scored // Added tie-breaker for points scored
        );
        standings[group.group] = groupStandings;
    }

    console.log("Final Group Standings:");
    for (const group in standings) {
        console.log(`Group ${group}:`);
        standings[group].forEach(team => {
            console.log(`${team.team}: Wins: ${team.wins} | Losses: ${team.losses} | Points: ${team.points} | Scored: ${team.scored} | Allowed: ${team.allowed} | Point Difference: ${team.scored - team.allowed}`);
        });
    }

    return standings;
}


function drawQuarterFinals(qualifiedTeams) {
    const pots = {
        D: [],
        E: [],
        F: [],
        G: []
    };

    qualifiedTeams.forEach((team, index) => {
        if (index < 2) pots.D.push(team); // 1st place teams
        else if (index < 4) pots.E.push(team); // 2nd place teams
        else if (index < 6) pots.F.push(team); // 3rd place teams
        else pots.G.push(team); // 4th place teams
    });

    const quarterFinals = [];

    pots.D.forEach(teamD => {
        let opponent = pots.G.find(teamG => teamG.team !== teamD.team);
        if (opponent) {
            quarterFinals.push({ team1: teamD, team2: opponent });
            pots.G.splice(pots.G.indexOf(opponent), 1); // Remove opponent from Pot G
        } else {
            console.error(`No valid opponent found for ${teamD.name} in Pot G`);
        }
    });

    pots.E.forEach(teamE => {
        let opponent = pots.F.find(teamF => teamF.team !== teamE.team);
        if (opponent) {
            quarterFinals.push({ team1: teamE, team2: opponent });
            pots.F.splice(pots.F.indexOf(opponent), 1); // Remove opponent from Pot F
        } else {
            console.error(`No valid opponent found for ${teamE.name} in Pot F`);
        }
    });

    console.log("Quarter-Finals Draw:");
    quarterFinals.forEach(match => {
        console.log(`${match.team1.team} vs ${match.team2.team}`);
    });

    return quarterFinals;
}

// Simulate the knockout stage of the tournament
function simulateKnockoutStage(quarterFinals) {
    const semiFinals = [];
    const bronzeMatch = [];
    const finalMatch = [];

    function simulateKnockoutMatch(team1, team2) {
        const score1 = Math.floor(Math.random() * 100) + 50;
        const score2 = Math.floor(Math.random() * 100) + 50;
        const winner = score1 > score2 ? team1 : team2;
        const loser = winner === team1 ? team2 : team1;

        return { winner, loser, score1, score2 };
    }

    console.log("Quarter-Finals:");
    quarterFinals.forEach(match => {
        const { winner, loser, score1, score2 } = simulateKnockoutMatch(match.team1, match.team2);
        console.log(`${match.team1.team} vs ${match.team2.team} (${score1}:${score2}) - Winner: ${winner.team}`);
        semiFinals.push(winner);
    });

    console.log("Semi-Finals:");
    const semiFinalPairs = [
        { team1: semiFinals[0], team2: semiFinals[1] },
        { team1: semiFinals[2], team2: semiFinals[3] }
    ];

    semiFinalPairs.forEach(match => {
        const { winner, loser, score1, score2 } = simulateKnockoutMatch(match.team1, match.team2);
        console.log(`${match.team1.team} vs ${match.team2.team} (${score1}:${score2}) - Winner: ${winner.team}`);
        finalMatch.push(winner);
        bronzeMatch.push(loser);
    });

    // Simulate bronze match
    console.log("Bronze Match:");
    const { winner: bronzeWinner, score1: bronzeScore1, score2: bronzeScore2 } = simulateKnockoutMatch(bronzeMatch[0], bronzeMatch[1]);
    console.log(`${bronzeMatch[0].team} vs ${bronzeMatch[1].team} (${bronzeScore1}:${bronzeScore2}) - Bronze Medal: ${bronzeWinner.team}`);

    // Simulate final
    console.log("Final:");
    const { winner: goldWinner, score1: finalScore1, score2: finalScore2 } = simulateKnockoutMatch(finalMatch[0], finalMatch[1]);
    console.log(`${finalMatch[0].team} vs ${finalMatch[1].team} (${finalScore1}:${finalScore2}) - Gold Medal: ${goldWinner.team}`);

    console.log("\nMedals:");
    console.log(`Gold: ${goldWinner.team}`);
    console.log(`Silver: ${finalMatch[0].team === goldWinner.team ? finalMatch[1].team : finalMatch[0].team}`);
    console.log(`Bronze: ${bronzeWinner.team}`);
}

// Main function to run the simulation
function runTournament() {
    const groups = loadGroups();
    const exhibitions = loadExhibitions();

    const standings = simulateGroupStage(groups, exhibitions);

    // Rank all teams by group position
    const rankedTeams = [];
    for (const group in standings) {
        rankedTeams.push(...standings[group]);
    }

    rankedTeams.sort((a, b) => b.points - a.points ||
        (b.scored - b.allowed) - (a.scored - a.allowed) ||
        b.scored - a.scored);

    const qualifiedTeams = rankedTeams.slice(0, 8); // Top 8 teams advance
    const quarterFinals = drawQuarterFinals(qualifiedTeams);

    simulateKnockoutStage(quarterFinals);
}

// Run the tournament simulation
runTournament();
