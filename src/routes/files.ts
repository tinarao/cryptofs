import { Hono } from "hono";

export const fileRoutes = new Hono()
    .post("/", async c => {
        const data = await c.req.parseBody();
        const file = data['file'];
        if (!(file instanceof File)) {
            console.log('we no got file');
            return c.json({ 'message': 'Bad request' }, 400);
        }

        // get format
        const arr = file.name.split(".");
        const format = arr[arr.length - 1]

        // hashing
        const crypter = new Bun.CryptoHasher("sha256");
        crypter.update(file);
        const res = crypter.digest("hex");

        let pathname: string = "";
        let counter = 0;
        res.split("").forEach(i => {
            if (counter % 4 === 0) {
                pathname += "/";
            }
            pathname += i;
            counter++;
        })

        const blob = new Blob([file]);
        const bytes = await Bun.write(`files/${pathname}`, blob);

        return c.json({
            pathname,
            bytes,
            initial: {
                format,
                name: file.name,
            }
        })
    })