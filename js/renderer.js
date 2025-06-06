// Import AppState and CONFIG
import { AppState, CONFIG } from './config.js';
import { CATEGORY_ORDER } from './variables.js';

export function renderMatches(matches) {
    const container = document.getElementById('result');
    // Clear the container before rendering
    container.innerHTML = '';
    const groupedMatches = groupMatchesByLeague(matches);
    // sort with the custom order
    const sortedGroups = {};
    Object.keys(groupedMatches).sort((a, b) => customSort(a, b, CATEGORY_ORDER)).forEach(function (key) {
        sortedGroups[key] = groupedMatches[key];
    });

    for (const league in sortedGroups) {
        const leagueTitle = document.createElement('h2');
        leagueTitle.innerText = league;
        leagueTitle.classList.add('text-left'); 
        leagueTitle.classList.add('hockey-category');
        container.appendChild(leagueTitle);

        const table = document.createElement('table');
        table.classList.add('table', 'table-striped', 'table-bordered', 'table-sm', 'matches-table');
        table.style.marginBottom = '2px';

        // Add table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Data</th>
                <th>Hora</th>
                <th></th>
                <th>Local</th>
                <th>Visitante</th>
                <th>Lugar</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        groupedMatches[league].forEach(match => {
            const row = document.createElement('tr');
            if (match.soon) {
                row.classList.add('table-warning');
                row.classList.add('match-soon');
            }
            row.innerHTML = `<td>${match.formatted_date}</td><td>${match.time}</td><td></td><td>${match.team1}</td><td>${match.team2}</td><td>${match.location}</td>`;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    }
    // get only tables inside result
    const tables = document.querySelectorAll('table.matches-table');
    tables.forEach(table => add_gcal_button(table));
}

function groupMatchesByLeague(matches) {
    const groupedMatches = {};
    matches.forEach(match => {
        const league = match.league;
        if (!groupedMatches[league]) {
            groupedMatches[league] = [];
        }
        groupedMatches[league].push(match);
    });
    return groupedMatches;
}

function showMatchDetails(match) {
    const modalHtml = `
        <div class="modal fade" id="matchDetailsModal" tabindex="-1" role="dialog" aria-labelledby="matchDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="matchDetailsModalLabel">${match.league}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Date:</strong> ${match.formatted_date}</p>
                        <p><strong>Time:</strong> ${match.time}</p>
                        <p><strong>Teams:</strong> ${match.team1} vs ${match.team2}</p>
                        <p><strong>Location:</strong> ${match.location}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    $('body').append(modalHtml);
    $('#matchDetailsModal').modal('show');
    $('#matchDetailsModal').on('hidden.bs.modal', function () {
        $(this).remove();
    });
}

export function replace_name_in_cells() {
    const targetString = 'HOCKEY CLUB RAXOI';
    const newString = 'HC RAXOI';

    const cells = document.querySelectorAll('td');
    cells.forEach(cell => {
        const originalContent = cell.textContent;
        if (originalContent.includes(targetString)) {
            cell.textContent = cell.textContent.replace(targetString, newString);
        }

        if (originalContent.includes("RAXOI")) {
            cell.classList.add('important');
        }
    });
}

/**
 * Custom sort function that sorts strings based on a predefined category order.
 * If both strings start with the same category, they are compared lexicographically.
 * If one string starts with a category and the other does not, the one that starts with the category comes first.
 * If neither string starts with any category, they are compared lexicographically.
 *
 * @param {string} a - The first string to compare.
 * @param {string} b - The second string to compare.
 * @param {string[]} categoryOrder - An array of category names in the desired order.
 * @returns {number} - Returns -1 if `a` should come before `b`, 1 if `a` should come after `b`, or 0 if they are considered equal.
 */
function customSort(a, b, categoryOrder = CATEGORY_ORDER) {
    for (var i = 0; i < categoryOrder.length; i++) {
        var startA = a.startsWith(categoryOrder[i]);
        var startB = b.startsWith(categoryOrder[i]);
        if (startA && startB) {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        } else if (startA) {
            return -1;
        } else if (startB) {
            return 1;
        }
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Helper function to filter matches for next X days
function filterMatchesNextXDays(matches, numberOfDays = 6) {
    const today = new Date();
    // just consider the date, not the time
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date();
    cutoff.setDate(today.getDate() + numberOfDays);
    return matches.filter(match => {
        // Date came in that format: '22/02/2025'
        const [day, month, year] = match.date.split('/').map(Number);
        const matchDate = new Date(year, month - 1, day);
        return matchDate >= today && matchDate <= cutoff;
    });
}

// Export the is_soon function to make it globally available
export function is_soon(date, in_next_days=7) {
    const now = new Date();
    return date.getTime() - now.getTime() < in_next_days * 24 * 60 * 60 * 1000;
}

export function setupCategoryFilter(allMatches) {
  const uniqueCategories = [...new Set(allMatches.map(match => match.league))];
  const filterForm = document.getElementById('filterForm');
  
  // Clear existing checkboxes
  filterForm.innerHTML = '';

  // Populate checkboxes dynamically
  uniqueCategories.forEach(category => {
    const checkbox = document.createElement('div');
    checkbox.className = 'form-check';
    checkbox.innerHTML = `
      <input class="form-check-input" type="checkbox" value="${category}" id="filter-${category}" checked>
      <label class="form-check-label" for="filter-${category}">
        ${category}
      </label>
    `;
    filterForm.appendChild(checkbox);
  });
  
  // Load saved categories from AppState
  const savedCategories = AppState.getSelectedCategories();
  if (savedCategories.length > 0) {
    document.querySelectorAll('#filterForm input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = savedCategories.includes(checkbox.value);
    });
  }

  // Apply filter logic
  document.getElementById('applyFilter').addEventListener('click', () => {
    const selectedCategories = Array.from(filterForm.querySelectorAll('input:checked')).map(input => input.value);
    
    // Save to centralized state
    AppState.setSelectedCategories(selectedCategories);
    
    // First filter by categories
    let filteredMatches = allMatches.filter(match => selectedCategories.includes(match.league));
    
    // Then apply date filter if enabled
    if (AppState.getFilterMode()) {
      filteredMatches = filterMatchesNextXDays(filteredMatches, CONFIG.NUMBER_OF_NEXT_DAYS);
    }

    if (filteredMatches.length === 0) {
      console.warn('No matches found for the selected categories:', selectedCategories);
    }

    renderMatches(filteredMatches);
    $('#filterModal').modal('hide');
  });
}

export function sortMatchesUsingCategoryOrder(matches) {
  return matches.sort((a, b) => customSort(a.league, b.league, CATEGORY_ORDER));
}
