const reviewsRouter = require('./routes/reviews');

app.use('/api/reviews', reviewsRouter);
app.use('/uploads/reviews', express.static('uploads/reviews')); 