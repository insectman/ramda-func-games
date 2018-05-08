// helpers
const getTiles = R.prop('tt');
const getWidth = R.prop('w');
const getHeight = R.prop('h');
const isEven = n => n % 2 === 0;

// array functions

// returns an array copy with swapped elements
const swapElements = (a, i1, i2) =>
  ((v1, v2) => R.pipe(
    R.set(R.lensIndex(i1), v2)
    , R.set(R.lensIndex(i2), v1)
  )(a))
    (...R.props([i1, i2])(a))// get element values at indexes i1 and i2

/* 
impure function, unavoidable because of randomization
accepts an array as an argument, returns a function that will return random index from that array
that is higher than its argument
*/
const getRandomHigherIndex = ((array) => (i) =>
  i + Math.floor(Math.random() * (array.length - i)));

// shuffles an array using Fisher-Yates algorithm
const shuffle = (array) =>
  array.reduce((a, e, i) =>
    swapElements(a, i, getRandomHigherIndex(array)(i))
    , [...array]);


// object functions

// finds tile row by its index
const findRowByIndex = (i) =>
  R.pipe(getWidth, R.divide(i), Math.floor);

// finds tile row by its index
const findRowByValue = (e) => R.converge(
  (i, s) => findRowByIndex(i)(s)
  , [R.pipe(getTiles, R.indexOf(e)) // get tile index by its value
    , R.identity]
);

// finds tile column by its index
const findColumnByIndex = (i) =>
  R.pipe(getWidth, R.modulo(i));

// finds tile column by its name
const findColumnByValue = (e) => R.converge(
  (i, s) => findColumnByIndex(i)(s)
  , [R.pipe(getTiles, R.indexOf(e))
    , R.identity]
);

// finds zero-tile row counting from bottom, starting at 1
const getBlankRowFromBottom = R.converge(
  R.subtract
  , [getHeight, findRowByValue(0)]);

// shuffles tiles array ('tt' property of an object)
const shuffleTiles = R.over(R.lensProp('tt'), shuffle);

/*
An inversion is when a tile precedes another tile with a lower number on it.
The solution state has zero inversions.
*/
const countInversions = R.pipe(getTiles,
  (tt) => tt.filter(e => e) // filter out zero-tile
    .reduce((a, e, i, Arr) =>
      a // accumulator
      + Arr.slice(i) // get array, sliced at current position
        .reduce((aa, ee, ii) => // get number of element lower than current element
          aa + (e > ee)
        , 0) // accumulator declaration, starts at 0
    , 0)
);

// checks if two tiles are adjacent based on their row and coulmn numbers
const areTilesAdjacent = (r, r0, c, c0) =>
  (Math.abs(r - r0) + Math.abs(c - c0) == 1)
  && (r === r0 || c === c0)

// checks if action is valid, i.e. tile is adjacent to empty(zero tile) and, therefore, can be swapped
const isValidAction = (tileIndex) =>
  R.converge(
    areTilesAdjacent
    , [findRowByIndex(tileIndex)
      , findRowByValue(0)
      , findColumnByIndex(tileIndex)
      , findColumnByValue(0)]
  );

// checks if user action is valid, if it is - swaps element with empty tile, otherwise does nothing
const userAction = (tileIndex) =>
  R.ifElse(
    isValidAction(tileIndex)
    , R.pipe(
      R.over(R.lensProp('tt'), R.converge(
        swapElements,
        [R.identity
          , () => tileIndex
          , R.indexOf(0)
        ]))
      , checkForVictory)
    , R.identity
  );

// checks if puzzle can be solved
const checkForSolvability =
  R.converge(
    R.pipe((...args) => args
      , R.map(isEven)
      , R.apply(R.cond([
        //If the grid width is odd, then the number of inversions 
        //in a solvable situation is even.
        [(i, r, w) => !w && i, R.T]
        //If the grid width is even, and the blank is on an even row 
        // counting from the bottom (second-last, fourth-last etc), 
        //then the number of inversions in a solvable situation is odd.
        , [(i, r, w) => w && r && !i, R.T]
        //If the grid width is even, and the blank is on an odd row 
        //counting from the bottom (last, third-last, fifth-last etc) 
        //then the number of inversions in a solvable situation is even.
        , [(i, r, w) => w && !r && i, R.T]
        , [R.T, R.F]])))
    , [countInversions, getBlankRowFromBottom, getWidth]);

// checks if puzzle is solved (it's solved if it has zero inversions)
const checkForVictory = R.ifElse(
  R.pipe(countInversions, R.equals(0))
  , R.tap(() => $('figcaption.state').text('victory'))
  , R.identity);

// initializes state - shuffles tiles until puzzle is solvable
const initState = R.pipe(shuffleTiles, R.until(checkForSolvability, shuffleTiles));

// draws game state
const draw = (state) => {
  state.tt.forEach((e, i) => {
    const style = e === 0 ? 'style="visibility: hidden"' : '';
    if (!$(`ul li[data-index='${i}']`).length) {
      $('ul')
        .append(`<li class='Tile' data-index='${i}' ${style} data-val='${e}'>${e}</li>`);
    } else if (!$(`ul li[data-index='${i}'][data-val='${e}']`).length) {
      $(`ul li[data-index='${i}']`)
        .replaceWith(`<li class='Tile' data-index='${i}' ${style} data-val='${e}'>${e}</li>`);
    }
  });
}

// initialize - set css & js event handlers + draw initial state
const init = (initStateProps) => {

  let state = { ...initStateProps };

  $('.SlidingPuzzleBoard').css({
    'max-height': (70 * state.h + 20) + 'px'
    , 'max-width': (70 * state.w + 20) + 'px'
  });

  $('.SlidingPuzzleBoard .SlidingPuzzle').css({
    'height': 70 * state.h + 'px'
    , 'width': 70 * state.w + 'px'
  });

  $(document).on('click', '.SlidingPuzzle li.Tile', function () {
    state = userAction($(this).data('index'))(state);
    draw(state);
  });

  $(document).on('click', 'figcaption.restart', function () {
    state = initState(initStateProps);
    draw(state);
  });

  draw(state);

}
