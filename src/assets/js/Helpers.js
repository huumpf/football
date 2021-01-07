export function moneyStr(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function getBiasedRnd (min, max, bias, influence, mixfactor) {
  let rnd = Math.random() * (max - min) + min;
  let mix = mixfactor * influence;
  return rnd * (1 - mix) + bias * mix;
}

export function map(n, start1, stop1, start2, stop2, withinBounds) {
  var newval = ((n - start1)/(stop1 - start1)) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return newval;
  }
  return this.constrain(newval, start2, stop2);
}