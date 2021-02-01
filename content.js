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
      // get colors levels
      const colors = getColorsLevels();
      cwEl.addEventListener("click",_ => handleClick(colors));
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

const getColorsLevels = () => {
  let rows = document.querySelector('.js-calendar-graph-svg').children[0].children;
  const regAlive = /^var\(--color-calendar-graph-day-L([0-9])-bg\)$/;
  const colors = {};
  for(let i=0; i<rows.length; i++) {
    for(let j=0; j<rows[i].children.length; j++) {
      if (rows[i].tagName === 'g') {
        const fillAttr = rows[i].children[j].getAttribute('fill');
        if (regAlive.test(fillAttr)) {
          const colorLevel = fillAttr.match(regAlive)[1];
          if(colors[colorLevel]) {
            colors[colorLevel]++;
          } else {
            colors[colorLevel] = 1;
          }
        }
      }
    }
  }

  let colorArr = [];
  for (const [key, value] of Object.entries(colors)) {
    colorArr.push({level: Number(key), val: value})
  }

  colorArr.sort((a, b) => a.level - b.level);
  return colorArr;
}

const handleClick = (colors) => {
  console.log("next gen ;");
  let rows = document.querySelector('.js-calendar-graph-svg').children[0].children;
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

        const neighbor = grid[row][col];
        if(neighbor)
          nbCount += checkIsAlive(neighbor) ? 1 : 0;
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
      gridNextGen[i][j] = getFillName(isAlive, colors);
    }
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      grid[i][j].setAttribute('fill', gridNextGen[i][j]);
    }
  }
};

const checkIsAlive = (daySquare) => {
  const regAlive = /^var\(--color-calendar-graph-day-L[0-9]-bg\)$/;
  if (regAlive.test(daySquare.getAttribute('fill'))) return true;
  return false;
}

const getFillName = (isAlive, colors) => {
  if(isAlive) {
    const total = colors.reduce((acc, curr) => acc += curr.val, 0);
    const randVal = Math.floor(Math.random() * total);
    let colorToSet;
    let colorCurrSum = 0;
    let colorPrevSum = 0;
    for(let i=0; i<colors.length; i++) {
      colorCurrSum += colors[i].val;
      colorPrevSum += colors[i-1]?.val ?? 0;
      if (randVal >= colorPrevSum && randVal < colorCurrSum) {
        colorToSet = colors[i];
        break;
      }
    }
    return `var(--color-calendar-graph-day-L${colorToSet.level}-bg)`;
  }
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
