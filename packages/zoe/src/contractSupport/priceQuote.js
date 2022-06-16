// @ts-check

// PriceAuthorities return quotes as a pair of an amount and a payment, both
// with the same value. The underlying amount wraps amountIn, amountOut, timer
// and timestamp. The payment is issued by the quoteIssuer to support veracity
// checking. These helpers make it easier to extract the components of the Quote

/**
 * @param {PriceQuote} quote
 * @returns {PriceDescription}
 */
export const getPriceDescription = quote => {
  assert(
    quote.quoteAmount.value.length === 1,
    'quoteAmount set must have one member',
  );
  return quote.quoteAmount.value[0];
};

/** @param {PriceQuote} quote */
export const getAmountIn = quote => getPriceDescription(quote).amountIn;
/** @param {PriceQuote} quote */
export const getAmountOut = quote => getPriceDescription(quote).amountOut;
/** @param {PriceQuote} quote */
export const getTimestamp = quote => getPriceDescription(quote).timestamp;
