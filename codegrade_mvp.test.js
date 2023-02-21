const request = require("supertest");
const server = require("./api/server");
const db = require("./data/db-config");

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("comments").truncate();
  await db("posts").truncate();
});
afterAll(async () => {
  await db.destroy();
});

test("[0] sanity check", () => {
  expect(true).not.toBe(false);
});

const post1 = {
  title: "title 1",
  contents: "I wish the ring had never come to me.",
};

const post2 = {
  title: "title 2",
  contents: "I think we should get off the road.",
};

describe("server.js", () => {
  describe("[GET] /api/posts", () => {
    test("[1] doğru gönderi sayısı alıyor", async () => {
      let res = await request(server).get("/api/posts");
      expect(res.body).toHaveLength(0);
      await db("posts").insert(post1);
      res = await request(server).get("/api/posts");
      expect(res.body).toHaveLength(1);
      await db("posts").insert(post2);
      res = await request(server).get("/api/posts");
      expect(res.body).toHaveLength(2);
    }, 750);
    test("[2] tüm postları alıyor", async () => {
      await db("posts").insert(post1);
      await db("posts").insert(post2);
      let res = await request(server).get("/api/posts");
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toMatchObject(post1);
      expect(res.body[1]).toHaveProperty("id");
      expect(res.body[1]).toMatchObject(post2);
    }, 750);
  });
  describe("[GET] /api/posts/:id", () => {
    test("[3] id ye göre doğru postları alıyor", async () => {
      await db("posts").insert(post1);
      await db("posts").insert(post2);
      let res = await request(server).get("/api/posts/1");
      expect(res.body).toHaveProperty("id");
      expect(res.body).toMatchObject(post1);
      res = await request(server).get("/api/posts/2");
      expect(res.body).toHaveProperty("id");
      expect(res.body).toMatchObject(post2);
    }, 750);
    test("[4] post yoksa 404 yanıtlıyor", async () => {
      let res = await request(server).get("/api/posts/111");
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/bulunamadı/i);
    }, 750);
  });
  describe("[POST] /api/posts", () => {
    test("[5] 201 yanıtlıyor", async () => {
      const res = await request(server).post("/api/posts").send(post1);
      expect(res.status).toBe(201);
    }, 750);
    test("[6] yeni postu döndürüyor", async () => {
      let res = await request(server).post("/api/posts").send(post1);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toMatchObject({ id: 1 });
      res = await request(server).post("/api/posts").send(post2);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toMatchObject({ id: 2 });
    }, 750);
    test("[7] title ve contents yokken 400 yanıtlıyor", async () => {
      let res = await request(server).post("/api/posts").send({ title: "foo" });
      expect(res.status).toBe(400);
      res = await request(server).post("/api/posts").send({ contents: "bar" });
      expect(res.status).toBe(400);
    }, 750);
  });
  describe("[PUT] /api/posts/:id", () => {
    test("[8] güncellenen postu döndürüyor", async () => {
      const [id] = await db("posts").insert(post1);
      const updates = { title: "xxx", contents: "yyy" };
      const res = await request(server).put(`/api/posts/${id}`).send(updates);
      expect(res.body).toEqual(1);
    }, 750);
    test("[9] güncellenen veriyi veritabanına kaydediyor", async () => {
      const [id] = await db("posts").insert(post2);
      const updates = { title: "aaa", contents: "bbb" };
      await request(server).put(`/api/posts/${id}`).send(updates);
      let user = await db("posts").where({ id }).first();
      expect(user).toMatchObject({ id, ...updates });
    }, 750);
    test("[10] bad id durumunda doğru mesaj ve yanıt", async () => {
      const updates = { title: "xxx", contents: "yyy" };
      const res = await request(server).put("/api/posts/foobar").send(updates);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/bulunamadı/i);
    }, 750);
    test("[11] responds with the correct message & status code on validation problem", async () => {
      const [id] = await db("posts").insert(post2);
      let updates = { title: "xxx" };
      let res = await request(server).put(`/api/posts/${id}`).send(updates);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/title ve contents/i);
      updates = { contents: "zzz" };
      res = await request(server).put(`/api/posts/${id}`).send(updates);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/title ve contents/i);
      updates = {};
      res = await request(server).put(`/api/posts/${id}`).send(updates);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/title ve contents/i);
    }, 750);
  });
  describe("[DELETE] /api/posts/:id", () => {
    test("[12] post yoksa 404 yanıtlıyor", async () => {
      let res = await request(server).delete("/api/posts/111");
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/bulunamadı/i);
    }, 750);
    test("[13] silinen postu döndürüyor", async () => {
      await db("posts").insert(post1);
      let res = await request(server).delete("/api/posts/1");
      expect(res.body).toMatchObject({
        message: "Başarılı bir şekilde silindi",
      });
    }, 750);
    test("[14] silineni vtden de siliyor", async () => {
      const [id] = await db("posts").insert(post2);
      let post = await db("posts").where({ id }).first();
      expect(post).toBeTruthy();
      await request(server).delete("/api/posts/" + id);
      post = await db("posts").where({ id }).first();
      expect(post).toBeFalsy();
    }, 750);
  });
  describe("[GET] /api/posts/:id/comments", () => {
    test("[15] post yoksa 404 yanıtlıyor", async () => {
      let res = await request(server).get("/api/posts/66/comments");
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/bulunamadı/i);
    }, 750);
    test("[16] verilen idli postun yorumları döndürülüyor", async () => {
      await db("posts").insert(post1);
      await db("posts").insert(post2);
      const comments = [
        { text: "foo", post_id: 1 },
        { text: "bar", post_id: 1 },
        { text: "baz", post_id: 2 },
      ];
      await db("comments").insert(comments);
      let res = await request(server).get("/api/posts/1/comments");
      expect(res.body).toHaveLength(2);
      expect(res.body).toMatchObject([comments[0], comments[1]]);
      res = await request(server).get("/api/posts/2/comments");
      expect(res.body).toHaveLength(1);
      expect(res.body).toMatchObject([comments[2]]);
    }, 750);
  });
});
