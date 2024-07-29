const HarrisBase = 212;
const trumpBase = 179;
const states = {
    'Arizona': 11, 'Georgia': 16, 'Michigan': 15, 'North Carolina': 16, 'Nevada': 6,
    'Pennsylvania': 19, 'Wisconsin': 10, 'Texas': 40, 'Virginia': 13, 'NE-02': 1
};

let initialCombinations = [];
let filteredCombinations = [];

document.addEventListener('DOMContentLoaded', () => {
    const stateButtons = document.querySelectorAll('.state-buttons button');
    const gridContainer = document.getElementById('probability-grid').getElementsByTagName('tbody')[0];
    const outcomeFilter = document.getElementById('outcome-filter');

    function generateInitialCombinations() {
        const stateNames = Object.keys(states);
        const totalCombos = 1 << stateNames.length;

        for (let i = 0; i < totalCombos; i++) {
            let HarrisSum = HarrisBase;
            let trumpSum = trumpBase;
            let combo = { id: i, states: {} };

            stateNames.forEach((state, index) => {
                if (i & (1 << index)) {
                    combo.states[state] = 'Harris';
                    HarrisSum += states[state];
                } else {
                    combo.states[state] = 'Trump';
                    trumpSum += states[state];
                }
            });

            combo.HarrisSum = HarrisSum;
            combo.trumpSum = trumpSum;
            combo.winner = HarrisSum >= 270 ? 'Harris' : (trumpSum >= 270 ? 'Trump' : (HarrisSum === 269 && trumpSum === 269 ? 'Tie' : ''));
            combo.over270 = HarrisSum >= 270 ? HarrisSum - 270 : (trumpSum >= 270 ? trumpSum - 270 : 0);

            initialCombinations.push(combo);
        }
    }

    function getOver270Color(value) {
        const max = Math.max(...filteredCombinations.map(combo => combo.over270));
        const ratio = value / max;
        const g = Math.floor(255 * ratio); // Green component increases
        return `rgb(0, ${g}, 0)`; // RGB with varying green component
    }

    function updateCombinations() {
        const selectedStates = [...document.querySelectorAll('.state-buttons button.Harris, .state-buttons button.trump')];
        const selectedValues = selectedStates.map(btn => ({
            state: btn.dataset.state,
            value: parseInt(btn.dataset.value),
            candidate: btn.classList.contains('Harris') ? 'Harris' : 'Trump'
        }));

        filteredCombinations = initialCombinations.filter(combo => {
            return selectedValues.every(sel => combo.states[sel.state] === sel.candidate);
        });

        const selectedOutcome = outcomeFilter.value;
        if (selectedOutcome !== 'all') {
            filteredCombinations = filteredCombinations.filter(combo => combo.winner === selectedOutcome);
        }

        displayCombinations(gridContainer, filteredCombinations);
        calculateVictoryPaths(filteredCombinations);
    }

    function displayCombinations(container, combos) {
        container.innerHTML = '';

        combos.forEach(combo => {
            const row = container.insertRow();
            row.insertCell().textContent = combo.id;

            Object.keys(states).forEach(state => {
                const cell = row.insertCell();
                const stateColor = combo.states[state] === 'Harris' ? 'blue' :
                                   combo.states[state] === 'Trump' ? 'red' :
                                   '#4B0082'; // Indigo for neutral state
                cell.textContent = combo.states[state];
                cell.style.backgroundColor = stateColor;
                cell.style.color = 'white';
            });

            const HarrisCell = row.insertCell();
            HarrisCell.textContent = combo.HarrisSum;
            HarrisCell.style.backgroundColor = 'blue';
            HarrisCell.style.color = 'white';

            const trumpCell = row.insertCell();
            trumpCell.textContent = combo.trumpSum;
            trumpCell.style.backgroundColor = 'red';
            trumpCell.style.color = 'white';

            const winnerCell = row.insertCell();
            winnerCell.textContent = combo.winner;
            if (combo.winner === 'Harris') {
                winnerCell.style.backgroundColor = 'blue';
                winnerCell.style.color = 'white';
            } else if (combo.winner === 'Trump') {
                winnerCell.style.backgroundColor = 'red';
                winnerCell.style.color = 'white';
            } else if (combo.winner === 'Tie') {
                winnerCell.style.backgroundColor = 'tan';
                winnerCell.style.color = 'black';
            }

            const over270Cell = row.insertCell();
            over270Cell.textContent = combo.over270;
            over270Cell.style.backgroundColor = getOver270Color(combo.over270);
            over270Cell.style.color = 'white'; // Change text color to white
        });
    }

    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        }
    }

    // Pre-select states
    document.querySelector('button[data-state="Texas"]').classList.add('trump');
    document.querySelector('button[data-state="Virginia"]').classList.add('Harris');
    document.querySelector('button[data-state="NE-02"]').classList.add('Harris');

    stateButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('Harris')) {
                button.classList.remove('Harris');
                button.classList.add('trump');
            } else if (button.classList.contains('trump')) {
                button.classList.remove('trump');
            } else {
                button.classList.add('Harris');
            }
            updateCombinations();
        });
    });

    outcomeFilter.addEventListener('change', updateCombinations);

    function calculateVictoryPaths(combinations) {
        const HarrisPaths = combinations.filter(combo => combo.winner === 'Harris').length;
        const trumpPaths = combinations.filter(combo => combo.winner === 'Trump').length;
        const tiePaths = combinations.filter(combo => combo.winner === 'Tie').length;
        const totalPaths = HarrisPaths + trumpPaths + tiePaths;
        const HarrisPercentage = totalPaths > 0 ? ((HarrisPaths / totalPaths) * 100).toFixed(1) : 0;
        const trumpPercentage = totalPaths > 0 ? ((trumpPaths / totalPaths) * 100).toFixed(1) : 0;
        const tiePercentage = totalPaths > 0 ? ((tiePaths / totalPaths) * 100).toFixed(1) : 0;

        const container = document.getElementById('victory-paths-container');
        container.innerHTML = `
            <div class="victory-paths">
                <p class="victory-paths-cell">Harris Paths: ${HarrisPaths} (${HarrisPercentage}%)</p>
                <p class="victory-paths-cell">Tie Paths: ${tiePaths} (${tiePercentage}%)</p>
                <p class="victory-paths-cell">Trump Paths: ${trumpPaths} (${trumpPercentage}%)</p>  
            </div>
            <div class="paths-summary">
                <p>Paths remaining: ${totalPaths}</p>
            </div>
        `;
    }

    generateInitialCombinations();
    updateCombinations();
});
