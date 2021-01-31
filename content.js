const main = () => {
  const currURL = window.location.href;
  const pattern = /^https:\/\/github\.com\/(([a-z0-9])+)$/i;
  if (pattern.test(currURL)) {
    const ex_usernames = [
      "pulls",
      "requests",
      "marketplace",
      "explore",
      "home",
      "topics",
      "trending",
      "collections",
      "events",
    ];
    const [, username] = currURL.match(pattern);
    // check for excluded usernames
    if (!ex_usernames.some((nm) => nm === username)) {
      console.log("you will run here conway's game of life");
      const h1El = document.querySelector("h1");
      const cwEl = document.createElement("span");
      cwEl.addEventListener("click", handleClick);
      cwEl.textContent = "CWGoL";
      // temp styles I guess
      ["p-nickname", "vcard-username", "d-block"].forEach((c) => {
        cwEl.classList.add(c);
      });
      cwEl.style = "cursor: pointer; user-select: none;";
      h1El.appendChild(cwEl);
    } else {
      console.log("(1) you won't run it here :P");
    }
  } else {
    console.log("(2) you won't run it here :P");
  }
};

const handleClick = () => {
  console.log("next gen ;");
//   let rows = document.getElementsByTagName("tbody")[0].children;
  let rows = document.querySelector('.js-calendar-graph-svg').children[0].children;
  console.log(rows);
  let grid = [];
  let gridNextGen = [];

  for (let i = 0; i < rows.length; i++) {
    // only capture g tags
    if (rows[i].tagName === 'g') {
      let gRow = [];
      let gridNextGenRow = [];
      for (let j = 0; j < rows[i].children.length; j++) {
        gRow.push(rows[i].children[j]);
        gridNextGenRow.push(null);
      }
      // if length is less than 7 complete array
      if (rows[i].children.length < 7) {
        gRow = completeArr(rows[i].children);
      }

      grid.push(gRow);
      gridNextGen.push(gridNextGenRow);
    }
  }

  const neighbors = [
    [-1, -1],
    [-1,  0],
    [-1,  1],
    [ 0, -1],
    [ 0,  1],
    [ 1, -1],
    [ 1,  0],
    [ 1,  1],
  ];

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      nbCount = 0;
      for (let n = 0; n < neighbors.length; n++) {
        const row = i + neighbors[n][0];
        const col = j + neighbors[n][1];

        if (row < 0 || row > grid.length - 1) continue;
        if (col < 0 || col > grid.length - 1) continue;

        // nbCount += grid[row][col].checked ? 1 : 0;
        nbCount += checkIsAlive(grid[row][col]) ? 1 : 0;
      }

      let isAlive = checkIsAlive(grid[i][j]);
      if (isAlive) {
        if (nbCount < 2 || nbCount > 3) {
          isAlive = false;
        }
      } else {
        if (nbCount === 3) {
          isAlive = true;
        }
      }
      gridNextGen[i][j] = getFillName(isAlive);
    }
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      grid[i][j].setAttribute('fill', gridNextGen[i][j]);
    }
  }
};

const checkIsAlive = (daySquare) => {
  try {
    const regAlive = /^var\(--color-calendar-graph-day-L[0-9]-bg\)$/;
    if (regAlive.test(daySquare.getAttribute('fill'))) return true;
    return false;
  } catch (e) {
    console.log(e);
  }
}

const getFillName = (isAlive) => {
  if(isAlive) return 'var(--color-calendar-graph-day-L1-bg)';
  return 'var(--color-calendar-graph-day-bg)';
}

const completeArr = (column) => {
  const completeYs = [0, 13, 26, 39, 52, 65, 78];
  const notMissingIdx = [];
  for(let i=0; i<column.length; i++) {
    if(completeYs.some(y => y == column[i].getAttribute('y')))
      notMissingIdx.push(i);
  }
  let fullArr = [];
  for(let i=0; i<column.length; i++) {
    if(!notMissingIdx[i])
      fullArr.push(new MockGTAG());
    else
      fullArr.push(column[i]);
  }
  return fullArr;
}

class MockGTAG {
  constructor() {
    this.isAlive = false;
  }

  getAttribute() {
    if(this.isAlive) 
      return 'var(--color-calendar-graph-day-L1-bg)'
    return 'var(--color-calendar-graph-day-bg)'
  }

  setAttribute() {
    return;
  }
}

main();
