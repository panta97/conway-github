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
      const h1El = document.querySelector("h1");
      const cwEl = document.createElement("span");
      // initialize main classes
      const bridge = new Bridge();
      const conway = new ConWay();
      cwEl.addEventListener("click",_ => handleClick(bridge, conway));
      cwEl.textContent = "CWGoL";
      // temp styles I guess
      ["p-nickname", "vcard-username", "d-block"].forEach((c) => {
        cwEl.classList.add(c);
      });
      cwEl.style = "cursor: pointer; user-select: none;";
      h1El.appendChild(cwEl);
    }
  }
};

class Bridge {
  constructor() {
    this.terrain;
    this.colors = this.getColorsLevels();
  }

  updateTerrain() {
    this.terrain = document.querySelector('.js-calendar-graph-svg').children[0].children;
  }

  getColorsLevels() {
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

  adapterHandler(bluePrint) {
    let grid = [];
    for (let i = 0; i < this.terrain.length; i++) {
      // only capture g tags
      if (this.terrain[i].tagName === 'g') {
        let gRow = [];
        // if length is less than 7 complete array
        if (this.terrain[i].children.length < 7) {
          gRow = this.completeArr(this.terrain[i].children);
        } else {
          for (let j = 0; j < this.terrain[i].children.length; j++) {
            gRow.push(this.terrain[i].children[j]);
          }
        }
        grid.push(gRow.map(r => {
          let auxObj = Object.assign({}, bluePrint);
          auxObj.isAlive = this.checkIsAlive(r);
          return auxObj;
        }));
      }
    }
    return grid;
  }

  completeArr(column) {
    const completeYs = [0, 13, 26, 39, 52, 65, 78];
    const notMissingIdx = [];
    for(let i=0; i<column.length; i++) {
      if(completeYs.some(y => y == column[i].getAttribute('y')))
        notMissingIdx.push(i);
    }
    let fullArr = [];
    for(let i=0; i<completeYs.length; i++) {
      if(notMissingIdx[i] === undefined)
        fullArr.push(this.mockGTag());
      else
        fullArr.push(column[i]);
    }
    return fullArr;
  }

  checkIsAlive(daySquare) {
    const regAlive = /^var\(--color-calendar-graph-day-L[0-9]-bg\)$/;
    if (regAlive.test(daySquare.getAttribute('fill'))) return true;
    return false;
  }

  mockGTag() {
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
    return new MockGTAG();
  }

  setNextGen(newTerrain) {
    for(let i=0; i<newTerrain.length; i++) {
      for(let j=0; j<newTerrain[i].length; j++) {
        const square = this.terrain[i].children[j];
        // some sqaueres might be null
        // because its length it's less than 7
        if(square)
          square.setAttribute('fill', this.getFillName(newTerrain[i][j].isAlive));
      }
    }
  }

  getFillName = (isAlive) => {
    if(isAlive) {
      const total = this.colors.reduce((acc, curr) => acc += curr.val, 0);
      const randVal = Math.floor(Math.random() * total);
      let colorToSet;
      let colorCurrSum = 0;
      let colorPrevSum = 0;
      for(let i=0; i<this.colors.length; i++) {
        colorCurrSum += this.colors[i].val;
        colorPrevSum += this.colors[i-1]?.val ?? 0;
        if (randVal >= colorPrevSum && randVal < colorCurrSum) {
          colorToSet = this.colors[i];
          break;
        }
      }
      return `var(--color-calendar-graph-day-L${colorToSet.level}-bg)`;
    }
    return 'var(--color-calendar-graph-day-bg)';
  }
}


class ConWay {
  constructor() {
    this.terrain;
    this.neighbors = [
      [-1, -1],
      [-1,  0],
      [-1,  1],
      [ 0, -1],
      [ 0,  1],
      [ 1, -1],
      [ 1,  0],
      [ 1,  1],
    ];
  }

  populateTerrain(adapterHandler) {
    const bluePrintSqr = {
      isAlive: false,
    }
    // terrain must be an array of arrays of blueprintsqr
    this.terrain = adapterHandler(bluePrintSqr);
  }

  nextGen() {
    let grid = this.terrain;
    // make a copy by value
    let gridNextGen = this.terrain
      .map(r => r.map(c => Object.assign({}, c)));

    // compute next gen
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        let nbCount = 0;
        for (let n = 0; n < this.neighbors.length; n++) {
          const row = i + this.neighbors[n][0];
          const col = j + this.neighbors[n][1];

          // check if it's outside of boundaries
          if (row < 0 || row > grid.length - 1) continue;
          if (col < 0 || col > grid[i].length - 1) continue;

          const neighbor = grid[row][col];
          nbCount += neighbor.isAlive ? 1 : 0;
        }

        let isAlive = grid[i][j].isAlive;
        if (isAlive) {
          if (nbCount < 2 || nbCount > 3) {
            isAlive = false;
          }
        } else {
          if (nbCount === 3) {
            isAlive = true;
          }
        }
        gridNextGen[i][j].isAlive = isAlive;
      }
    }
    this.terrain = gridNextGen;
  }
}

const handleClick = (bridge, conway) => {
  bridge.updateTerrain();
  conway.populateTerrain(bridge.adapterHandler.bind(bridge));
  conway.nextGen();
  bridge.setNextGen(conway.terrain);
};

main();
