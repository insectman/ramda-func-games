$(document).ready(function() {

  let state = initState(initStateProps);

  /*
  const draw = ((s) => () => {
    drawFn(s)
  })(state);
  */

  init(state);

  draw(state);

});
