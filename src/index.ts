import app from './app';

const main = () => {
    const port = Bun.env.PORT || 3000;

    Bun.serve({
        port: port,
        fetch: app.fetch,
    });

    console.log(`Serving at ${port}`);
};

main();