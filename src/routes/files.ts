import { Hono } from "hono";
import { unlink } from "node:fs/promises";
import prisma from "../../prisma/client";

export const fileRoutes = new Hono()
    .get("/all", async c => {
        const data = await prisma.storedFile.findMany()
        return c.json(data);
    })
    .get("/:id{^[0-9]+$}", async c => {
        // returns info about file by id
        const id = parseInt(c.req.param('id'));
        const foundFile = await prisma.storedFile.findFirst({
            where: { id: id }
        })
        if (!foundFile) return c.json({ "message": "File not found" }, 404);

        return c.json({ foundFile });
    })
    .get("/file/:id{^[0-9]+$}", async c => {
        // returns a file by id
        const id = parseInt(c.req.param('id'));
        const foundFile = await prisma.storedFile.findFirst({
            where: { id: id }
        })
        if (!foundFile) return c.json({ "message": "File not found" }, 404);

        const thisFile = Bun.file(`files/${foundFile.filepath}`);
        const bytes = await thisFile.arrayBuffer();
        const file = new File([bytes], foundFile.originalName);

        return new Response(file, { status: 200 });
    })
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

        const created = await prisma.storedFile.create({
            data: {
                filepath: pathname,
                originalName: file.name,
                format: format,
                bytes: bytes
            }
        })
        if (!created) {
            await unlink(`files/${pathname}`);
            return c.json({ "message": "Произошла ошибка при сохранении файла" }, 500);
        }

        return c.json({
            created
        })
    })
    .delete("/:id{^[0-9]+$}", async c => {
        const id = parseInt(c.req.param('id'));
        const foundVideo = await prisma.storedFile.findFirst({
            where: { id: id }
        })
        if (!foundVideo) return c.json({ "message": "Video not found" }, 404);

        await unlink(`files/${foundVideo.filepath}`);

        await prisma.storedFile.delete({ where: { id: foundVideo.id } });
        return c.json({ "message": `File ${foundVideo.originalName} deleted` });
    })