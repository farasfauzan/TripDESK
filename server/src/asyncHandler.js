// Express 4 tidak menangkap promise rejection dari handler async.
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next)
}
