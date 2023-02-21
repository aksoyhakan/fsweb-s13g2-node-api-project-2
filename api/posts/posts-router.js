// post routerları buraya yazın

const express = require("express");
const cors = require("cors");
const Posts = require("./posts-model");

const router = express.Router();

router.use(express.json());
router.use(cors());

router.get("/", (req, res) => {
  Posts.find()
    .then((response) => res.status(200).json(response))
    .catch((err) => res.status(500).json({ message: "Gönderiler alınamadı" }));
});

router.get("/:id", (req, res) => {
  Posts.findById(req.params.id)
    .then((response) => {
      response
        ? res.status(200).json(response)
        : res
            .status(404)
            .json({ message: "Belirtilen ID'li gönderi bulunamadı" });
    })
    .catch((err) =>
      res.status(500).json({ message: "Gönderi bilgisi alınamadı" })
    );
});

router.post("/", (req, res) => {
  if (req.body.title && req.body.contents) {
    Posts.insert(req.body)
      .then((response) => res.status(201).json(response))
      .catch((err) =>
        res
          .status(500)
          .json({ message: "Veritabanına kaydedilirken bir hata oluştu" })
      );
  } else {
    res
      .status(400)
      .json({ message: "Lütfen gönderi için bir title ve contents sağlayın" });
  }
});

router.put("/:id", (req, res) => {
  if (req.body.title && req.body.contents) {
    Posts.update(req.params.id, req.body)
      .then((response) => {
        response
          ? res.status(200).json(response)
          : res
              .status(404)
              .json({ message: "Belirtilen ID'li gönderi bulunamadı" });
      })
      .catch((err) =>
        res.status(500).json({ message: "Gönderi bilgileri güncellenemedi" })
      );
  } else {
    res
      .status(400)
      .json({ message: "Lütfen gönderi için bir title ve contents sağlayın" });
  }
});

router.delete("/:id", (req, res) => {
  Posts.remove(req.params.id)
    .then((response) =>
      response
        ? res.status(200).json({ message: "Başarılı bir şekilde silindi" })
        : res
            .status(404)
            .json({ message: "Belirtilen ID li gönderi bulunamadı" })
    )
    .catch((err) => res.status(500).json({ message: "Gönderi silinemedi" }));
});

router.get("/:id/comments", (req, res) => {
  Posts.findPostComments(Number(req.params.id))
    .then((response) => {
      console.log(response);
      response.length > 0
        ? res.status(200).json(response)
        : res
            .status(404)
            .json({ message: "Girilen ID'li gönderi bulunamadı." });
    })
    .catch((err) =>
      res.status(500).json({ message: "Yorumlar bilgisi getirilemedi" })
    );
});
module.exports = router;
