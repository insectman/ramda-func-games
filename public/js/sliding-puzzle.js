
const getTiles = R.prop('tt');
const getWidth = R.prop('w');
const getHeight = R.prop('h');
const isEven = n => n % 2 === 0;


// array functions

const swapElements = (a, i1, i2) =>
  ((v1, v2) => R.pipe(
    R.set(R.lensIndex(i1), v2)
    , R.set(R.lensIndex(i2), v1)
  )(a))(...R.props([i1, i2])(a))

const getRandomElementWithHigherIndex = ((random) => (array) => (i) =>
  i + Math.floor(random() * (array.length - i))
)(Math.random)      // impure function, can't avoid that

const shuffle = (array) =>
  array.reduce((a, e, i) =>
    swapElements(a, i, getRandomElementWithHigherIndex(array)(i))
    , [...array]);

// object functions

const findRowByIndex = (i) =>
  R.pipe(getWidth, R.divide(i), Math.floor);


const findRowByValue = (e) => R.converge(
  (i, s) => findRowByIndex(i)(s)
  , [R.pipe(getTiles, R.indexOf(e))
    , R.identity]
);


const findColumnByIndex = (i) =>
  R.pipe(getWidth, R.modulo(i));

const findColumnByValue = (e) => R.converge(
  (i, s) => findColumnByIndex(i)(s)
  , [R.pipe(getTiles, R.indexOf(e))
    , R.identity]
);

const getBlankRowFromBottom = R.converge(
  R.subtract
  , [getHeight, findRowByValue(0)]);

const shuffleTiles = R.over(R.lensProp('tt'), shuffle);

const countInversions = R.pipe(getTiles,
  (tt) => tt.filter(e => e).reduce((a, e, i, Arr) =>
    a + Arr.slice(i).reduce((aa, ee, ii) =>
      aa + (e > ee)
      , 0)
    , 0)
);

const areTilesAdjacent = (r, r0, c, c0) =>
  (Math.abs(r - r0) + Math.abs(c - c0) == 1)
  && (r === r0 || c === c0)

const isValidAction = (tileIndex) =>
  R.converge(
    areTilesAdjacent
    , [findRowByIndex(tileIndex)
      , findRowByValue(0)
      , findColumnByIndex(tileIndex)
      , findColumnByValue(0)]
  );

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

const checkForVictory = R.ifElse(
  R.pipe(countInversions, R.equals(0))
  , R.tap(() => $('figcaption.state').text('victory'))
  , R.identity);

const initState = R.pipe(shuffleTiles, R.until(checkForSolvability, shuffleTiles));



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
