class Calendar {
  constructor() {
    this.originalGraph;
    this.workingGraph;
    this.dateRange = {
      from: '',
      to: '',
    }
    this.colors;
  }

  updateDateRange(from, to) {
    this.dateRange.from = from;
    this.dateRange.to = to;
  }

  updateGraphs(types) {
    const newGraph = this.getDOMGraph();
    if (types.some(type => type === 'ORIGINAL')) {
      this.originalGraph = newGraph;
    }
    if (types.some(type => type === 'WORKING')) {
      this.workingGraph = newGraph;
    }
  }

  getDOMGraph() {
    return document.querySelector('.js-calendar-graph-svg').children[0].children;
  }

  updateColorsLevels() {
    let rows = this.originalGraph;
    // const regAlive = /^var\(--color-calendar-graph-day-L([0-9])-bg\)$/;
    const colors = {};
    for(let i=0; i<rows.length; i++) {
      for(let j=0; j<rows[i].children.length; j++) {
        if (rows[i].tagName === 'g') {
          const colorLevel = rows[i].children[j].getAttribute('data-level');
          if (colorLevel !== '0') {
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
    this.colors = colorArr;
  }

  adapterHandler(bluePrint) {
    let grid = [];
    for (let i = 0; i < this.workingGraph.length; i++) {
      // only capture g tags
      if (this.workingGraph[i].tagName === 'g') {
        let gRow = [];
        // if length is less than 7 complete array
        if (this.workingGraph[i].children.length < 7) {
          gRow = this.completeArr(this.workingGraph[i].children);
        } else {
          for (let j = 0; j < this.workingGraph[i].children.length; j++) {
            gRow.push(this.workingGraph[i].children[j]);
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
    // const regAlive = /^var\(--color-calendar-graph-day-L[0-9]-bg\)$/;
    if (daySquare.getAttribute('data-level') !== '0') return true;
    return false;
  }

  mockGTag() {
    class MockGTAG {
      constructor() {
        this.isAlive = false;
      }

      getAttribute() {
        if(this.isAlive)
          return '1'
        return '0'
      }

      setAttribute() {
        return;
      }
    }
    return new MockGTAG();
  }

  renderGraph(newTerrain) {
    for(let i=0; i<newTerrain.length; i++) {
      for(let j=0; j<newTerrain[i].length; j++) {
        const square = this.workingGraph[i].children[j];
        // some sqaueres might be null
        // because its length it's less than 7
        if(square)
          square.setAttribute('data-level', this.getColorLevel(newTerrain[i][j].isAlive));
      }
    }
  }

  getColorLevel = (isAlive) => {
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
      return `${colorToSet.level}`;
    }
    return '0';
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

chrome.runtime.onMessage.addListener(gotMessage);

const calendar = new Calendar();
const conway = new ConWay();
function gotMessage(request, sender, sendResonse) {
  const calendarGraph = document.querySelector('.js-calendar-graph');
  const dateFrom = calendarGraph.getAttribute('data-from'),
        dateTo = calendarGraph.getAttribute('data-from');

  // validate if calendar graph is showing on the page
  if(calendarGraph) {
    // the user changed the calendar data or
    // the calendar it's been shown for the first time
    if(calendar.dateRange.from !== dateFrom ||
      calendar.dateRange.to !== dateTo) {
      calendar.updateDateRange(dateFrom, dateTo);
      calendar.updateGraphs(['ORIGINAL', 'WORKING'])
      calendar.updateColorsLevels();
      // calendar is the same compute next gen
    } else {
      calendar.updateGraphs(['WORKING'])
    }
    conway.populateTerrain(calendar.adapterHandler.bind(calendar));
    conway.nextGen();
    calendar.renderGraph(conway.terrain);
  }
}
