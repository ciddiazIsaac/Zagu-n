import app from './app';

const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('CRITICAL WARNING: DATABASE_URL is not set in the environment variables!');
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`Zaguán corriendo en http://localhost:${PORT}`);
});
