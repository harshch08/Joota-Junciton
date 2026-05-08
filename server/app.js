const reviewsRouter = require('./routes/reviews');
const assistantRouter = require('./routes/assistant');

app.use('/api/reviews', reviewsRouter);
app.use('/api/assistant', assistantRouter);
app.use('/uploads/reviews', express.static('uploads/reviews')); 